const db = require('../db');
const logger = require('../utils/logger');
const { sendNotification } = require('./notify');

/**
 * Create a booking from collected call data
 */
async function createBooking(tenantId, callId, collectedData, intent) {
  try {
    // Extract booking information from collected data
    const bookingData = {
      tenant_id: tenantId,
      call_id: callId,
      customer_name: collectedData.name || 'Unknown',
      customer_phone: collectedData.phone || collectedData.customer_phone || '',
      customer_email: collectedData.email || collectedData.customer_email || null,
      service: collectedData.service || collectedData.case_type || 'General inquiry',
      preferred_time: collectedData.preferredTime || collectedData.preferred_time || null,
      address: collectedData.address || null,
      notes: collectedData.description || collectedData.notes || null,
      status: 'pending'
    };

    const bookingId = db.createBooking(bookingData);
    
    logger.info('Booking created', { bookingId, tenantId, callId });

    // Send notification to business owner
    const tenant = db.getTenantById(tenantId);
    if (tenant) {
      await sendNotification(tenant, 'booking', {
        booking_id: bookingId,
        customer_name: bookingData.customer_name,
        customer_phone: bookingData.customer_phone,
        service: bookingData.service,
        preferred_time: bookingData.preferred_time
      });
    }

    return bookingId;
  } catch (error) {
    logger.error('Failed to create booking', { error: error.message, tenantId, callId });
    throw error;
  }
}

/**
 * Handle emergency intent - send immediate notification
 */
async function handleEmergency(tenantId, callId, collectedData) {
  try {
    logger.warn('Emergency call detected', { tenantId, callId });

    const tenant = db.getTenantById(tenantId);
    if (tenant) {
      await sendNotification(tenant, 'emergency', {
        call_id: callId,
        caller_phone: collectedData.phone || collectedData.customer_phone || 'Unknown',
        caller_name: collectedData.name || 'Unknown',
        description: collectedData.description || 'Emergency call received'
      });
    }
  } catch (error) {
    logger.error('Failed to handle emergency', { error: error.message, tenantId, callId });
  }
}

module.exports = {
  createBooking,
  handleEmergency
};
