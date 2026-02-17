const twilio = require('twilio');
const logger = require('../utils/logger');
const db = require('../db');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send SMS notification via Twilio
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} from - Sender phone number (Twilio number)
 * @param {string} body - Message body
 */
async function sendSMS(to, from, body) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from,
      to
    });

    logger.info('SMS sent', {
      to,
      from,
      messageSid: message.sid,
      status: message.status
    });

    return {
      success: true,
      messageSid: message.sid,
      status: message.status
    };
  } catch (error) {
    logger.error('Failed to send SMS', {
      error: error.message,
      to,
      from
    });
    throw error;
  }
}

/**
 * Send post-call summary to business owner
 * @param {number} tenantId - Tenant ID
 * @param {number} callId - Call ID
 * @param {Object} callData - Call information (caller, intent, collected data)
 */
async function sendOwnerNotification(tenantId, callId, callData) {
  try {
    const tenant = db.getTenantById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const ownerPhone = tenant.config?.businessConfig?.ownerPhone || tenant.config?.businessConfig?.emergency_line;
    
    if (!ownerPhone) {
      logger.warn('No owner phone number configured for tenant', { tenantId });
      return { success: false, reason: 'No owner phone configured' };
    }

    const businessPhone = tenant.phone_number;
    if (!businessPhone) {
      throw new Error('Tenant has no assigned phone number');
    }

    // Format the notification message
    const callerName = callData.collected?.name || 'Unknown caller';
    const callerPhone = callData.collected?.phone || callData.caller_phone || 'No number provided';
    const intent = callData.intent || 'Unknown';
    const service = callData.collected?.service || callData.collected?.emergencyType || 'Not specified';
    const time = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'short',
      timeStyle: 'short'
    });

    let message = `📞 New Call - ${tenant.name}\n\n`;
    message += `👤 ${callerName}\n`;
    message += `📱 ${callerPhone}\n`;
    message += `🎯 ${formatIntent(intent)}\n`;
    
    if (intent === 'emergency') {
      message += `🚨 EMERGENCY: ${service}\n`;
      if (callData.collected?.address) {
        message += `📍 ${callData.collected.address}\n`;
      }
      message += `⚠️ URGENT - Call back ASAP!\n`;
    } else if (intent === 'booking' || intent === 'new_client') {
      message += `📋 Service: ${service}\n`;
      if (callData.collected?.preferredTime) {
        message += `🗓️ Requested: ${callData.collected.preferredTime}\n`;
      }
      if (callData.collected?.address) {
        message += `📍 ${callData.collected.address}\n`;
      }
    } else {
      message += `💬 ${service}\n`;
    }
    
    message += `\n⏰ ${time}`;

    const result = await sendSMS(ownerPhone, businessPhone, message);

    // Log notification in database
    db.createNotification(tenantId, 'owner_summary', {
      callId,
      callerName,
      callerPhone,
      intent,
      service,
      sentTo: ownerPhone,
      messageSid: result.messageSid
    });

    logger.info('Owner notification sent', {
      tenantId,
      callId,
      ownerPhone,
      intent
    });

    return result;
  } catch (error) {
    logger.error('Failed to send owner notification', {
      error: error.message,
      tenantId,
      callId
    });
    // Don't throw - we don't want to break the main flow if notification fails
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation SMS to caller (if appointment was booked)
 * @param {number} tenantId - Tenant ID
 * @param {number} callId - Call ID
 * @param {Object} bookingData - Booking information
 */
async function sendCallerConfirmation(tenantId, callId, bookingData) {
  try {
    const tenant = db.getTenantById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const businessPhone = tenant.phone_number;
    if (!businessPhone) {
      throw new Error('Tenant has no assigned phone number');
    }

    const callerPhone = bookingData.customer_phone || bookingData.collected?.phone;
    if (!callerPhone) {
      logger.warn('No caller phone number available for confirmation', { tenantId, callId });
      return { success: false, reason: 'No caller phone number' };
    }

    const businessName = tenant.config?.businessConfig?.name || tenant.name;
    const service = bookingData.service || bookingData.collected?.service || 'service';
    const preferredTime = bookingData.preferred_time || bookingData.collected?.preferredTime;
    
    let message = `✅ Appointment Confirmed - ${businessName}\n\n`;
    message += `Thank you for booking with us!\n\n`;
    message += `📋 Service: ${service}\n`;
    
    if (preferredTime) {
      message += `🗓️ When: ${preferredTime}\n`;
    } else {
      message += `📞 We'll call you to confirm the date/time.\n`;
    }
    
    message += `\nQuestions? Reply to this text or call ${formatPhoneDisplay(businessPhone)}`;

    const result = await sendSMS(callerPhone, businessPhone, message);

    // Log notification in database
    db.createNotification(tenantId, 'caller_confirmation', {
      callId,
      callerPhone,
      service,
      preferredTime,
      messageSid: result.messageSid
    });

    logger.info('Caller confirmation sent', {
      tenantId,
      callId,
      callerPhone
    });

    return result;
  } catch (error) {
    logger.error('Failed to send caller confirmation', {
      error: error.message,
      tenantId,
      callId
    });
    // Don't throw - we don't want to break the main flow if notification fails
    return { success: false, error: error.message };
  }
}

/**
 * Send both owner notification and caller confirmation after a call
 * @param {number} tenantId - Tenant ID
 * @param {number} callId - Call ID
 * @param {Object} callData - Call information
 * @param {Object} bookingData - Booking information (if applicable)
 */
async function sendPostCallNotifications(tenantId, callId, callData, bookingData = null) {
  const results = {
    ownerNotification: null,
    callerConfirmation: null
  };

  // Always send owner notification
  try {
    results.ownerNotification = await sendOwnerNotification(tenantId, callId, callData);
  } catch (error) {
    logger.error('Owner notification failed', { error: error.message, tenantId, callId });
  }

  // Send caller confirmation only if booking was made
  if (bookingData && (callData.intent === 'booking' || callData.intent === 'new_client')) {
    try {
      results.callerConfirmation = await sendCallerConfirmation(tenantId, callId, bookingData);
    } catch (error) {
      logger.error('Caller confirmation failed', { error: error.message, tenantId, callId });
    }
  }

  logger.info('Post-call notifications completed', {
    tenantId,
    callId,
    ownerSent: results.ownerNotification?.success || false,
    callerSent: results.callerConfirmation?.success || false
  });

  return results;
}

/**
 * Format intent for human-readable display
 */
function formatIntent(intent) {
  const intentMap = {
    'emergency': '🚨 Emergency',
    'booking': '📅 Appointment Booking',
    'new_client': '✨ New Client Booking',
    'question': '❓ Question',
    'existing_customer': '👥 Existing Customer',
    'complete': '✅ Call Complete'
  };
  return intentMap[intent] || intent;
}

/**
 * Format phone number for display
 */
function formatPhoneDisplay(phone) {
  if (!phone) return '';
  // Convert +19295551234 to (929) 555-1234
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned[0] === '1') {
    const areaCode = cleaned.substring(1, 4);
    const prefix = cleaned.substring(4, 7);
    const line = cleaned.substring(7);
    return `(${areaCode}) ${prefix}-${line}`;
  } else if (cleaned.length === 10) {
    const areaCode = cleaned.substring(0, 3);
    const prefix = cleaned.substring(3, 6);
    const line = cleaned.substring(6);
    return `(${areaCode}) ${prefix}-${line}`;
  }
  return phone;
}

module.exports = {
  sendSMS,
  sendOwnerNotification,
  sendCallerConfirmation,
  sendPostCallNotifications,
  formatIntent,
  formatPhoneDisplay
};
