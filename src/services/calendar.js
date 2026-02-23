/**
 * Google Calendar Integration for Calva AI
 * 
 * Enables real-time appointment booking during calls.
 * Each tenant can connect their Google Calendar via OAuth2.
 * The AI agent can check availability and book appointments during the call.
 */

const { google } = require('googleapis');
const logger = require('../utils/logger');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// OAuth2 client (configured per deployment)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL}/api/calendar/callback`;

/**
 * Create OAuth2 client
 */
function createOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return null;
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Generate authorization URL for a tenant to connect their calendar
 */
function getAuthUrl(tenantId) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: String(tenantId),
    prompt: 'consent'
  });
}

/**
 * Exchange auth code for tokens
 */
async function exchangeCode(code) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) throw new Error('Google Calendar not configured');

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get authenticated calendar client for a tenant
 */
function getCalendarClient(tokens) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return null;

  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Refresh tokens if expired
 */
async function refreshTokensIfNeeded(tokens) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return tokens;

  oauth2Client.setCredentials(tokens);

  // Check if access token is expired or close to expiring
  if (tokens.expiry_date && tokens.expiry_date < Date.now() + 60000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  }

  return tokens;
}

/**
 * Get available time slots for a given date
 * @param {Object} tokens - Google OAuth tokens
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} options - { calendarId, slotDuration, businessHoursStart, businessHoursEnd, timezone }
 */
async function getAvailableSlots(tokens, date, options = {}) {
  const {
    calendarId = 'primary',
    slotDuration = 60, // minutes
    businessHoursStart = 9,
    businessHoursEnd = 17,
    timezone = 'America/New_York'
  } = options;

  const refreshedTokens = await refreshTokensIfNeeded(tokens);
  const calendar = getCalendarClient(refreshedTokens);
  if (!calendar) return [];

  const startOfDay = new Date(`${date}T${String(businessHoursStart).padStart(2, '0')}:00:00`);
  const endOfDay = new Date(`${date}T${String(businessHoursEnd).padStart(2, '0')}:00:00`);

  // Get existing events for the day
  const { data } = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    timeZone: timezone
  });

  const busySlots = (data.items || []).map(event => ({
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date)
  }));

  // Generate available slots
  const available = [];
  let current = new Date(startOfDay);

  while (current < endOfDay) {
    const slotEnd = new Date(current.getTime() + slotDuration * 60000);
    if (slotEnd > endOfDay) break;

    // Check if this slot overlaps with any busy period
    const isAvailable = !busySlots.some(busy =>
      (current < busy.end && slotEnd > busy.start)
    );

    if (isAvailable) {
      available.push({
        start: new Date(current),
        end: new Date(slotEnd),
        label: formatTime(current)
      });
    }

    // Move to next slot
    current = new Date(current.getTime() + 30 * 60000); // 30-min increments
  }

  return { slots: available, refreshedTokens };
}

/**
 * Book an appointment
 * @param {Object} tokens - Google OAuth tokens
 * @param {Object} appointment - { date, time, duration, customerName, customerPhone, service, notes }
 * @param {Object} options - { calendarId, timezone }
 */
async function bookAppointment(tokens, appointment, options = {}) {
  const {
    calendarId = 'primary',
    timezone = 'America/New_York'
  } = options;

  const refreshedTokens = await refreshTokensIfNeeded(tokens);
  const calendar = getCalendarClient(refreshedTokens);
  if (!calendar) throw new Error('Calendar not available');

  const { date, time, duration = 60, customerName, customerPhone, service, notes } = appointment;

  // Parse start time
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  const event = {
    summary: `${service || 'Appointment'} — ${customerName}`,
    description: [
      `Customer: ${customerName}`,
      `Phone: ${customerPhone}`,
      service ? `Service: ${service}` : '',
      notes ? `Notes: ${notes}` : '',
      '',
      'Booked by Calva AI Receptionist'
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timezone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timezone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 }
      ]
    }
  };

  const { data } = await calendar.events.insert({
    calendarId,
    resource: event,
    sendNotifications: true
  });

  logger.info('Calendar appointment booked', {
    eventId: data.id,
    customer: customerName,
    service,
    start: startDateTime.toISOString()
  });

  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
    start: startDateTime,
    end: endDateTime,
    refreshedTokens
  };
}

/**
 * Get upcoming appointments for today/this week
 */
async function getUpcomingAppointments(tokens, options = {}) {
  const {
    calendarId = 'primary',
    days = 1,
    timezone = 'America/New_York'
  } = options;

  const refreshedTokens = await refreshTokensIfNeeded(tokens);
  const calendar = getCalendarClient(refreshedTokens);
  if (!calendar) return [];

  const now = new Date();
  const end = new Date(now.getTime() + days * 86400000);

  const { data } = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    timeZone: timezone
  });

  return {
    appointments: (data.items || []).map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      description: event.description
    })),
    refreshedTokens
  };
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Check if calendar is configured
 */
function isConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

module.exports = {
  isConfigured,
  getAuthUrl,
  exchangeCode,
  getAvailableSlots,
  bookAppointment,
  getUpcomingAppointments,
  refreshTokensIfNeeded
};
