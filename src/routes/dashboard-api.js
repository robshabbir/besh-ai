const express = require('express');
const db = require('../db');
const { listAvailableTemplates } = require('../services/template-loader');
const logger = require('../utils/logger');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Rate limiting for dashboard API
router.use(rateLimit(60, 60000)); // 60 req/min

// Auth middleware for dashboard APIs
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

router.use(requireAuth);

/**
 * GET /api/dashboard/me
 */
router.get('/me', async (req, res) => {
  try {
    const user = await db.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const tenant = user.tenant_id ? await db.getTenantById(user.tenant_id) : null;

    res.json({
      user: { id: user.id, email: user.email, tenantId: user.tenant_id },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        industry: tenant.industry,
        phoneNumber: tenant.phone_number,
        apiKey: tenant.api_key,
        config: tenant.config || {}
      } : null
    });
  } catch (error) {
    logger.error('Dashboard /api/dashboard/me error', { error: error.message });
    res.status(500).json({ error: 'Failed to load user data' });
  }
});

/**
 * GET /api/dashboard/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.json({ stats: {} });

    const calls = await db.getCallsByTenant(tenantId, 50);
    const bookings = await db.getBookingsByTenant(tenantId, 50);
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const oneWeekAgo = now - 7 * 86400;

    const todayCalls = calls.filter(c => c.created_at >= oneDayAgo);
    const weekCalls = calls.filter(c => c.created_at >= oneWeekAgo);

    // Lead conversion tracking
    const callsWithName = calls.filter(c => {
      try {
        const collected = typeof c.collected_data === 'string' ? JSON.parse(c.collected_data) : (c.collected_data || {});
        return collected.name || collected.phone;
      } catch { return false; }
    });
    const bookingIntents = calls.filter(c => c.intent === 'booking' || c.intent === 'new_client');
    const leadCaptureRate = calls.length > 0 ? Math.round((callsWithName.length / calls.length) * 100) : 0;
    const bookingRate = calls.length > 0 ? Math.round((bookingIntents.length / calls.length) * 100) : 0;
    
    // Call quality scoring — avg turns per call (more turns = deeper engagement)
    const avgTurns = calls.length > 0 ? Math.round(calls.reduce((sum, c) => {
      try {
        const t = typeof c.transcript === 'string' ? JSON.parse(c.transcript) : (c.transcript || []);
        return sum + t.filter(m => m.role === 'user').length;
      } catch { return sum; }
    }, 0) / calls.length) : 0;

    res.json({
      stats: {
        totalCalls: calls.length,
        callsToday: todayCalls.length,
        callsThisWeek: weekCalls.length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        avgDuration: calls.length > 0
          ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / calls.length)
          : 0,
        leadCaptureRate,
        bookingRate,
        leadsCollected: callsWithName.length,
        avgTurnsPerCall: avgTurns,
        emergencies: calls.filter(c => c.intent === 'emergency').length,
        transfers: calls.filter(c => c.transferred).length
      }
    });
  } catch (error) {
    logger.error('Dashboard overview error', { error: error.message });
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

/**
 * GET /api/dashboard/calls
 */
router.get('/calls', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.json({ calls: [] });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const calls = await db.getCallsByTenant(tenantId, limit);

    res.json({
      calls: calls.map(c => ({
        id: c.id,
        callSid: c.call_sid,
        callerPhone: c.caller_phone,
        intent: c.intent,
        durationSeconds: c.duration_seconds,
        transcript: c.transcript || [],
        createdAt: c.created_at,
        transferred: !!c.transferred,
        recordingUrl: c.recording_url || null,
        recordingDuration: c.recording_duration || 0
      }))
    });
  } catch (error) {
    logger.error('Dashboard calls error', { error: error.message });
    res.status(500).json({ error: 'Failed to load calls' });
  }
});

/**
 * GET /api/dashboard/templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = listAvailableTemplates();
    res.json({ templates });
  } catch (error) {
    logger.error('Dashboard templates error', { error: error.message });
    res.json({ templates: [] });
  }
});

/**
 * PUT /api/dashboard/customize
 */
router.put('/customize', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const { greeting, businessHours, faqs, businessName, knowledgeBase, notifyPhone } = req.body;

    const tenant = await db.getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const config = tenant.config || {};

    if (greeting !== undefined) config.greeting = greeting;
    if (businessHours !== undefined) config.businessHours = businessHours;
    if (faqs !== undefined) config.faqs = faqs;
    if (knowledgeBase !== undefined) config.knowledgeBase = knowledgeBase;
    if (notifyPhone !== undefined) config.notifyPhone = notifyPhone;
    if (businessName !== undefined) {
      config.businessName = businessName;
      config.businessConfig = config.businessConfig || {};
      config.businessConfig.name = businessName;
    }

    config.setupComplete = true;

    const updates = { config_json: config };
    if (businessName) updates.name = businessName;

    await db.updateTenant(tenantId, updates);

    logger.info('Tenant customization saved', { tenantId });
    res.json({ success: true });
  } catch (error) {
    logger.error('Dashboard customize error', { error: error.message });
    res.status(500).json({ error: 'Failed to save customization' });
  }
});

