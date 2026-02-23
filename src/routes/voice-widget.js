const express = require('express');
const logger = require('../utils/logger');
const { processConversation } = require('../services/claude');
const { speakTextStreaming, speakText, VOICES } = require('../services/elevenlabs-stream');
const db = require('../db');

const router = express.Router();

/**
 * POST /api/voice-widget/talk
 * Browser sends text (from Web Speech API), gets back audio (ElevenLabs TTS).
 * This is the simple approach: browser handles STT via Web Speech API,
 * we handle LLM + TTS and return audio.
 */
router.post('/voice-widget/talk', async (req, res) => {
  const { message, sessionId, tenantId } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message required' });
  }
  
  try {
    // Get tenant — use tenantId if provided, otherwise use demo tenant
    let tenant;
    if (tenantId) {
      tenant = await db.getTenantById(tenantId);
    }
    if (!tenant) {
      // Use first active tenant as demo
      const tenants = await db.getAllTenants();
      tenant = tenants.find(t => t.active) || tenants[0];
    }
    
    if (!tenant) {
      return res.status(404).json({ error: 'No tenant configured' });
    }
    
    // Get or create session from in-memory store
    const sessions = getWidgetSessions();
    let session = sessionId ? sessions.get(sessionId) : null;
    
    if (!session) {
      const newId = require('crypto').randomBytes(16).toString('hex');
      session = {
        id: newId,
        tenantId: tenant.id,
        messages: [],
        lastActivity: Date.now()
      };
      sessions.set(newId, session);
    }
    session.lastActivity = Date.now();
    
    // Build system prompt
    let systemPrompt = tenant.config?.systemPrompt || 
      `You are the AI receptionist for ${tenant.name}. Be friendly, helpful, and professional.`;
    
    if (tenant.config?.knowledgeBase) {
      systemPrompt += `\n\n## BUSINESS KNOWLEDGE BASE\n${tenant.config.knowledgeBase}`;
    }
    
    systemPrompt += `\n\n## CONTEXT\nYou are speaking with someone via the website voice widget. Keep responses concise (1-3 sentences). Be warm and conversational — this should sound like a natural phone call.`;
    
    // Get AI response
    const { result, updatedMessages } = await processConversation(
      systemPrompt,
      session.messages,
      message
    );
    session.messages = updatedMessages;
    
    // Generate TTS audio and return as MP3 for browser playback
    const axios = require('axios');
    const voice = VOICES.en;
    // Use v3 for website widget — higher quality, latency less critical than phone
    const MODEL_ID_WIDGET = 'eleven_v3';
    
    const ttsResponse = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=mp3_44100_128`,
      {
        text: result.message,
        model_id: MODEL_ID_WIDGET,
        voice_settings: { stability: voice.stability, similarity_boost: voice.similarity_boost }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    const audioBase64 = Buffer.from(ttsResponse.data).toString('base64');
    
    res.json({
      text: result.message,
      audio: audioBase64,
      sessionId: session.id,
      intent: result.intent
    });
    
  } catch (error) {
    logger.error('Voice widget error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Failed to process',
      text: "Sorry, I had a little trouble there. Could you try again?"
    });
  }
});

/**
 * GET /api/voice-widget/greeting
 * Get the initial greeting audio for the widget
 */
router.get('/voice-widget/greeting', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    let tenant;
    
    if (tenantId) {
      tenant = await db.getTenantById(tenantId);
    }
    if (!tenant) {
      const tenants = await db.getAllTenants();
      tenant = tenants.find(t => t.active) || tenants[0];
    }
    
    const businessName = tenant?.config?.businessConfig?.name || tenant?.name || 'our office';
    const greeting = tenant?.config?.greeting || 
      `Hi there! Thanks for visiting ${businessName}. How can I help you today?`;
    
    // Generate greeting audio
    const axios = require('axios');
    const voice = VOICES.en;
    const MODEL_ID_WIDGET = 'eleven_v3';
    
    const ttsResponse = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=mp3_44100_128`,
      {
        text: greeting,
        model_id: MODEL_ID_WIDGET,
        voice_settings: { stability: voice.stability, similarity_boost: voice.similarity_boost }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    const audioBase64 = Buffer.from(ttsResponse.data).toString('base64');
    
    res.json({
      text: greeting,
      audio: audioBase64,
      businessName
    });
    
  } catch (error) {
    logger.error('Voice widget greeting error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate greeting' });
  }
});

// In-memory widget sessions
const widgetSessions = new Map();

function getWidgetSessions() {
  return widgetSessions;
}

// Cleanup old sessions every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of widgetSessions.entries()) {
    if (now - session.lastActivity > 60 * 60 * 1000) {
      widgetSessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

module.exports = router;
