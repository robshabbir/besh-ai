const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const logger = require('../utils/logger');
const { processConversation } = require('../services/claude');
const { rateLimit } = require('../middleware/rateLimit');
const { validateChatMessage } = require('../middleware/validation');

const router = express.Router();

/**
 * Sanitize text to prevent XSS attacks
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Rate limiting: Track requests per API key
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimits.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check rate limit for API key
 */
function checkRateLimit(apiKey) {
  const now = Date.now();
  
  if (!rateLimits.has(apiKey)) {
    rateLimits.set(apiKey, {
      count: 1,
      windowStart: now
    });
    return true;
  }
  
  const limit = rateLimits.get(apiKey);
  
  // Reset window if expired
  if (now - limit.windowStart > RATE_LIMIT_WINDOW) {
    limit.count = 1;
    limit.windowStart = now;
    return true;
  }
  
  // Check if over limit
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  // Increment count
  limit.count++;
  return true;
}

// In-memory chat sessions (could move to database for persistence)
const chatSessions = new Map();

// Clean up old sessions every 30 minutes (sessions older than 1 hour)
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [sessionId, session] of chatSessions.entries()) {
    if (now - session.lastActivity > oneHour) {
      chatSessions.delete(sessionId);
    }
  }
}, 30 * 60 * 1000);

/**
 * POST /api/chat
 * Send a chat message and get AI response
 */
router.post('/chat', rateLimit(30, 60000), validateChatMessage, async (req, res) => {
  try {
    const { apiKey, sessionId } = req.body;
    let { message } = req.body;
    
    // Validate API key
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }
    
    // Sanitize message
    message = sanitizeText(message);
    
    // Check rate limit
    if (!checkRateLimit(apiKey)) {
      logger.warn('Rate limit exceeded', { apiKey: apiKey.substring(0, 15) + '...' });
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment and try again.'
      });
    }
    
    // Get tenant
    const tenant = await db.getTenantByApiKey(apiKey);
    
    if (!tenant) {
      logger.warn('Invalid API key for chat', { apiKey: apiKey.substring(0, 15) + '...' });
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (!tenant.active) {
      return res.status(403).json({ error: 'Account inactive' });
    }
    
    logger.info('Chat message received', {
      tenantId: tenant.id,
      sessionId: sessionId || 'new',
      messageLength: message.length
    });
    
    // Get or create session
    let session;
    let newSessionId = sessionId;
    
    if (sessionId && chatSessions.has(sessionId)) {
      session = chatSessions.get(sessionId);
      session.lastActivity = Date.now();
    } else {
      // Create new session
      newSessionId = crypto.randomBytes(16).toString('hex');
      session = {
        tenantId: tenant.id,
        messages: [],
        lastActivity: Date.now()
      };
      chatSessions.set(newSessionId, session);
    }
    
    // Build system prompt (same as voice)
    let systemPrompt = tenant.config.systemPrompt || 
      `You are the AI assistant for ${tenant.name}. Be friendly, helpful, and professional.`;
    
    // Inject knowledge base
    if (tenant.config.knowledgeBase) {
      systemPrompt += `\n\n## BUSINESS KNOWLEDGE BASE\nUse the following information to answer questions accurately:\n\n${tenant.config.knowledgeBase}`;
    }
    
    // Add chat-specific instruction
    systemPrompt += `\n\n## CHAT CONTEXT\nYou are chatting via website widget. Keep responses concise and helpful. Use a friendly, conversational tone.`;
    
    // Process conversation
    const startTime = Date.now();
    const { result, updatedMessages } = await processConversation(
      systemPrompt,
      session.messages,
      message
    );
    const aiTime = Date.now() - startTime;
    
    // Update session
    session.messages = updatedMessages;
    
    logger.info('Chat response generated', {
      tenantId: tenant.id,
      sessionId: newSessionId,
      aiMs: aiTime,
      responseLength: result.message.length
    });
    
    // Return response
    res.json({
      response: result.message,
      sessionId: newSessionId
    });
    
  } catch (error) {
    logger.error('Chat API error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

/**
 * GET /api/chat/stats
 * Get chat statistics for a tenant (requires API key)
 */
router.get('/chat/stats', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const tenant = await db.getTenantByApiKey(apiKey);
    
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Count active sessions for this tenant
    let activeSessions = 0;
    let totalMessages = 0;
    
    for (const [sessionId, session] of chatSessions.entries()) {
      if (session.tenantId === tenant.id) {
        activeSessions++;
        totalMessages += session.messages.length;
      }
    }
    
    res.json({
      activeSessions,
      totalMessages,
      rateLimit: {
        max: RATE_LIMIT_MAX,
        window: RATE_LIMIT_WINDOW / 1000 + 's'
      }
    });
    
  } catch (error) {
    logger.error('Chat stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
