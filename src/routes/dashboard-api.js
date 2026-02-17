const express = require('express');
const db = require('../db');

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
