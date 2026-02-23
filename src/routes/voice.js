const express = require('express');
const twilio = require('twilio');
const path = require('path');
const db = require('../db');
const logger = require('../utils/logger');
const { processConversation } = require('../services/claude');
const { createBooking, handleEmergency } = require('../services/booking');
const { sendPostCallNotifications } = require('../services/notifications');
// ElevenLabs removed from call flow — Polly.Ruth-Generative has zero latency
// ElevenLabs kept for landing page audio demos only (via /api/tts-audio)

const router = express.Router();

const sessions = {};

// Clean up stale sessions every 5 minutes (calls that hung up without completing)
setInterval(() => {
  const now = Date.now();
  for (const [sid, session] of Object.entries(sessions)) {
    if (now - (session.lastActivity || 0) > 10 * 60 * 1000) { // 10 min stale
      delete sessions[sid];
    }
  }
}, 5 * 60 * 1000);

// Amazon Polly Generative — most human-sounding voice for <Say>
// Ruth-Generative = warm, natural American female (newer than Joanna, more expressive)
// These voices interpret context and adjust prosody, tone, emotion automatically
const VOICE_EN = { voice: 'Polly.Ruth-Generative', language: 'en-US' };
const VOICE_ES = { voice: 'Google.es-US-Chirp3-HD-Leda', language: 'es-US' };
const VOICE = VOICE_EN;

function getSession(callSid) {
  if (!sessions[callSid]) {
    sessions[callSid] = {
      messages: [],
      collected: {},
      intent: null,
      tenantId: null,
      turnCount: 0,
      lastActivity: Date.now(),
      language: 'en' // Default to English
    };
  }
  return sessions[callSid];
}

/**
 * Detect if text is Spanish based on common Spanish patterns
 */
function detectSpanish(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // Spanish greeting/phrase patterns
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
 * Get voice settings based on language
 */
function getVoiceForLanguage(language) {
  return language === 'es' ? VOICE_ES : VOICE_EN;
}

/**
 * Format text for speech — Polly Generative voices handle prosody automatically
 * SSML <speak> tags are required by Twilio but we keep it minimal
 * because generative voices sound WORSE with manual prosody overrides
 */
function toSSML(text) {
  // Chirp3-HD generative voices handle prosody from plain text — no SSML needed
  // Just clean up smart quotes
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\.\.\./g, '…');
}

/**
 * Check if current time is within business hours
 */
function isWithinBusinessHours(businessHours) {
  if (!businessHours) return true; // Default to always open if not configured
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = businessHours[currentDay];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return false; // Closed if hours not set for this day
  }
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

/**
 * Initial call — ElevenLabs TTS with Gather/Say flow
 * Primary route with human-quality voice
 */
