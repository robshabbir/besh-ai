/**
 * Google Calendar Integration Routes
 * Currently stubbed — Calendar integration is Phase 2.
 * All routes return graceful "coming soon" responses.
 */

const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/calendar/status
 * Calendar is not yet available
 */
router.get('/status', (req, res) => {
  res.json({
    configured: false,
    connected: false,
    comingSoon: true,
    message: 'Google Calendar integration coming soon! For now, appointment requests are sent via SMS and email.'
  });
});

/**
 * GET /api/calendar/connect
 * Calendar OAuth not available yet
 */
router.get('/connect', (req, res) => {
  res.status(503).json({
    error: 'Coming soon',
    message: 'Google Calendar integration is coming soon. Appointment requests are currently captured and sent to you via SMS.'
  });
});

/**
 * GET /api/calendar/callback
 * OAuth callback — not available
 */
router.get('/callback', (req, res) => {
  res.redirect('/dashboard/settings?calendar=coming-soon');
});

/**
 * POST /api/calendar/disconnect
 * Nothing to disconnect
 */
router.post('/disconnect', (req, res) => {
  res.json({ success: true, message: 'Calendar was not connected.' });
});

/**
 * GET /api/calendar/slots
 * No slots available without calendar
 */
router.get('/slots', (req, res) => {
  res.json({
    date: req.query.date,
    slots: [],
    comingSoon: true,
    message: 'Calendar integration coming soon. Callers can request a preferred time and you\'ll be notified via SMS.'
  });
});

/**
 * POST /api/calendar/book
 * Can't book without calendar — capture request instead
 */
router.post('/book', async (req, res) => {
  const { date, time, customerName, customerPhone, service, notes } = req.body;
  
  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'customerName and customerPhone required' });
  }

  // Log the appointment request (it will be sent via SMS through the normal call flow)
  logger.info('Appointment request captured (no calendar)', {
    date, time, customerName, customerPhone, service, notes
  });

  res.json({
    success: true,
    method: 'sms-notification',
    message: 'Appointment request captured. The business owner will be notified via SMS.'
  });
});

module.exports = router;
