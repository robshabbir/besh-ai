const express = require('express');
const path = require('path');
const db = require('../db');
const { authenticateTenant } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { validateKnowledgeBase, validateTenantSettings } = require('../middleware/validation');

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

/**
 * Recursively sanitize all strings in an object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeText(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Serve admin dashboard HTML
 */
router.get('/dashboard', async (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

/**
 * Serve call forwarding setup guide
 */
router.get('/setup-forwarding', async (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/setup-forwarding.html'));
});

/**
 * Get tenant dashboard data
 */
router.get('/dashboard/data', authenticateTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    
    // Get recent calls
    const calls = await db.getCallsByTenant(tenant.id, 20);
    
    // Get recent bookings
    const bookings = await db.getBookingsByTenant(tenant.id, 20);
    
    // Get recent notifications
    const notifications = await db.getNotificationsByTenant(tenant.id, 20);
    
    // Calculate stats
    const stats = {
      totalCalls: calls.length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      emergencyCalls: calls.filter(c => c.intent === 'emergency').length
    };

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        industry: tenant.industry,
        phone_number: tenant.phone_number
      },
      stats,
      calls: calls.map(c => ({
        id: c.id,
        call_sid: c.call_sid,
        caller_phone: c.caller_phone,
        intent: c.intent,
        duration_seconds: c.duration_seconds,
        recording_url: c.recording_url,
        recording_duration: c.recording_duration,
        transcript: c.transcript,
        created_at: c.created_at
      })),
      bookings: bookings.map(b => ({
        id: b.id,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        service: b.service,
        preferred_time: b.preferred_time,
        status: b.status,
        created_at: b.created_at
      })),
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        payload: n.payload,
        sent_at: n.sent_at
      }))
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Dashboard data error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to load dashboard data',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Get call details with transcript
 */
