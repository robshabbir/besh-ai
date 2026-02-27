const express = require('express');
const twilio = require('twilio');
const db = require('../db');
const logger = require('../utils/logger');
const { processConversation } = require('../services/claude');
const { createBooking, handleEmergency } = require('../services/booking');
const { sendPostCallNotifications } = require('../services/notifications');
const { createDeepgramConnection } = require('../services/deepgram-stt');
const { createElevenLabsStream, speakText, speakTextStreaming } = require('../services/elevenlabs-stream');

const router = express.Router();

/**
 * Main voice webhook — returns TwiML to connect to Media Stream
 */
router.post('/voice-stream', async (req, res) => {
  const callSid = req.body.CallSid;
  const rawTo = (req.body.To || '').trim();
  const rawFrom = (req.body.From || '').trim();
  const toNumber = rawTo.startsWith('+') ? rawTo : '+' + rawTo;
  const fromNumber = rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom;

  logger.info('Incoming call (Media Streams)', { 
    callSid, 
    to: toNumber, 
    from: fromNumber 
  });

  try {
    const tenant = await db.getTenantByPhoneNumber(toNumber) || 
                   await db.getTenantByPhoneNumber(fromNumber);

    if (!tenant) {
      logger.error('No tenant found', { to: toNumber, from: fromNumber });
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say({ voice: 'Polly.Ruth-Generative' }, 
        "Sorry, this number isn't set up yet. Try again later!");
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Create call record
    const callId = await db.createCall(tenant.id, callSid, fromNumber);
    logger.info('Call record created', { callId, tenantId: tenant.id });

    // Build WebSocket URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3100}`;
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws/media-stream?` + 
      new URLSearchParams({
        callSid,
        tenantId: tenant.id,
        callId
      });

    // Return TwiML with <Connect><Stream>
    const twiml = new twilio.twiml.VoiceResponse({
      record: 'record-from-answer-dual',
      recordingStatusCallback: '/api/recording-status',
      recordingStatusCallbackMethod: 'POST'
    });

    const connect = twiml.connect();
    const stream = connect.stream({
      url: wsUrl,
      name: 'BeshMediaStream'
    });
    // Pass params as custom parameters (available in start event)
    stream.parameter({ name: 'tenantId', value: String(tenant.id) });
    stream.parameter({ name: 'callId', value: String(callId) });
    stream.parameter({ name: 'To', value: toNumber });
    stream.parameter({ name: 'From', value: fromNumber });

    logger.info('Media Stream TwiML returned', { callSid, wsUrl });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    logger.error('Voice stream webhook error', { 
      error: error.message, 
      callSid,
      stack: error.stack 
    });
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'Polly.Ruth-Generative' }, 
      "Oh shoot, something went wrong on our end. Try calling back in just a sec.");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * WebSocket handler for Twilio Media Streams
 * Handles bidirectional audio streaming
 */
async function setupMediaStreamWebSocket(wss) {
  logger.info('Media Stream WebSocket server ready on /ws/media-stream');

  wss.on('connection', async (ws, req) => {
    // Try to get params from URL (may be stripped by Twilio)
    const params = new URLSearchParams(req.url.split('?')[1] || '');
    const urlCallSid = params.get('callSid');
    const urlTenantId = parseInt(params.get('tenantId')) || null;
    const urlCallId = parseInt(params.get('callId')) || null;

    logger.info('Media Stream WebSocket connected', { urlCallSid, urlTenantId, urlCallId });

    // Session state — tenant/callSid will be resolved in handleStart
    const session = {
      callSid: urlCallSid,
      tenantId: urlTenantId,
      callId: urlCallId,
      streamSid: null,
      messages: [],
      collected: {},
      intent: null,
      language: 'en',
      turnCount: 0,
      lastActivity: Date.now(),
      isProcessing: false,
      isSpeaking: false,
      deepgram: null,
      elevenLabs: null,
      tenant: null, // resolved async below
      callerPhone: null,
      greetingSent: false,
      audioBuffer: [],
      currentMarkId: 0
    };

    // Resolve tenant async
    if (urlTenantId) {
      try { session.tenant = await db.getTenantById(urlTenantId); } catch (e) { logger.error('Failed to load tenant', { error: e.message }); }
    }

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        session.lastActivity = Date.now();

        switch (msg.event) {
          case 'start':
            await handleStart(ws, session, msg);
            break;

          case 'media':
            handleMedia(ws, session, msg);
            break;

          case 'mark':
            handleMark(ws, session, msg);
            break;

          case 'stop':
            handleStop(ws, session, msg);
            break;

          default:
            logger.debug('Unknown event', { event: msg.event, callSid: session.callSid });
        }
      } catch (error) {
        logger.error('Media Stream message error', { 
          error: error.message, 
          callSid: session.callSid,
          stack: error.stack 
        });
      }
    });

    ws.on('close', () => {
      handleClose(session);
    });

    ws.on('error', (error) => {
      logger.error('Media Stream WebSocket error', { 
        error: error.message, 
        callSid: session.callSid 
      });
    });
  });
}

/**
 * Handle 'start' event from Twilio
 */
async function handleStart(ws, session, msg) {
  session.streamSid = msg.start.streamSid;
  session.callSid = session.callSid || msg.start.callSid || msg.start.streamSid;
  session.callerPhone = msg.start.customParameters?.From || 
                        msg.start.callSid;

  // Resolve tenant if not yet resolved (Twilio strips query params)
  if (!session.tenant) {
    const tenantIdParam = msg.start.customParameters?.tenantId;
    const callIdParam = msg.start.customParameters?.callId;
    
    if (tenantIdParam) {
      session.tenantId = parseInt(tenantIdParam);
      session.callId = parseInt(callIdParam);
      session.tenant = await db.getTenantById(session.tenantId);
    }
    
    // Still no tenant? Look up by phone number
    if (!session.tenant) {
      const toNumber = msg.start.customParameters?.To || msg.start.to;
      const fromNumber = msg.start.customParameters?.From || msg.start.from;
      session.tenant = await db.getTenantByPhoneNumber(toNumber) || 
                       await db.getTenantByPhoneNumber(fromNumber);
      if (session.tenant) {
        session.tenantId = session.tenant.id;
        // Create call record if we don't have one
        if (!session.callId) {
          session.callId = await db.createCall(session.tenant.id, session.callSid, session.callerPhone);
        }
      }
    }
    
    if (!session.tenant) {
      logger.error('Could not resolve tenant in handleStart', { 
        callSid: session.callSid,
        customParams: msg.start.customParameters
      });
      ws.close();
      return;
    }
  }

  // Initialize Deepgram STT now that we have a valid session
  if (!session.deepgram) {
    session.deepgram = createDeepgramConnection(
      async (transcript) => {
        await handleTranscript(ws, session, transcript);
      },
      (error) => {
        logger.error('Deepgram error in session', { 
          callSid: session.callSid, 
          error: error.message 
        });
      }
    );
  }

  logger.info('Media Stream started', {
    callSid: session.callSid,
    streamSid: session.streamSid,
    tenantId: session.tenantId,
    tenant: session.tenant?.name,
    caller: session.callerPhone
  });

  // Send greeting immediately — don't allow barge-in during greeting
  session.greetingPlaying = true;
  setTimeout(async () => {
    if (!session.greetingSent) {
      await sendGreeting(ws, session);
      session.greetingPlaying = false;
    }
  }, 300);
}

/**
 * Handle 'media' event - incoming audio from caller
 */
function handleMedia(ws, session, msg) {
  // Forward audio to Deepgram for transcription
  if (session.deepgram && session.deepgram.isOpen()) {
    session.deepgram.send(msg.media.payload);
  }

  // If AI is currently speaking, detect barge-in
  // (Deepgram will provide transcript which will trigger interrupt)
  if (session.isSpeaking && !session.isProcessing) {
    // We'll handle barge-in when transcript comes through
  }
}

/**
 * Handle 'mark' event - track audio playback position
 */
function handleMark(ws, session, msg) {
  logger.debug('Mark received', { 
    callSid: session.callSid, 
    markName: msg.mark.name 
  });
  
  // Mark indicates audio has been played
  // Can use this to track completion of TTS chunks
}

/**
 * Handle 'stop' event - stream ended
 */
function handleStop(ws, session, msg) {
  logger.info('Media Stream stopped', {
    callSid: session.callSid,
    streamSid: session.streamSid
  });
  
  handleClose(session);
}

/**
 * Handle transcript from Deepgram
 */
async function handleTranscript(ws, session, transcript) {
  // Ignore empty transcripts
  if (!transcript || !transcript.trim()) {
    return;
  }

  session.turnCount++;
  
  logger.info('User speech', {
    callSid: session.callSid,
    turn: session.turnCount,
    text: transcript.substring(0, 100),
    isSpeaking: session.isSpeaking
  });

  // If AI is speaking, this is a barge-in - stop TTS (but not during greeting)
  if (session.isSpeaking && !session.greetingPlaying) {
    logger.info('Barge-in detected, stopping TTS', { callSid: session.callSid });
    
    // Stop current TTS
    if (session.elevenLabs && session.elevenLabs.isOpen()) {
      session.elevenLabs.close();
      session.elevenLabs = null;
    }
    
    // Clear any pending audio
    sendClear(ws, session.streamSid);
    session.isSpeaking = false;
  }

  // Prevent concurrent processing
  if (session.isProcessing) {
    logger.debug('Already processing, queuing...', { callSid: session.callSid });
    return;
  }

  session.isProcessing = true;

  try {
    // Detect Spanish on first turn if supported
    const supportedLanguages = session.tenant.config.languages || ['en'];
    if (session.turnCount === 1 && 
        supportedLanguages.includes('es') && 
        detectSpanish(transcript)) {
      session.language = 'es';
      logger.info('Spanish language detected', { callSid: session.callSid });
      await db.updateCall(session.callSid, { language: 'es' });
    }

    // Build system prompt
    let systemPrompt = session.tenant.config.systemPrompt || '';

    if (session.language === 'es') {
      systemPrompt = "The caller is speaking Spanish. Respond entirely in Spanish. Be natural and conversational in Spanish.\n\n" + systemPrompt;
    }

    // Business hours check
    const features = session.tenant.config.features || {};
    if (features.afterHoursMode && session.tenant.config.businessHours) {
      const withinHours = isWithinBusinessHours(session.tenant.config.businessHours);
      systemPrompt += withinHours ? 
        `\n\n## BUSINESS HOURS STATUS\nWe are currently OPEN and within business hours. Provide full service.` :
        `\n\n## BUSINESS HOURS STATUS\nWe are currently OUTSIDE business hours. Let callers know you'll have someone call them back during business hours, or offer to take a message. Be apologetic but helpful.`;
    }

    // Knowledge base
    if (session.tenant.config.knowledgeBase) {
      systemPrompt += `\n\n## BUSINESS KNOWLEDGE BASE\nUse the following information to answer caller questions accurately:\n\n${session.tenant.config.knowledgeBase}`;
    }

    // Booking settings
    if (features.bookingEnabled === false) {
      systemPrompt += `\n\n## BOOKING DISABLED\nDo not attempt to book appointments. Instead, tell callers someone will call them back to schedule.`;
    }

    // Transfer capability
    const transferPhone = session.tenant.config.transferPhone || 
                         session.tenant.config.businessConfig?.ownerPhone;
    if (transferPhone) {
      systemPrompt += `\n\n## HUMAN HANDOFF\nIf the caller asks to speak with someone or you cannot help them, say something like "Let me transfer you to someone who can help" to initiate a transfer.`;
    }

    // Get AI response — start TTS on FIRST SENTENCE while LLM continues
    const startTime = Date.now();
    const { result, updatedMessages } = await processConversation(
      systemPrompt,
      session.messages,
      transcript
    );
    const aiTime = Date.now() - startTime;

    session.messages = updatedMessages;
    session.collected = { ...session.collected, ...result.collected };
    session.intent = result.intent;

    logger.info('AI response generated', {
      callSid: session.callSid,
      turn: session.turnCount,
      intent: result.intent,
      complete: result.complete,
      aiMs: aiTime,
      responseLength: result.message.length
    });

    // Split response into sentences and TTS them in parallel
    // First sentence plays while remaining sentences generate
    const sentences = splitIntoSentences(result.message);
    if (sentences.length > 1 && ws.readyState === 1) {
      // Fire first sentence TTS immediately, don't await
      const firstTTS = streamTextToSpeech(ws, session, sentences[0]);
      // Generate remaining sentences TTS in parallel
      const restTTS = speakText(sentences.slice(1).join(' '), session.language);
      
      await firstTTS;
      try {
        const restChunks = await restTTS;
        if (ws.readyState === 1) {
          for (const chunk of restChunks) sendAudio(ws, session.streamSid, chunk);
        }
      } catch(e) { logger.error('Rest TTS error', { error: e.message }); }
      
      // Skip the normal streamTextToSpeech below
      session._skipTTS = true;
    }

    // Update call record
    await db.updateCall(session.callSid, {
      transcript: session.messages,
      intent: session.intent,
      collected_data: session.collected
    });

    // Check for transfer intent
    if (transferPhone && detectTransferIntent(result.message)) {
      logger.info('Transfer intent detected', { 
        callSid: session.callSid,
        transferPhone 
      });

      // Stream AI's transfer message first
      await streamTextToSpeech(ws, session, result.message);

      // Mark as transferred
      await db.updateCall(session.callSid, {
        transferred: 1,
        transfer_to: transferPhone
      });

      // Send SMS to owner
      const { sendSMS } = require('../services/notifications');
      const summary = session.collected.service || 
                     session.collected.reason || 
                     'assistance';
      
      setTimeout(async () => {
        try {
          await sendSMS(
            transferPhone,
            session.tenant.phone_number,
            `🔄 Incoming transfer from ${session.callerPhone}\n\nThey need: ${summary}\n\nAnswering now...`
          );
        } catch (e) {
          logger.error('Transfer SMS failed', { error: e.message });
        }
      }, 0);

      // Note: Cannot do actual <Dial> from Media Stream
      // Instead, inform caller and hang up, owner will call back
      setTimeout(async () => {
        const followupMsg = session.language === 'es' ?
          "Le enviaré un mensaje y le devolveremos la llamada de inmediato." :
          "I'll send them a message and they'll call you right back.";
        
        await streamTextToSpeech(ws, session, followupMsg);
        
        // Hang up after a pause
        setTimeout(() => {
          ws.close();
        }, 2000);
      }, 1500);

      session.isProcessing = false;
      return;
    }

    // Stream AI response to caller (skip if already sent via sentence splitting above)
    if (!session._skipTTS) {
      await streamTextToSpeech(ws, session, result.message);
    }
    session._skipTTS = false;

    // If conversation complete, handle post-call actions
    if (result.complete) {
      logger.info('Conversation complete', { 
        callSid: session.callSid, 
        intent: session.intent 
      });

      // Post-call actions (non-blocking)
      setTimeout(async () => {
        try {
          if (result.intent === 'booking' || result.intent === 'new_client') {
            await createBooking(session.tenantId, session.callId, 
                              session.collected, result.intent);
          }
          if (result.intent === 'emergency' || result.urgency === 'emergency') {
            await handleEmergency(session.tenantId, session.callId, 
                                 session.collected);
          }
          const callData = {
            caller_phone: session.callerPhone,
            intent: session.intent,
            collected: session.collected,
            urgency: result.urgency
          };
          await sendPostCallNotifications(session.tenantId, session.callId, 
                                         callData, null);
        } catch (e) {
          logger.error('Post-call action error', { 
            error: e.message, 
            callSid: session.callSid 
          });
        }
      }, 0);

      // Hang up after final message finishes
      setTimeout(() => {
        ws.close();
      }, 3000);
    }

  } catch (error) {
    logger.error('Transcript handling error', { 
      error: error.message,
      callSid: session.callSid,
      stack: error.stack
    });
    
    // Send error message to caller
    const errorMsg = session.language === 'es' ? 
      "Lo siento, tuve un pequeño problema. ¿Puede repetir eso?" :
      "Sorry, I had a little hiccup. Could you say that again?";
    
    await streamTextToSpeech(ws, session, errorMsg);
  } finally {
    session.isProcessing = false;
  }
}

/**
 * Send initial greeting
 */
async function sendGreeting(ws, session) {
  session.greetingSent = true;
  
  const businessName = session.tenant.config.businessConfig?.name || 
                      session.tenant.name;
  const greetingMessage = session.tenant.config.greeting || 
                         `Hey, ${businessName}, this is Sarah!`;
  
  await streamTextToSpeech(ws, session, greetingMessage);
}

/**
 * Convert text to speech via ElevenLabs streaming API and send to Twilio.
 * Uses streaming for lower time-to-first-byte — audio starts playing
 * while the rest is still generating.
 */
async function streamTextToSpeech(ws, session, text) {
  session.isSpeaking = true;
  session.currentMarkId++;
  const markId = `mark_${session.currentMarkId}`;
  const t0 = Date.now();
  let chunkCount = 0;
  
  try {
    // Stream audio chunks to Twilio as they arrive from ElevenLabs
    await speakTextStreaming(text, session.language, (base64Chunk) => {
      if (ws.readyState === 1 && session.streamSid) {
        sendAudio(ws, session.streamSid, base64Chunk);
        chunkCount++;
      }
    });
    
    // Send mark after all audio
    if (ws.readyState === 1) {
      sendMark(ws, session.streamSid, markId);
      logger.info('📢 TTS sent (streaming)', { 
        callSid: session.callSid, 
        chunks: chunkCount, 
        ms: Date.now() - t0, 
        text: text.substring(0, 40) 
      });
    } else {
      logger.warn('Cannot send TTS — call already ended', { callSid: session.callSid });
    }
  } catch (error) {
    logger.error('TTS streaming error, trying fallback', { error: error.message, callSid: session.callSid });
    
    // Fallback to non-streaming REST
    try {
      const audioChunks = await speakText(text, session.language);
      if (ws.readyState === 1) {
        for (const chunk of audioChunks) {
          sendAudio(ws, session.streamSid, chunk);
        }
        sendMark(ws, session.streamSid, markId);
        logger.info('📢 TTS sent (REST fallback)', { callSid: session.callSid, chunks: audioChunks.length, ms: Date.now() - t0 });
      }
    } catch (fallbackError) {
      logger.error('TTS fallback also failed', { error: fallbackError.message });
    }
  } finally {
    session.isSpeaking = false;
  }
}

/**
 * Send audio chunk to Twilio Media Stream
 */
function sendAudio(ws, streamSid, base64Audio) {
  if (ws.readyState !== 1) {
    logger.warn('Cannot send audio — WS not open', { readyState: ws.readyState, streamSid });
    return;
  }
  if (!streamSid) {
    logger.warn('Cannot send audio — no streamSid');
    return;
  }
  const message = {
    event: 'media',
    streamSid: streamSid,
    media: {
      payload: base64Audio
    }
  };
  
  ws.send(JSON.stringify(message));
}

/**
 * Send mark message to Twilio (for tracking playback)
 */
function sendMark(ws, streamSid, markName) {
  const message = {
    event: 'mark',
    streamSid: streamSid,
    mark: {
      name: markName
    }
  };
  
  ws.send(JSON.stringify(message));
}

/**
 * Clear audio queue (for barge-in)
 */
function sendClear(ws, streamSid) {
  const message = {
    event: 'clear',
    streamSid: streamSid
  };
  
  ws.send(JSON.stringify(message));
  
  logger.debug('Audio queue cleared', { streamSid });
}

/**
 * Handle WebSocket close
 */
async function handleClose(session) {
  logger.info('Media Stream connection closed', { 
    callSid: session.callSid,
    turns: session.turnCount 
  });

  // Close Deepgram connection
  if (session.deepgram && session.deepgram.isOpen()) {
    session.deepgram.close();
  }

  // Close ElevenLabs stream
  if (session.elevenLabs && session.elevenLabs.isOpen()) {
    session.elevenLabs.close();
  }

  // Update call record
  try {
    await db.updateCall(session.callSid, {
      ended_at: new Date().toISOString()
    });
  } catch (e) {
    logger.error('Failed to update call end time', { error: e.message });
  }
}

/**
 * Detect Spanish
 */
function detectSpanish(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  const spanishPatterns = [
    /\bhola\b/, /\bbuenos días\b/, /\bbuenas tardes\b/, /\bbuenas noches\b/,
    /\bcómo\b/, /\bdónde\b/, /\bcuándo\b/, /\bqué\b/, /\bquién\b/,
    /\bsí\b/, /\bgracias\b/, /\bpor favor\b/, /\bhabla español\b/,
    /\bespañol\b/, /\bnecesito\b/, /\bquiero\b/, /\bpuedo\b/,
    /\bestá\b/, /\bestoy\b/, /\btengo\b/
  ];
  
  return spanishPatterns.some(pattern => pattern.test(lower));
}

/**
 * Detect transfer intent
 */
function detectTransferIntent(message) {
  const transferPhrases = [
    'let me transfer you',
    'transfer you to',
    'connect you with',
    'get you to',
    'put you through to',
    'transferring you',
    'connecting you'
  ];
  
  const lowerMessage = message.toLowerCase();
  return transferPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if within business hours
 */
function isWithinBusinessHours(businessHours) {
  if (!businessHours) return true;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = businessHours[currentDay];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return false;
  }
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

/**
 * Split text into sentences for pipelined TTS
 */
function splitIntoSentences(text) {
  // Split on sentence endings but keep them attached
  const parts = text.match(/[^.!?]+[.!?]+\s*/g);
  if (!parts || parts.length <= 1) return [text];
  return parts.map(s => s.trim()).filter(s => s.length > 0);
}

module.exports = {
  router,
  setupMediaStreamWebSocket
};
