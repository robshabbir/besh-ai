const twilio = require('twilio');
const logger = require('../utils/logger');
const db = require('../db');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Automatically provision a phone number for a new tenant
 * @param {number} tenantId - Tenant database ID
 * @param {string} areaCode - Optional preferred area code
 * @param {string} country - Country code (default: US)
 * @returns {Object} Provisioned phone number details
 */
async function provisionPhoneNumberForTenant(tenantId, areaCode = null, country = 'US') {
  if (!twilioClient) {
    throw new Error('Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  }

  try {
    logger.info('Starting phone number provisioning', { tenantId, areaCode, country });

    // Step 1: Search for available numbers
    const searchOptions = {
      voiceEnabled: true,
      smsEnabled: true,
      limit: 5 // Get 5 options to increase chances of successful purchase
    };

    if (areaCode) {
      searchOptions.areaCode = areaCode;
    }

    const availableNumbers = await twilioClient
      .availablePhoneNumbers(country)
      .local
      .list(searchOptions);

    if (!availableNumbers || availableNumbers.length === 0) {
      throw new Error(`No available phone numbers found${areaCode ? ` for area code ${areaCode}` : ''}`);
    }

    // Step 2: Construct webhook URL
    const baseUrl = process.env.BASE_URL || process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    const voiceWebhookUrl = `${baseUrl}/api/voice`;
    const statusWebhookUrl = `${baseUrl}/api/status`;

    logger.info('Webhook URLs configured', { voiceWebhookUrl, statusWebhookUrl });

    // Step 3: Purchase the first available number
    let purchasedNumber = null;
    let lastError = null;

    for (const number of availableNumbers) {
      try {
        purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
          phoneNumber: number.phoneNumber,
          voiceUrl: voiceWebhookUrl,
          voiceMethod: 'POST',
          statusCallback: statusWebhookUrl,
          statusCallbackMethod: 'POST',
          smsUrl: `${baseUrl}/api/sms`, // For future SMS support
          smsMethod: 'POST',
          friendlyName: `Calva Tenant ${tenantId} - ${number.locality || 'Local'}`
        });

        logger.info('Phone number purchased successfully', {
          tenantId,
          phoneNumber: purchasedNumber.phoneNumber,
          sid: purchasedNumber.sid,
          locality: number.locality,
          region: number.region
        });

        break; // Success! Exit loop
      } catch (error) {
        lastError = error;
        logger.warn('Failed to purchase number, trying next', {
          phoneNumber: number.phoneNumber,
          error: error.message
        });
        continue;
      }
    }

    if (!purchasedNumber) {
      throw lastError || new Error('Failed to purchase any available number');
    }

    // Step 4: Update tenant record with new phone number
    const updated = db.updateTenant(tenantId, {
      phone_number: purchasedNumber.phoneNumber
    });

    if (!updated) {
      // Rollback: release the phone number if DB update fails
      logger.error('Failed to update tenant with phone number, releasing number', { tenantId });
      try {
        await twilioClient.incomingPhoneNumbers(purchasedNumber.sid).remove();
      } catch (releaseError) {
        logger.error('Failed to release phone number during rollback', {
          error: releaseError.message,
          sid: purchasedNumber.sid
        });
      }
      throw new Error('Failed to update tenant database record');
    }

    logger.info('Phone number provisioning completed', {
      tenantId,
      phoneNumber: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid
    });

    return {
      success: true,
      phoneNumber: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid,
      friendlyName: purchasedNumber.friendlyName,
      locality: availableNumbers.find(n => n.phoneNumber === purchasedNumber.phoneNumber)?.locality,
      region: availableNumbers.find(n => n.phoneNumber === purchasedNumber.phoneNumber)?.region,
      voiceUrl: purchasedNumber.voiceUrl,
      statusCallback: purchasedNumber.statusCallback
    };
  } catch (error) {
    logger.error('Phone number provisioning failed', {
      error: error.message,
      stack: error.stack,
      tenantId
    });
    throw error;
  }
}

/**
 * Search for available numbers (for preview before provisioning)
 * @param {string} areaCode - Optional area code filter
 * @param {string} country - Country code (default: US)
 * @returns {Array} List of available numbers
 */
async function searchAvailableNumbers(areaCode = null, country = 'US', limit = 10) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    const options = {
      voiceEnabled: true,
      smsEnabled: true,
      limit
    };

    if (areaCode) {
      options.areaCode = areaCode;
    }

    const numbers = await twilioClient
      .availablePhoneNumbers(country)
      .local
      .list(options);

    return numbers.map(num => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality,
      region: num.region,
      capabilities: {
        voice: num.capabilities.voice,
        sms: num.capabilities.SMS,
        mms: num.capabilities.MMS
      }
    }));
  } catch (error) {
    logger.error('Failed to search available numbers', { error: error.message });
    throw error;
  }
}

/**
 * Release a phone number (for cleanup or cancellation)
 * @param {string} phoneNumberSid - Twilio phone number SID
 */
async function releasePhoneNumber(phoneNumberSid) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).remove();
    logger.info('Phone number released', { phoneNumberSid });
    return true;
  } catch (error) {
    logger.error('Failed to release phone number', {
      error: error.message,
      phoneNumberSid
    });
    throw error;
  }
}

/**
 * Update webhook URL for an existing phone number
 * @param {string} phoneNumberSid - Twilio phone number SID
 * @param {string} voiceUrl - New voice webhook URL
 */
async function updatePhoneNumberWebhook(phoneNumberSid, voiceUrl) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    const statusUrl = voiceUrl.replace('/voice', '/status');

    await twilioClient
      .incomingPhoneNumbers(phoneNumberSid)
      .update({
        voiceUrl,
        voiceMethod: 'POST',
        statusCallback: statusUrl,
        statusCallbackMethod: 'POST'
      });

    logger.info('Phone number webhook updated', { phoneNumberSid, voiceUrl });
    return true;
  } catch (error) {
    logger.error('Failed to update phone number webhook', {
      error: error.message,
      phoneNumberSid
    });
    throw error;
  }
}

module.exports = {
  provisionPhoneNumberForTenant,
  searchAvailableNumbers,
  releasePhoneNumber,
  updatePhoneNumberWebhook
};
