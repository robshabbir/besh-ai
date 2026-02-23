/**
 * SMS Notification Service
 * Sends SMS summaries to business owners after calls via Twilio
 */
const logger = require('../utils/logger');

let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      logger.warn('Twilio credentials not configured for SMS');
      return null;
    }
    twilioClient = require('twilio')(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send SMS summary of a completed call to the business owner
 * @param {Object} options
 * @param {string} options.to - Business owner phone number
 * @param {string} options.from - Twilio number to send from
 * @param {string} options.callerPhone - Who called
 * @param {string} options.intent - Detected intent (booking, emergency, info, etc.)
 * @param {number} options.duration - Call duration in seconds
 * @param {Object} options.collected - Collected info (name, service, etc.)
 * @param {boolean} options.isAfterHours - Whether call was after hours
 * @param {boolean} options.isEmergency - Whether emergency was detected
 */
async function sendCallSummary({ to, from, callerPhone, intent, duration, collected, isAfterHours, isEmergency }) {
  const client = getTwilioClient();
  if (!client || !to || !from) {
    logger.debug('SMS notify skipped — missing client/to/from', { to: !!to, from: !!from });
    return;
  }

  try {
    const durationMin = Math.round((duration || 0) / 60);
    const callerName = collected?.name || 'Unknown caller';
    const service = collected?.service || collected?.case_type || '';

    let emoji = '📞';
    if (isEmergency) emoji = '🚨';
    else if (intent === 'booking' || intent === 'appointment') emoji = '📅';
    else if (isAfterHours) emoji = '🌙';

    let msg = `${emoji} New call`;
    if (isAfterHours) msg += ' (after hours)';
    msg += `\nFrom: ${callerName}`;
    if (callerPhone) msg += ` (${callerPhone})`;
    if (service) msg += `\nRe: ${service}`;
    if (intent) msg += `\nType: ${intent}`;
    msg += `\nDuration: ${durationMin || '<1'}min`;

    if (isEmergency) {
      msg += '\n⚠️ EMERGENCY — call back ASAP';
    } else if (collected?.preferredTime) {
      msg += `\nPreferred time: ${collected.preferredTime}`;
    }

    // Truncate to SMS limit
    if (msg.length > 1500) msg = msg.substring(0, 1497) + '...';

    await client.messages.create({
      body: msg,
      from,
      to,
    });

    logger.info('SMS notification sent', { to, intent, isEmergency });
  } catch (err) {
    logger.error('SMS notification failed', { to, error: err.message });
  }
}

module.exports = { sendCallSummary };
