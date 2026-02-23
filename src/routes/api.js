const express = require('express');
const twilio = require('twilio');
const db = require('../db');
const { authenticateTenant } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { generateAIResponse } = require('../services/claude');
const { loadTemplate } = require('../services/template-loader');

// Rate limit for demo calls (prevent abuse)
const demoCallLimits = new Map(); // IP -> { count, resetTime }

const router = express.Router();

/**
 * Get tenant information
 */
router.get('/tenant', authenticateTenant, async (req, res) => {
  res.json({
    id: req.tenant.id,
    name: req.tenant.name,
    industry: req.tenant.industry,
    phone_number: req.tenant.phone_number,
    active: req.tenant.active === 1,
    created_at: req.tenant.created_at
  });
});

/**
 * Get all calls for authenticated tenant
 */
router.get('/calls', authenticateTenant, rateLimit(60, 60000), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const calls = await db.getCallsByTenant(req.tenant.id, limit);
    
    res.json({
      count: calls.length,
      calls: calls.map(c => ({
        id: c.id,
        call_sid: c.call_sid,
        caller_phone: c.caller_phone,
        intent: c.intent,
        duration_seconds: c.duration_seconds,
        created_at: c.created_at
      }))
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fetch calls error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch calls',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Get all bookings for authenticated tenant
 */
router.get('/bookings', authenticateTenant, rateLimit(60, 60000), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const status = req.query.status;
    
    let bookings = await db.getBookingsByTenant(req.tenant.id, limit);
    
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }
    
    res.json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fetch bookings error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Get notifications
 */
router.get('/notifications', authenticateTenant, rateLimit(60, 60000), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const notifications = await db.getNotificationsByTenant(req.tenant.id, limit);
    
    res.json({
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fetch notifications error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Try It Live — Trigger outbound demo call to visitor's phone
 * POST /api/demo-call
 * Body: { phone: "+1234567890", industry: "medical" }
 */
router.post('/demo-call', async (req, res) => {
  const { phone, industry } = req.body;
  
  // Validate phone
  if (!phone || !/^\+?1?\d{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }

  // Clean phone number
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;
  }

  // Rate limit: 3 demo calls per IP per hour
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const limit = demoCallLimits.get(ip);
  
  if (limit && limit.resetTime > now && limit.count >= 3) {
    return res.status(429).json({ error: 'Too many demo requests. Please try again later.' });
  }
  
  if (!limit || limit.resetTime <= now) {
    demoCallLimits.set(ip, { count: 1, resetTime: now + 3600000 });
  } else {
    limit.count++;
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const baseUrl = process.env.BASE_URL || process.env.WEBHOOK_BASE_URL;
    
    if (!baseUrl) {
      return res.status(500).json({ error: 'Demo calls require a public URL. Coming soon!' });
    }

    const client = twilio(accountSid, authToken);

    // Use the demo tenant (Mike's Plumbing or whatever is configured)
    // The voice webhook will handle the call using the tenant matched by phone number
    const call = await client.calls.create({
      to: cleanPhone,
      from: fromNumber,
      url: `${baseUrl}/api/voice`,
      statusCallback: `${baseUrl}/api/status`,
      statusCallbackEvent: ['completed'],
      machineDetection: 'Enable',
      timeout: 30
    });

    res.json({ 
      success: true, 
      message: 'Calling you now! Pick up to talk to Calva.',
      callSid: call.sid
    });
  } catch (error) {
    console.error('Demo call error:', error.message);
    
    if (error.code === 21214 || error.code === 21217 || error.message?.includes('not valid')) {
      return res.status(400).json({ error: 'Invalid phone number. Please check and try again.' });
    }
    
    res.status(500).json({ error: 'Could not place demo call. Please try calling (929) 755-7288 directly.' });
  }
});

/**
 * Simulate a call conversation (test mode)
 * POST /api/simulate-call
 * Body: { message: string, apiKey: string }
 * 
 * This allows business owners to test their AI without making a real phone call
 */
router.post('/simulate-call', async (req, res) => {
  try {
    const { message, apiKey } = req.body;
    
    if (!message || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both "message" and "apiKey" are required'
      });
    }
    
    // Authenticate tenant by API key
    const tenant = await db.getTenantByApiKey(apiKey);
    
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (!tenant.active) {
      return res.status(403).json({ error: 'Account is not active' });
    }
    
    // Get tenant configuration
    const config = tenant.config || {};
    const template = loadTemplate(tenant.industry);
    
    // Build conversation history for context
    const conversationHistory = [
      {
        role: 'user',
        content: message
      }
    ];
    
    // Get system prompt
    const systemPrompt = config.systemPrompt || template.systemPrompt.replace(/\{businessName\}/g, tenant.name);
    const knowledgeBase = config.knowledgeBase || template.knowledgeBase || '';
    
    // Generate AI response using the same logic as real calls
    const aiResponse = await generateAIResponse(
      conversationHistory,
      systemPrompt,
      knowledgeBase,
      tenant.industry
    );
    
    // Parse response for intent (simplified version)
    let intent = 'general_inquiry';
    const lowerResponse = aiResponse.toLowerCase();
    
    if (lowerResponse.includes('book') || lowerResponse.includes('appointment') || lowerResponse.includes('schedule')) {
      intent = 'booking';
    } else if (lowerResponse.includes('emergency') || lowerResponse.includes('urgent')) {
      intent = 'emergency';
    } else if (lowerResponse.includes('hours') || lowerResponse.includes('open')) {
      intent = 'hours_inquiry';
    } else if (lowerResponse.includes('price') || lowerResponse.includes('cost')) {
      intent = 'pricing_inquiry';
    }
    
    // Return the simulation result
    res.json({
      success: true,
      simulation: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        industry: tenant.industry
      },
      request: {
        message: message
      },
      response: {
        text: aiResponse,
        intent: intent
      },
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-flash',
        template: tenant.industry
      }
    });
    
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ 
      error: 'Simulation failed',
      details: process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message
    });
  }
});

/**
 * Health check
 */
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'calva-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