/**
 * GET /api/dashboard/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const now = Math.floor(Date.now() / 1000);
    const startOfToday = now - (now % 86400);
    const startOfWeek = now - (7 * 86400);

    const todayStats = await db.getCallAnalytics(tenantId, startOfToday, now);
    const weekStats = await db.getCallAnalytics(tenantId, startOfWeek, now);
    const hourly = await db.getCallsByHour(tenantId, startOfWeek, now);
    const daily = await db.getCallsByDay(tenantId, 7);

    // Get top intent this week from calls data
    const weekCalls = await db.getCallsByTenant(tenantId, 200);
    const intentCounts = {};
    const startOfWeekDate = new Date(startOfWeek * 1000);
    weekCalls.filter(c => new Date(c.created_at) >= startOfWeekDate && c.intent)
      .forEach(c => { intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1; });
    const topIntentRow = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0];

    res.json({
      today: todayStats?.total_calls || 0,
      thisWeek: weekStats?.total_calls || 0,
      avgDuration: Math.round(weekStats?.avg_duration || 0),
      topIntent: topIntentRow ? topIntentRow[0] : 'N/A',
      dailyVolume: daily || [],
      hourlyDistribution: hourly || [],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/**
 * GET /api/dashboard/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const tenant = await db.getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const config = tenant.config || {};
    res.json({
      greeting: config.greeting || '',
      businessHours: config.businessHours || {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '', close: '' },
        sunday: { open: '', close: '' },
      },
      personality: config.personality || 'professional',
      faqs: config.faqs || [
        { question: '', answer: '' },
        { question: '', answer: '' },
        { question: '', answer: '' },
      ],
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

/**
 * PUT /api/dashboard/settings
 */
router.put('/settings', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const tenant = await db.getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const { greeting, businessHours, personality, faqs } = req.body;
    const config = tenant.config || {};

    if (greeting !== undefined) config.greeting = greeting;
    if (businessHours !== undefined) config.businessHours = businessHours;
    if (personality !== undefined) config.personality = personality;
    if (faqs !== undefined) config.faqs = faqs;

    await db.updateTenant(tenantId, { config_json: config });

    res.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ============= EXPORT =============

/**
 * GET /api/dashboard/calls/export — export calls as CSV
 */
router.get('/calls/export', async (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(404).json({ error: 'No tenant' });
    
    const calls = await db.getCallsByTenant(tenantId, 1000);
    
    const header = 'Date,Caller,Duration (s),Intent,Transferred,Transcript\n';
    const rows = calls.map(c => {
      const date = new Date(c.created_at * 1000).toISOString();
      const phone = c.caller_phone || '';
      const dur = c.duration_seconds || 0;
      const intent = c.intent || '';
      const transferred = c.transferred ? 'Yes' : 'No';
      let transcript = '';
      try {
        const msgs = typeof c.transcript === 'string' ? JSON.parse(c.transcript) : (c.transcript || []);
        transcript = msgs.map(m => `${m.role === 'user' ? 'Caller' : 'AI'}: ${m.content}`).join(' | ');
      } catch (e) {}
      // Escape CSV
      const esc = s => '"' + String(s).replace(/"/g, '""') + '"';
      return [esc(date), esc(phone), dur, esc(intent), transferred, esc(transcript)].join(',');
    }).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="besh-calls-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(header + rows);
  } catch (e) {
    logger.error('Export error', { error: e.message });
    res.status(500).json({ error: 'Export failed' });
  }
});

// ============= INTEGRATIONS =============

/**
 * GET /api/dashboard/integrations — get current integration config
 */
router.get('/integrations', async (req, res) => {
  try {
    const user = await db.getUserById(req.session.userId);
    if (!user?.tenant_id) return res.status(404).json({ error: 'No tenant' });
    
    const tenant = await db.getTenantById(user.tenant_id);
    const integrations = tenant.config?.integrations || {};
    
    res.json({
      webhookUrl: integrations.webhookUrl || '',
      hubspotApiKey: integrations.hubspotApiKey ? '••••' + integrations.hubspotApiKey.slice(-4) : '',
      hubspotEnabled: !!integrations.hubspotApiKey,
      emailSummary: integrations.emailSummary || '',
      calendarEnabled: !!integrations.calendarEnabled
    });
  } catch (e) {
    logger.error('Get integrations error', { error: e.message });
    res.status(500).json({ error: 'Failed to get integrations' });
  }
});

/**
 * POST /api/dashboard/integrations — update integration config
 */
router.post('/integrations', async (req, res) => {
  try {
    const user = await db.getUserById(req.session.userId);
    if (!user?.tenant_id) return res.status(404).json({ error: 'No tenant' });
    
    const tenant = await db.getTenantById(user.tenant_id);
    const config = tenant.config || {};
    
    config.integrations = config.integrations || {};
    
    const { webhookUrl, hubspotApiKey, emailSummary } = req.body;
    
    // Validate webhook URL
    if (webhookUrl !== undefined) {
      if (webhookUrl && !webhookUrl.startsWith('https://')) {
        return res.status(400).json({ error: 'Webhook URL must use HTTPS' });
      }
      config.integrations.webhookUrl = webhookUrl || null;
    }
    
    // HubSpot API key
    if (hubspotApiKey !== undefined && hubspotApiKey !== '••••' + (config.integrations.hubspotApiKey || '').slice(-4)) {
      config.integrations.hubspotApiKey = hubspotApiKey || null;
    }
    
    // Email summary recipient
    if (emailSummary !== undefined) {
      config.integrations.emailSummary = emailSummary || null;
    }
    
    await db.updateTenant(user.tenant_id, { config_json: config });
    
    logger.info('Integrations updated', { tenantId: user.tenant_id });
    res.json({ success: true });
  } catch (e) {
    logger.error('Update integrations error', { error: e.message });
    res.status(500).json({ error: 'Failed to update integrations' });
  }
});

/**
 * POST /api/dashboard/integrations/test-webhook — test webhook connectivity
 */
router.post('/integrations/test-webhook', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Must be HTTPS URL' });
    }
    
    const { sendWebhook } = require('../services/integrations');
    const result = await sendWebhook(url, {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'Besh integration test — if you see this, it works!'
    }, { retries: 0, timeoutMs: 5000 });
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
