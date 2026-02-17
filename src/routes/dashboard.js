const express = require('express');
const db = require('../db');
const { listAvailableTemplates } = require('../services/template-loader');
const logger = require('../utils/logger');

const router = express.Router();

// ============= AUTH MIDDLEWARE =============

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    // API requests get 401, page requests get redirect
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login.html');
  }
  next();
}

// Apply auth to all routes
router.use(requireAuth);

// ============= PAGE ROUTES =============

const path = require('path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

// All sub-pages served by the same SPA
router.get('/calls', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

router.get('/customize', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

router.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

router.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

// ============= API ROUTES =============

// Get current user + tenant info
router.get('/api/me', (req, res) => {
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
    logger.error('Dashboard /api/me error', { error: error.message });
    res.status(500).json({ error: 'Failed to load user data' });
  }
});

// Get overview stats
router.get('/api/overview', (req, res) => {
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

// Get calls
router.get('/api/calls', (req, res) => {
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

// Get available templates
router.get('/api/templates', (req, res) => {
  try {
    const templates = listAvailableTemplates();
    res.json({ templates });
  } catch (error) {
    logger.error('Dashboard templates error', { error: error.message });
    res.json({ templates: [] });
  }
});

// Save customization (greeting, hours, FAQs)
router.put('/api/customize', (req, res) => {
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

module.exports = router;
