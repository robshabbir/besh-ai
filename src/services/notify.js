const twilio = require('twilio');
const db = require('../db');
const logger = require('../utils/logger');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send notification to business owner
 * @param {Object} tenant - Tenant object with config
 * @param {string} type - Notification type: 'booking', 'emergency', 'call_summary'
 * @param {Object} payload - Notification data
 */
async function sendNotification(tenant, type, payload) {
  try {
    const config = tenant.config || JSON.parse(tenant.config_json);
    const notificationSettings = config.notifications || {};

    // Log to database
    db.createNotification(tenant.id, type, payload);

    // SMS notification (if enabled and Twilio configured)
    if (notificationSettings.sms && notificationSettings.sms_number && twilioClient) {
      const message = buildSmsMessage(type, payload, tenant.name);
      
      await twilioClient.messages.create({
        body: message,
        to: notificationSettings.sms_number,
        from: tenant.phone_number || process.env.TWILIO_PHONE_NUMBER
      });

      logger.info('SMS notification sent', { 
        tenantId: tenant.id, 
        type, 
        to: notificationSettings.sms_number 
      });
    }

    // Email notification could be added here
    if (notificationSettings.email && notificationSettings.email_address) {
      logger.debug('Email notification requested (not implemented)', { 
        tenantId: tenant.id, 
        type 
      });
    }

    // Webhook notification
    if (notificationSettings.webhook_url) {
      try {
        await fetch(notificationSettings.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            type,
            payload,
            timestamp: new Date().toISOString()
          })
        });
        logger.info('Webhook notification sent', { tenantId: tenant.id, type });
      } catch (error) {
        logger.error('Webhook notification failed', { 
          error: error.message, 
          tenantId: tenant.id 
        });
      }
    }
  } catch (error) {
    logger.error('Notification failed', { 
      error: error.message, 
      tenantId: tenant.id, 
      type 
    });
  }
}

/**
 * Build SMS message based on notification type
 */
function buildSmsMessage(type, payload, businessName) {
  switch (type) {
    case 'booking':
      return `🔔 New Booking - ${businessName}\n\n` +
             `Customer: ${payload.customer_name}\n` +
             `Phone: ${payload.customer_phone}\n` +
             `Service: ${payload.service}\n` +
             `Time: ${payload.preferred_time || 'Not specified'}\n\n` +
             `View details in your dashboard.`;
    
    case 'emergency':
      return `🚨 EMERGENCY CALL - ${businessName}\n\n` +
             `Caller: ${payload.caller_name}\n` +
             `Phone: ${payload.caller_phone}\n` +
             `Details: ${payload.description}\n\n` +
             `Please contact immediately!`;
    
    case 'call_summary':
      return `📞 Call Summary - ${businessName}\n\n` +
             `Caller: ${payload.caller_phone}\n` +
             `Intent: ${payload.intent}\n` +
             `Duration: ${payload.duration_seconds}s\n\n` +
             `View full transcript in dashboard.`;
    
    default:
      return `Notification from ${businessName}: ${JSON.stringify(payload)}`;
  }
}

module.exports = {
  sendNotification,
  buildSmsMessage
};