router.post('/voice', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse({
    record: 'record-from-answer-dual',
    recordingStatusCallback: '/api/recording-status',
    recordingStatusCallbackMethod: 'POST'
  });
  const callSid = req.body.CallSid;
  const rawTo = (req.body.To || '').trim();
  const rawFrom = (req.body.From || '').trim();
  const toNumber = rawTo.startsWith('+') ? rawTo : '+' + rawTo;
  const fromNumber = rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom;

  logger.info('Incoming call (ElevenLabs)', { callSid, to: toNumber, from: fromNumber });

  try {
    const tenant = await db.getTenantByPhoneNumber(toNumber) || await db.getTenantByPhoneNumber(fromNumber);

    if (!tenant) {
      logger.error('No tenant found', { to: toNumber, from: fromNumber });
      twiml.say(VOICE, "Sorry, this number isn't set up yet. Try again later!");
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    const callId = await db.createCall(tenant.id, callSid, fromNumber);
    const session = getSession(callSid);
    session.tenantId = tenant.id;
    session.callId = callId;

    const businessName = tenant.config.businessConfig?.name || tenant.name;

    // Check tenant supported languages
    const supportedLanguages = tenant.config.languages || ['en'];
    
    // Check if using custom greeting - make it casual and human
    let greetingMessage = tenant.config.greeting || `Hey, ${businessName}, this is Sarah!`;

    // Pick up instantly — no pause, real receptionist style
    const gather = twiml.gather({
      input: 'speech',
      action: '/api/gather',
      method: 'POST',
      speechTimeout: '2',
      speechModel: 'phone_call',
      enhanced: true,
      language: supportedLanguages.includes('es') ? 'es-US, en-US' : 'en-US'
    });

    // Use Twilio built-in TTS — zero latency, Polly Generative voices sound great
    gather.say(VOICE_EN, toSSML(greetingMessage));

    // If no input — sound natural
    twiml.pause({ length: 3 });
    twiml.say(VOICE, toSSML("Hey, you still there?"));
    
    const gather2 = twiml.gather({
      input: 'speech',
      action: '/api/gather',
      method: 'POST',
      speechTimeout: '2',
      speechModel: 'phone_call',
      enhanced: true
    });
    gather2.say(VOICE, toSSML("No worries, I'm here whenever you're ready."));
    twiml.say(VOICE, toSSML("Alright, give us a call back anytime. Bye!"));
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    logger.error('Voice webhook error', { error: error.message, callSid });
    twiml.say(VOICE, "Oh shoot, something went wrong on our end. Try calling back in just a sec.");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * ConversationRelay route (for when ElevenLabs is unblocked in Twilio)
 * REQUIRES: Enable "Predictive and Generative AI/ML Features Addendum" in Twilio Console
 * Twilio Console → Voice → Settings → General → Toggle ON
 */
router.post('/voice-cr', async (req, res) => {
  const callSid = req.body.CallSid;
  const rawTo = (req.body.To || '').trim();
  const rawFrom = (req.body.From || '').trim();
  const toNumber = rawTo.startsWith('+') ? rawTo : '+' + rawTo;
  const fromNumber = rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom;

  logger.info('Incoming call (ConversationRelay)', { callSid, to: toNumber, from: fromNumber });

  try {
    const tenant = await db.getTenantByPhoneNumber(toNumber) || await db.getTenantByPhoneNumber(fromNumber);

    if (!tenant) {
      logger.error('No tenant found', { to: toNumber, from: fromNumber });
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say(VOICE, "Sorry, this number isn't set up yet. Try again later!");
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    const businessName = tenant.config.businessConfig?.name || tenant.name;
    const greetingMessage = tenant.config.greeting || `Hey, ${businessName}, this is Sarah!`;

    // Get BASE_URL from environment (Cloudflare tunnel)
    const baseUrl = process.env.BASE_URL || `https://localhost:${process.env.PORT || 3100}`;
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';

    // ConversationRelay TwiML
    const twiml = new twilio.twiml.VoiceResponse({
      record: 'record-from-answer-dual',
      recordingStatusCallback: '/api/recording-status',
      recordingStatusCallbackMethod: 'POST'
    });

    const connect = twiml.connect();
    
    // ElevenLabs Sarah voice — most natural for phone receptionist
    // Format: voiceId-modelId-speed_stability_similarity
    // Low stability (0.20) = more natural variation, less robotic monotone
    // Moderate similarity (0.65) = recognizable but not rigid
    // Speed 0.95 = slightly slower than default, more relaxed/human
    const crTtsProvider = process.env.CR_TTS_PROVIDER || 'Amazon';
    
    // Amazon Polly Ruth-Generative — best available without ElevenLabs
    // ElevenLabs is blocked on this Twilio account (error 64101 block_elevenlabs)
    // To unblock: Twilio Console → Voice → Settings → enable AI/ML addendum
    let crVoice = process.env.CR_VOICE || 'Ruth-Generative';
    
    connect.conversationRelay({
      url: wsUrl,
      welcomeGreeting: greetingMessage,
      welcomeGreetingInterruptible: 'speech',
      voice: crVoice,
      ttsProvider: crTtsProvider,
      // ElevenLabs text normalization OFF = lower TTS latency (we handle normalization ourselves)
      elevenlabsTextNormalization: 'off',
      transcriptionProvider: 'deepgram',
      speechModel: 'nova-3-general',
      interruptible: 'true',
      // Higher sensitivity = faster endpointing = less wait after caller stops talking
      interruptSensitivity: 'high',
      dtmfDetection: 'true',
      profanityFilter: 'false'
    });

    logger.info('ConversationRelay TwiML returned', { 
      callSid, 
      wsUrl,
      tenant: tenant.name 
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    logger.error('Voice webhook error', { error: error.message, callSid });
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(VOICE, "Oh shoot, something went wrong on our end. Try calling back in just a sec.");
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * Check if AI response indicates transfer intent
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
 * Handle each speech turn
 */
router.post('/gather', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult || '';

  logger.info('Speech input', { callSid, speech: speechResult.substring(0, 100) });

  if (!speechResult) {
    const session = getSession(callSid);
    const voice = getVoiceForLanguage(session.language);
    const gather = twiml.gather({
      input: 'speech',
      action: '/api/gather',
      method: 'POST',
      speechTimeout: '3',
      speechModel: 'phone_call',
      enhanced: true
    });
    const noInputMsg = session.language === 'es' ? "Lo siento, no escuché eso. ¿Qué dijo?" : "Sorry, I didn't catch that. What was that?";
    const goodbyeMsg = session.language === 'es' ? "No hay problema, llámenos cuando quiera. ¡Adiós!" : "No worries, just give us a ring back whenever. Bye!";
    gather.say(voice, noInputMsg);
    twiml.say(voice, goodbyeMsg);
    twiml.hangup();
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    const session = getSession(callSid);
    session.turnCount++;
    session.lastActivity = Date.now();

    if (!session.tenantId) {
      throw new Error('Session has no tenant');
    }

    const tenant = await db.getTenantById(session.tenantId);
    const supportedLanguages = tenant.config.languages || ['en'];
    
    // Detect Spanish on first turn if supported
    if (session.turnCount === 1 && supportedLanguages.includes('es') && detectSpanish(speechResult)) {
      session.language = 'es';
      logger.info('Spanish language detected', { callSid });
      await db.updateCall(callSid, { language: 'es' });
    }
    
    let systemPrompt = tenant.config.systemPrompt;
    
    // Add Spanish instruction if Spanish mode is active
    if (session.language === 'es') {
      systemPrompt = "The caller is speaking Spanish. Respond entirely in Spanish. Be natural and conversational in Spanish.\n\n" + systemPrompt;
    }

    // Check business hours and inject into prompt if after-hours mode is enabled
    const features = tenant.config.features || {};
    if (features.afterHoursMode && tenant.config.businessHours) {
      const withinHours = isWithinBusinessHours(tenant.config.businessHours);
      if (!withinHours) {
        systemPrompt += `\n\n## BUSINESS HOURS STATUS\nWe are currently OUTSIDE business hours. Let callers know you'll have someone call them back during business hours, or offer to take a message. Be apologetic but helpful.`;
      } else {
        systemPrompt += `\n\n## BUSINESS HOURS STATUS\nWe are currently OPEN and within business hours. Provide full service.`;
      }
    }

    // Inject knowledge base into system prompt if available
    if (tenant.config.knowledgeBase) {
      systemPrompt += `\n\n## BUSINESS KNOWLEDGE BASE\nUse the following information to answer caller questions accurately:\n\n${tenant.config.knowledgeBase}`;
    }
    
    // Inject booking settings
    if (features.bookingEnabled === false) {
      systemPrompt += `\n\n## BOOKING DISABLED\nDo not attempt to book appointments. Instead, tell callers someone will call them back to schedule.`;
    }

    // Inject transfer capability if configured
    const transferPhone = tenant.config.transferPhone || tenant.config.businessConfig?.ownerPhone;
    if (transferPhone) {
      systemPrompt += `\n\n## HUMAN HANDOFF\nIf the caller asks to speak with someone or you cannot help them, say something like "Let me transfer you to someone who can help" to initiate a transfer.`;
    }

    // Get AI response
    const startTime = Date.now();
    const { result, updatedMessages } = await processConversation(
      systemPrompt,
      session.messages,
      speechResult
    );
    const aiTime = Date.now() - startTime;

    session.messages = updatedMessages;
    session.collected = { ...session.collected, ...result.collected };
    session.intent = result.intent;

    logger.info('AI response', {
      callSid,
      turn: session.turnCount,
      intent: result.intent,
      complete: result.complete,
      aiMs: aiTime,
      response: result.message.substring(0, 100)
    });

    // Update call record
    await db.updateCall(callSid, {
      transcript: session.messages,
      intent: session.intent,
      collected_data: session.collected
    });

    const voice = getVoiceForLanguage(session.language);
    
    // Check if AI wants to transfer the call
    if (transferPhone && detectTransferIntent(result.message)) {
      logger.info('Transfer intent detected', { callSid, transferPhone });
      
      // Say the AI's message first
      twiml.say(voice, toSSML(result.message));
      twiml.pause({ length: 1 });
      
      // Mark as transferred in database
      await db.updateCall(callSid, {
        transferred: 1,
        transfer_to: transferPhone
      });
      
      // Send SMS to owner before transfer
      const { sendSMS } = require('../services/notifications');
      const callerPhone = await db.getCallBySid(callSid)?.caller_phone || 'Unknown';
      const businessPhone = tenant.phone_number;
      const summary = session.collected.service || session.collected.reason || 'assistance';
      
      setImmediateasync (async () => {
        try {
          await sendSMS(
            transferPhone,
            businessPhone,
            `🔄 Incoming transfer from ${callerPhone}\n\nThey need: ${summary}\n\nAnswering now...`
          );
        } catch (e) {
          logger.error('Transfer SMS failed', { error: e.message });
        }
      });
      
      // Dial the owner with 30-second timeout
      const dial = twiml.dial({
        timeout: 30,
        action: '/api/transfer-status',
        method: 'POST'
      });
      dial.number(transferPhone);
      
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    if (result.complete) {
      const takeCareMsg = session.language === 'es' ? "¡Cuídese!" : "Take care!";
      
      // Twilio built-in TTS — zero latency
      twiml.say(voice, toSSML(result.message));
      twiml.pause({ length: 1 });
      twiml.say(voice, toSSML(takeCareMsg));
      twiml.hangup();

      // Post-call actions (non-blocking)
      setImmediateasync (async () => {
        try {
          if (result.intent === 'booking' || result.intent === 'new_client') {
            await createBooking(tenant.id, session.callId, session.collected, result.intent);
          }
          if (result.intent === 'emergency' || result.urgency === 'emergency') {
            await handleEmergency(tenant.id, session.callId, session.collected);
          }
          const callData = {
            caller_phone: await db.getCallBySid(callSid)?.caller_phone,
            intent: session.intent,
            collected: session.collected,
            urgency: result.urgency
          };
          await sendPostCallNotifications(tenant.id, session.callId, callData, null);
        } catch (e) {
          logger.error('Post-call action error', { error: e.message });
        }
      });

      delete sessions[callSid];
    } else {
      // Continue conversation
      const gather = twiml.gather({
        input: 'speech',
        action: '/api/gather',
        method: 'POST',
        speechTimeout: '2',
        speechModel: 'phone_call',
        enhanced: true
      });

      // Twilio built-in TTS — zero latency
      gather.say(voice, toSSML(result.message));

      // Second chance if they don't respond
      twiml.pause({ length: 3 });
      const stillThereMsg = session.language === 'es' ? "¿Sigue ahí?" : "Hey, you still there?";
      const finalGoodbyeMsg = session.language === 'es' ? 
        "Bueno, llámenos cuando quiera. ¡Que le vaya bien!" : 
        "No worries! Give us a call back whenever. Have a good one!";
      const gather2 = twiml.gather({
        input: 'speech',
        action: '/api/gather',
        method: 'POST',
        speechTimeout: '2',
        speechModel: 'phone_call',
        enhanced: true
      });
      gather2.say(voice, toSSML(stillThereMsg));
      twiml.say(voice, toSSML(finalGoodbyeMsg));
      twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    logger.error('Gather error', { error: error.message, callSid });
    
    // Fall back to voicemail on error
    const session = getSession(callSid);
    const voice = getVoiceForLanguage(session.language);
    if (session.tenantId) {
      logger.info('Falling back to voicemail', { callSid });
      const errorMsg = session.language === 'es' ? 
        "Ay, estoy teniendo un problema. Déjeme tomar un mensaje." : 
        "Oh gosh, I'm having a little trouble. Let me take a message for you.";
      const beepMsg = session.language === 'es' ? 
        "Después del tono, deje su nombre, número y en qué necesita ayuda. ¡Gracias!" :
        "After the beep, leave your name, number, and what you need help with. Thanks!";
      const thanksMsg = session.language === 'es' ? 
        "Gracias por su mensaje. Le llamaremos pronto. ¡Adiós!" :
        "Thanks for your message. We'll get back to you soon. Bye!";
      
      twiml.say(voice, errorMsg);
      twiml.pause({ length: 1 });
      twiml.say(voice, beepMsg);
      
      twiml.record({
        maxLength: 120,
        action: '/api/voicemail-status',
        method: 'POST',
        recordingStatusCallback: '/api/voicemail-status',
        recordingStatusCallbackMethod: 'POST',
        playBeep: true,
        transcribe: false
      });
      
      twiml.say(voice, thanksMsg);
      twiml.hangup();
    } else {
      const sorryMsg = session.language === 'es' ? 
        "Lo siento. Estamos teniendo un problema. ¿Puede llamar de nuevo?" :
        "Oh gosh, I'm sorry about that. We're having a little issue on our end. Can you try calling back?";
      twiml.say(voice, sorryMsg);
      twiml.hangup();
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * Status callback
 */
router.post('/status', async (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const duration = req.body.CallDuration;

  logger.info('Call status', { callSid, status: callStatus, duration });

  // Clean up session on any terminal status
  if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus)) {
    delete sessions[callSid];
    if (duration) {
      try {
        await db.updateCall(callSid, { duration_seconds: parseInt(duration) });
      } catch (e) {}
    }
  }

  res.sendStatus(200);
});

/**
 * Recording status callback — Twilio sends this when recording is ready
 */
router.post('/recording-status', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  const recordingDuration = req.body.RecordingDuration;
  const recordingStatus = req.body.RecordingStatus;

  logger.info('Recording status', { 
    callSid, 
    status: recordingStatus, 
    duration: recordingDuration,
    url: recordingUrl 
  });

  if (recordingStatus === 'completed' && recordingUrl) {
    try {
      // Store recording URL and duration in database
      await db.updateCall(callSid, {
        recording_url: recordingUrl,
        recording_duration: parseInt(recordingDuration) || 0
      });
      logger.info('Recording saved to database', { callSid, recordingUrl });
    } catch (error) {
      logger.error('Failed to save recording', { error: error.message, callSid });
    }
  }

  res.sendStatus(200);
});

/**
 * Transfer status callback — handles when owner answers/doesn't answer
 */
router.post('/transfer-status', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const dialCallStatus = req.body.DialCallStatus;
  
  logger.info('Transfer status', { callSid, status: dialCallStatus });
  
  const session = getSession(callSid);
  
  if (dialCallStatus === 'completed') {
    // Owner answered and call was completed
    logger.info('Transfer successful', { callSid });
    twiml.say(VOICE, "Thanks for calling!");
    twiml.hangup();
  } else {
    // Owner didn't answer (no-answer, busy, failed)
    logger.info('Transfer failed, offering voicemail', { callSid, status: dialCallStatus });
    
    const tenant = session.tenantId ? await db.getTenantById(session.tenantId) : null;
    const ownerName = tenant?.config?.businessConfig?.ownerName || 'the owner';
    
    twiml.say(VOICE, `Sorry, ${ownerName} isn't available right now.`);
    twiml.pause({ length: 1 });
    twiml.say(VOICE, "Can I take a message? After the beep, leave your name, number, and what you need.");
    
    twiml.record({
      maxLength: 120,
      action: '/api/voicemail-status',
      method: 'POST',
      recordingStatusCallback: '/api/voicemail-status',
      recordingStatusCallbackMethod: 'POST',
      playBeep: true,
      transcribe: false
    });
    
    twiml.say(VOICE, "Got it. We'll call you back as soon as we can. Bye!");
    twiml.hangup();
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * Voicemail recording status callback
 */
router.post('/voicemail-status', async (req, res) => {
  const callSid = req.body.CallSid;
  const recordingUrl = req.body.RecordingUrl;
  const recordingDuration = req.body.RecordingDuration;
  const callerPhone = req.body.From || req.body.Caller;
  
  logger.info('Voicemail recorded', { 
    callSid, 
    duration: recordingDuration,
    url: recordingUrl,
    caller: callerPhone
  });
  
  const session = getSession(callSid);
  
  if (recordingUrl && session.tenantId) {
    try {
      // Save voicemail to database
      const voicemailId = await db.createVoicemail({
        tenant_id: session.tenantId,
        caller_phone: callerPhone,
        recording_url: recordingUrl,
        duration: parseInt(recordingDuration) || 0,
        transcription: null
      });
      
      logger.info('Voicemail saved to database', { voicemailId, callSid });
      
      // Send SMS notification to owner
      const tenant = await db.getTenantById(session.tenantId);
      const ownerPhone = tenant.config?.transferPhone || tenant.config?.businessConfig?.ownerPhone;
      const businessPhone = tenant.phone_number;
      
      if (ownerPhone && businessPhone) {
        const { sendSMS } = require('../services/notifications');
        const durationMin = Math.floor((parseInt(recordingDuration) || 0) / 60);
        const durationSec = (parseInt(recordingDuration) || 0) % 60;
        
        const message = `📨 New Voicemail - ${tenant.name}\n\n` +
          `📱 From: ${callerPhone || 'Unknown'}\n` +
          `⏱️ Duration: ${durationMin}:${durationSec.toString().padStart(2, '0')}\n` +
          `🔗 Listen: ${recordingUrl}.mp3\n\n` +
          `Check your dashboard for details.`;
        
        await sendSMS(ownerPhone, businessPhone, message);
        logger.info('Voicemail notification sent', { voicemailId, ownerPhone });
      }
    } catch (error) {
      logger.error('Failed to save voicemail', { error: error.message, callSid });
    }
  }
  
  res.sendStatus(200);
});

/**
 * Serve TTS audio (for landing page demos only)
 */
const { CACHE_DIR } = require('../services/tts');

router.get('/tts-audio/:filename', async (req, res) => {
  const filename = req.params.filename;
  if (!filename.match(/^[a-f0-9]+\.mp3$/)) {
    return res.status(400).send('Invalid filename');
  }
  res.sendFile(path.join(CACHE_DIR, filename), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

module.exports = router;
