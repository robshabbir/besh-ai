const express = require('express');
const db = require('../db');
const { listAvailableTemplates } = require('../services/template-loader');
const logger = require('../utils/logger');

const router = express.Router();

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
router.get('/me', (req, res) => {
  try {
    const user = db.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const tenant = user.tenant_id ? db.getTenantById(user.tenant_id) : null;

    res.json({
      user: { id: user.id, email: user.email, tenantId: user.tenant_id },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        industry: tenant.industry,
        phoneNumber: tenant.phone_number,
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
router.get('/overview', (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.json({ stats: {} });

    const calls = db.getCallsByTenant(tenantId, 50);
    const bookings = db.getBookingsByTenant(tenantId, 50);
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const oneWeekAgo = now - 7 * 86400;

    const todayCalls = calls.filter(c => c.created_at >= oneDayAgo);
    const weekCalls = calls.filter(c => c.created_at >= oneWeekAgo);

    res.json({
      stats: {
        totalCalls: calls.length,
        callsToday: todayCalls.length,
        callsThisWeek: weekCalls.length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        avgDuration: calls.length > 0
          ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / calls.length)
          : 0
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
router.get('/calls', (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.json({ calls: [] });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const calls = db.getCallsByTenant(tenantId, limit);

    res.json({
      calls: calls.map(c => ({
        id: c.id,
        callSid: c.call_sid,
        callerPhone: c.caller_phone,
        intent: c.intent,
        durationSeconds: c.duration_seconds,
        transcript: c.transcript || [],
        createdAt: c.created_at,
        transferred: !!c.transferred
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
router.get('/templates', (req, res) => {
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
router.put('/customize', (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const { greeting, businessHours, faqs, businessName } = req.body;

    const tenant = db.getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const config = tenant.config || {};

    if (greeting !== undefined) config.greeting = greeting;
    if (businessHours !== undefined) config.businessHours = businessHours;
    if (faqs !== undefined) config.faqs = faqs;
    if (businessName !== undefined) {
      config.businessName = businessName;
      config.businessConfig = config.businessConfig || {};
      config.businessConfig.name = businessName;
    }

    config.setupComplete = true;

    const updates = { config_json: config };
    if (businessName) updates.name = businessName;

    db.updateTenant(tenantId, updates);

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
router.get('/analytics', (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const now = Math.floor(Date.now() / 1000);
    const startOfToday = now - (now % 86400);
    const startOfWeek = now - (7 * 86400);

    const todayStats = db.getCallAnalytics(tenantId, startOfToday, now);
    const weekStats = db.getCallAnalytics(tenantId, startOfWeek, now);
    const hourly = db.getCallsByHour(tenantId, startOfWeek, now);
    const daily = db.getCallsByDay(tenantId, 7);

    // Get top intent this week
    const topIntentRow = db.getDb().prepare(`
      SELECT intent, COUNT(*) as cnt FROM calls
      WHERE tenant_id = ? AND created_at >= ? AND intent IS NOT NULL AND intent != ''
      GROUP BY intent ORDER BY cnt DESC LIMIT 1
    `).get(tenantId, startOfWeek);

    res.json({
      today: todayStats?.total_calls || 0,
      thisWeek: weekStats?.total_calls || 0,
      avgDuration: Math.round(weekStats?.avg_duration || 0),
      topIntent: topIntentRow?.intent || 'N/A',
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
router.get('/settings', (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const tenant = db.getTenantById(tenantId);
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
router.put('/settings', (req, res) => {
  try {
    const tenantId = req.session.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated' });

    const tenant = db.getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const { greeting, businessHours, personality, faqs } = req.body;
    const config = tenant.config || {};

    if (greeting !== undefined) config.greeting = greeting;
    if (businessHours !== undefined) config.businessHours = businessHours;
    if (personality !== undefined) config.personality = personality;
    if (faqs !== undefined) config.faqs = faqs;

    db.updateTenant(tenantId, { config_json: config });

    res.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
