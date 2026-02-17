const twilio = require('twilio');
const logger = require('../utils/logger');

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Search for available phone numbers
 * @param {string} areaCode - Optional area code filter
 * @param {string} country - Country code (default: US)
 */
async function searchPhoneNumbers(areaCode = null, country = 'US') {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    const options = {
      voiceEnabled: true,
      smsEnabled: true
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
      region: num.region
    }));
  } catch (error) {
    logger.error('Failed to search phone numbers', { error: error.message });
    throw error;
  }
}

/**
 * Purchase a phone number for a tenant
 * @param {string} phoneNumber - Phone number to purchase (E.164 format)
 * @param {string} voiceUrl - Webhook URL for incoming calls
 */
async function purchasePhoneNumber(phoneNumber, voiceUrl) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl,
      voiceMethod: 'POST',
      statusCallback: voiceUrl.replace('/voice', '/status'),
      statusCallbackMethod: 'POST'
    });

    logger.info('Phone number purchased', { 
      phoneNumber: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid 
    });

    return {
      phoneNumber: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid,
      voiceUrl: purchasedNumber.voiceUrl
    };
  } catch (error) {
    logger.error('Failed to purchase phone number', { error: error.message, phoneNumber });
    throw error;
  }
}

/**
 * Update phone number webhook URL
 */
async function updatePhoneNumberWebhook(phoneNumberSid, voiceUrl) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    await twilioClient
      .incomingPhoneNumbers(phoneNumberSid)
      .update({
        voiceUrl,
        voiceMethod: 'POST'
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
  searchPhoneNumbers,
  purchasePhoneNumber,
  updatePhoneNumberWebhook
};