router.get('/calls/:callSid', authenticateTenant, async (req, res) => {
  try {
    const call = await db.getCallBySid(req.params.callSid);
    
    if (!call || call.tenant_id !== req.tenant.id) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({
      id: call.id,
      call_sid: call.call_sid,
      caller_phone: call.caller_phone,
      intent: call.intent,
      duration_seconds: call.duration_seconds,
      transcript: call.transcript || [],
      collected_data: call.collected_data || {},
      created_at: call.created_at
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Call details error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to load call details',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Update booking status
 */
router.patch('/bookings/:id', authenticateTenant, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const bookings = await db.getBookingsByTenant(req.tenant.id);
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await db.updateBookingStatus(booking.id, status);
    
    res.json({ success: true, id: booking.id, status });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Booking update error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to update booking',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Get tenant configuration
 */
router.get('/tenant-config', authenticateTenant, async (req, res) => {
  try {
    res.json({
      config: req.tenant.config || {}
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Tenant config error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to load config',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Update knowledge base
 */
router.put('/tenant/knowledge', authenticateTenant, rateLimit(20, 60000), validateKnowledgeBase, async (req, res) => {
  try {
    let { knowledgeBase } = req.body;
    
    // Sanitize input (defense in depth - also done in middleware)
    if (knowledgeBase && typeof knowledgeBase === 'string') {
      knowledgeBase = knowledgeBase
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    // Get current config and update knowledge base
    const currentConfig = req.tenant.config || {};
    currentConfig.knowledgeBase = knowledgeBase || '';
    
    await db.updateTenant(req.tenant.id, { config_json: currentConfig });
    
    res.json({ success: true, message: 'Knowledge base updated' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Knowledge base update error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to update knowledge base',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Update tenant settings (greeting, hours, features, etc.)
 */
router.put('/tenant/settings', authenticateTenant, rateLimit(20, 60000), validateTenantSettings, async (req, res) => {
  try {
    let { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ 
        error: 'Settings required',
        details: 'Request body must include a "settings" object',
        example: {
          settings: {
            greeting: 'Welcome to our business!',
            businessHours: { monday: '9am-5pm' },
            businessConfig: { name: 'My Business', phone: '+1234567890' },
            features: { bookingEnabled: true, smsNotifications: true }
          }
        }
      });
    }
    
    // Sanitize all string fields to prevent XSS
    settings = sanitizeObject(settings);
    
    // Get current config and merge with new settings
    const currentConfig = req.tenant.config || {};
    
    // Update business config
    if (settings.businessConfig) {
      currentConfig.businessConfig = {
        ...currentConfig.businessConfig,
        ...settings.businessConfig
      };
    }
    
    // Update greeting
    if (settings.greeting !== undefined) {
      currentConfig.greeting = settings.greeting;
    }
    
    // Update business hours
    if (settings.businessHours) {
      currentConfig.businessHours = settings.businessHours;
    }
    
    // Update features
    if (settings.features) {
      currentConfig.features = {
        ...currentConfig.features,
        ...settings.features
      };
    }
    
    await db.updateTenant(req.tenant.id, { config_json: currentConfig });
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Tenant settings update error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to update settings',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Update tenant configuration
 */
router.patch('/settings', authenticateTenant, async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'Config required' });
    }

    await db.updateTenant(req.tenant.id, { config_json: config });
    
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * Export analytics data as CSV
 */
router.get('/analytics/export', authenticateTenant, async (req, res) => {
  try {
    const { format } = req.query;
    
    if (format !== 'csv') {
      return res.status(400).json({ 
        error: 'Invalid format',
        details: 'Only CSV format is supported. Use ?format=csv'
      });
    }
    
    const tenantId = req.tenant.id;
    const calls = await db.getCallsByTenant(tenantId, 1000); // Export up to 1000 calls
    
    // Build CSV header
    const csvRows = [];
    csvRows.push('Date,Time,Caller Phone,Duration (seconds),Intent,Transferred,Recording URL');
    
    // Add data rows
    calls.forEach(call => {
      const date = new Date(call.created_at * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toISOString().split('T')[1].split('.')[0];
      const callerPhone = call.caller_phone || 'Unknown';
      const duration = call.duration_seconds || 0;
      const intent = call.intent || 'unknown';
      const transferred = call.transferred ? 'Yes' : 'No';
      const recordingUrl = call.recording_url || '';
      
      // Escape CSV fields (handle commas and quotes)
      const escapeCsv = (field) => {
        if (!field) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      csvRows.push([
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(callerPhone),
        duration,
        escapeCsv(intent),
        transferred,
        escapeCsv(recordingUrl)
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Set headers for file download
    const filename = `besh-analytics-${req.tenant.name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ 
      error: 'Failed to export analytics',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

/**
 * Get analytics data
 */
router.get('/analytics', authenticateTenant, async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const now = Math.floor(Date.now() / 1000);
    
    // Get time ranges
    const oneDayAgo = now - (24 * 60 * 60);
    const oneWeekAgo = now - (7 * 24 * 60 * 60);
    const oneMonthAgo = now - (30 * 24 * 60 * 60);
    
    // Get stats for different time periods
    const statsToday = await db.getCallAnalytics(tenantId, oneDayAgo, now);
    const statsWeek = await db.getCallAnalytics(tenantId, oneWeekAgo, now);
    const statsMonth = await db.getCallAnalytics(tenantId, oneMonthAgo, now);
    
    // Get busiest hour
    const callsByHour = await db.getCallsByHour(tenantId, oneWeekAgo, now);
    const busiestHour = callsByHour.length > 0 
      ? callsByHour[0] 
      : { hour: '00', count: 0 };
    
    // Get calls by day for chart (last 7 days)
    const callsByDay = await db.getCallsByDay(tenantId, 7);
    
    // Get recent calls with more details
    const recentCalls = await db.getCallsByTenant(tenantId, 20);
    
    // Get voicemails
    const voicemails = await db.getVoicemailsByTenant(tenantId, 20);
    
    res.json({
      stats: {
        today: {
          total_calls: statsToday.total_calls || 0,
          avg_duration: Math.round(statsToday.avg_duration || 0),
          calls_with_bookings: statsToday.calls_with_bookings || 0,
          transferred_calls: statsToday.transferred_calls || 0
        },
        week: {
          total_calls: statsWeek.total_calls || 0,
          avg_duration: Math.round(statsWeek.avg_duration || 0),
          calls_with_bookings: statsWeek.calls_with_bookings || 0,
          transferred_calls: statsWeek.transferred_calls || 0
        },
        month: {
          total_calls: statsMonth.total_calls || 0,
          avg_duration: Math.round(statsMonth.avg_duration || 0),
          calls_with_bookings: statsMonth.calls_with_bookings || 0,
          transferred_calls: statsMonth.transferred_calls || 0
        },
        busiest_hour: busiestHour
      },
      chart: {
        calls_by_day: callsByDay
      },
      recent_calls: recentCalls.map(c => ({
        id: c.id,
        call_sid: c.call_sid,
        caller_phone: c.caller_phone,
        intent: c.intent,
        duration_seconds: c.duration_seconds,
        recording_available: !!c.recording_url,
        transferred: !!c.transferred,
        created_at: c.created_at
      })),
      voicemails: voicemails.map(v => ({
        id: v.id,
        caller_phone: v.caller_phone,
        recording_url: v.recording_url,
        duration: v.duration,
        transcription: v.transcription,
        created_at: v.created_at
      }))
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Analytics error:`, error.message);
    res.status(500).json({ 
      error: 'Failed to load analytics',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

module.exports = router;
