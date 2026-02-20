/**
 * Calva Integrations — Push call data to customer CRM/booking systems
 * 
 * Supported:
 * - Webhook (generic — works with Zapier, Make, n8n)
 * - HubSpot CRM (create contacts + deals)
 * - Google Calendar (book appointments)  
 * - Email summary (post-call report)
 * - SMS notification (to business owner)
 * 
 * Future:
 * - Resy (restaurant reservations)
 * - Calendly (scheduling)
 * - Salesforce
 * - ServiceTitan (HVAC/plumbing)
 * - Jobber (field service)
 */

const logger = require('../utils/logger');

// ============= WEBHOOK (Generic) =============

async function sendWebhook(url, data, { retries = 3, timeoutMs = 5000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(timer);
      
      if (response.ok) {
        logger.info('✅ Webhook sent', { url: url.substring(0, 50), status: response.status });
        return { success: true, status: response.status };
      }
      
      logger.warn('Webhook non-200', { url: url.substring(0, 50), status: response.status, attempt });
    } catch (e) {
      logger.warn('Webhook failed', { url: url.substring(0, 50), error: e.message, attempt });
    }
    
    if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // 1s, 2s, 4s
  }
  return { success: false };
}

// ============= HUBSPOT =============

async function pushToHubSpot(apiKey, callData) {
  if (!apiKey) return { success: false, error: 'No HubSpot API key' };
  
  const { callerPhone, callerName, intent, collected, transcript, duration } = callData;
  
  try {
    // 1. Search for existing contact
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: 'phone', operator: 'EQ', value: callerPhone }]
        }]
      })
    });
    
    const searchData = await searchRes.json();
    let contactId;
    
    if (searchData.results?.length > 0) {
      contactId = searchData.results[0].id;
      logger.info('HubSpot: existing contact', { contactId });
    } else {
      // 2. Create new contact
      const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          properties: {
            phone: callerPhone,
            firstname: callerName?.split(' ')[0] || '',
            lastname: callerName?.split(' ').slice(1).join(' ') || '',
            lifecyclestage: 'lead',
            hs_lead_status: intent === 'booking' ? 'IN_PROGRESS' : 'NEW'
          }
        })
      });
      
      const createData = await createRes.json();
      contactId = createData.id;
      logger.info('HubSpot: created contact', { contactId });
    }
    
    // 3. Create a note with call summary
    if (contactId) {
      const noteBody = [
        `📞 AI Receptionist Call`,
        `Duration: ${Math.floor((duration || 0) / 60)}:${((duration || 0) % 60).toString().padStart(2, '0')}`,
        `Intent: ${intent || 'general'}`,
        `Service needed: ${collected?.service || 'not specified'}`,
        ``,
        `Transcript Summary:`,
        ...(transcript || []).slice(-6).map(m => `${m.role === 'user' ? 'Caller' : 'Sarah'}: ${m.content}`)
      ].join('\n');
      
      await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          properties: { hs_note_body: noteBody, hs_timestamp: new Date().toISOString() },
          associations: [{
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
          }]
        })
      });
    }
    
    return { success: true, contactId };
  } catch (e) {
    logger.error('HubSpot push failed', { error: e.message });
    return { success: false, error: e.message };
  }
}

// ============= GOOGLE CALENDAR =============

async function createCalendarEvent(credentials, bookingData) {
  // TODO: Implement OAuth2 flow + calendar event creation
  // For now, use webhook to Zapier/Make which can create calendar events
  logger.info('Calendar booking placeholder', { data: bookingData });
  return { success: false, error: 'Calendar integration coming soon' };
}

// ============= EMAIL SUMMARY =============

async function sendCallSummaryEmail(to, callData, { from = 'noreply@calva.ai' } = {}) {
  if (!to) return { success: false, error: 'No email address' };
  
  try {
    const { sendEmail } = require('./email');
    const callerName = callData.collected?.name || 'Unknown caller';
    const service = callData.collected?.service || 'General inquiry';
    const preferredTime = callData.collected?.preferredTime || 'Not specified';
    const durationMin = Math.round((callData.duration || 0) / 60);
    const isEmergency = callData.urgency === 'emergency' || callData.intent === 'emergency';
    
    const emoji = isEmergency ? '🚨' : callData.intent === 'booking' ? '📅' : '📞';
    const subject = `${emoji} ${isEmergency ? 'URGENT: ' : ''}New call from ${callerName}`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">${subject}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Caller</td><td style="padding: 8px 0; font-weight: 600;">${callerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;"><a href="tel:${callData.callerPhone}">${callData.callerPhone || 'Unknown'}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Regarding</td><td style="padding: 8px 0;">${service}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Type</td><td style="padding: 8px 0;">${callData.intent || 'General'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Duration</td><td style="padding: 8px 0;">${durationMin || '<1'} min</td></tr>
          ${callData.intent === 'booking' ? `<tr><td style="padding: 8px 0; color: #666;">Preferred Time</td><td style="padding: 8px 0; font-weight: 600;">${preferredTime}</td></tr>` : ''}
        </table>
        ${isEmergency ? '<p style="color: #dc2626; font-weight: bold; margin-top: 16px;">⚠️ This was flagged as an EMERGENCY. Call back ASAP.</p>' : ''}
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Sent by Calva AI Receptionist</p>
      </div>
    `;
    
    await sendEmail({ to, subject, html });
    logger.info('Call summary email sent', { to, intent: callData.intent });
    return { success: true };
  } catch (err) {
    logger.error('Call summary email failed', { to, error: err.message });
    return { success: false, error: err.message };
  }
}

// ============= DISPATCHER =============

/**
 * Push call data to all configured integrations for a tenant.
 * Called after each call ends.
 */
async function pushCallData(tenant, callData) {
  const integrations = tenant.config?.integrations || {};
  const results = {};
  
  // Generic webhook
  if (integrations.webhookUrl) {
    results.webhook = await sendWebhook(integrations.webhookUrl, {
      event: 'call.completed',
      timestamp: new Date().toISOString(),
      business: tenant.name,
      caller: {
        phone: callData.callerPhone,
        name: callData.collected?.name || null
      },
      call: {
        duration: callData.duration,
        intent: callData.intent,
        service: callData.collected?.service || null,
        urgency: callData.urgency || 'normal'
      },
      collected: callData.collected,
      transcript: callData.transcript?.map(m => ({
        role: m.role === 'user' ? 'caller' : 'receptionist',
        text: m.content
      }))
    });
  }
  
  // HubSpot
  if (integrations.hubspotApiKey) {
    results.hubspot = await pushToHubSpot(integrations.hubspotApiKey, callData);
  }
  
  // ServiceTitan
  if (integrations.serviceTitan) {
    results.serviceTitan = await pushToServiceTitan(integrations.serviceTitan, callData);
  }
  
  // Jobber
  if (integrations.jobber) {
    results.jobber = await pushToJobber(integrations.jobber, callData);
  }
  
  // Resy (restaurants)
  if (integrations.resy) {
    results.resy = await pushToResy(integrations.resy, callData);
  }
  
  // N8N webhook (legacy)
  if (process.env.N8N_WEBHOOK_URL && callData.intent === 'booking') {
    results.n8n = await sendWebhook(process.env.N8N_WEBHOOK_URL, {
      type: 'booking',
      tenant_id: tenant.id,
      business_name: tenant.name,
      ...callData.collected
    });
  }
  
  logger.info('Integration results', { tenantId: tenant.id, results });
  return results;
}

// ============= SERVICETITAN =============

/**
 * Push call data to ServiceTitan (plumbing/HVAC field service management).
 * Creates a new booking or lead in ServiceTitan.
 * Docs: https://developer.servicetitan.io/
 */
async function pushToServiceTitan(config, callData) {
  const { appKey, tenantId: stTenantId, clientId, clientSecret } = config;
  if (!appKey || !stTenantId) return { success: false, error: 'ServiceTitan not configured' };
  
  try {
    // 1. Get auth token
    const authRes = await fetch('https://auth.servicetitan.io/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    const { access_token } = await authRes.json();
    
    // 2. Create/find customer
    const customerRes = await fetch(`https://api.servicetitan.io/crm/v2/tenant/${stTenantId}/customers?phoneNumber=${encodeURIComponent(callData.callerPhone)}`, {
      headers: { 'Authorization': `Bearer ${access_token}`, 'ST-App-Key': appKey }
    });
    const customerData = await customerRes.json();
    
    let customerId;
    if (customerData.data?.length > 0) {
      customerId = customerData.data[0].id;
    } else {
      // Create new customer
      const names = (callData.callerName || 'Unknown Caller').split(' ');
      const createRes = await fetch(`https://api.servicetitan.io/crm/v2/tenant/${stTenantId}/customers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}`, 'ST-App-Key': appKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: callData.callerName || 'AI Call Lead',
          type: 'Residential',
          phones: [{ type: 'Mobile', number: callData.callerPhone }]
        })
      });
      const created = await createRes.json();
      customerId = created.id;
    }
    
    // 3. Create a booking/lead
    if (customerId && (callData.intent === 'booking' || callData.intent === 'new_client')) {
      await fetch(`https://api.servicetitan.io/crm/v2/tenant/${stTenantId}/bookings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}`, 'ST-App-Key': appKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          source: 'AI Receptionist',
          summary: `AI call: ${callData.collected?.service || 'General inquiry'}. ${callData.collected?.address || ''}`.trim(),
          isFirstTimeClient: !customerData.data?.length
        })
      });
    }
    
    logger.info('ServiceTitan push complete', { customerId });
    return { success: true, customerId };
  } catch (e) {
    logger.error('ServiceTitan push failed', { error: e.message });
    return { success: false, error: e.message };
  }
}

// ============= JOBBER =============

/**
 * Push call data to Jobber (field service management for small businesses).
 * Creates a new request/client in Jobber via GraphQL API.
 * Docs: https://developer.getjobber.com/
 */
async function pushToJobber(config, callData) {
  const { accessToken } = config;
  if (!accessToken) return { success: false, error: 'Jobber not configured' };
  
  const JOBBER_GQL = 'https://api.getjobber.com/api/graphql';
  
  try {
    // 1. Find or create client
    const searchRes = await fetch(JOBBER_GQL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { clients(searchTerm: "${callData.callerPhone}") { nodes { id name } } }`
      })
    });
    const searchData = await searchRes.json();
    
    let clientId;
    if (searchData.data?.clients?.nodes?.length > 0) {
      clientId = searchData.data.clients.nodes[0].id;
    } else {
      const names = (callData.callerName || 'AI Call Lead').split(' ');
      const createRes = await fetch(JOBBER_GQL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { clientCreate(input: { firstName: "${names[0] || 'Unknown'}", lastName: "${names.slice(1).join(' ') || 'Caller'}", phones: [{ number: "${callData.callerPhone}", primary: true }] }) { client { id } } }`
        })
      });
      const createData = await createRes.json();
      clientId = createData.data?.clientCreate?.client?.id;
    }
    
    // 2. Create a request
    if (clientId) {
      await fetch(JOBBER_GQL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { requestCreate(input: { clientId: "${clientId}", title: "AI Receptionist Lead: ${callData.collected?.service || 'General'}", details: "Caller: ${callData.callerPhone}\\nService: ${callData.collected?.service || 'Not specified'}\\nSource: Calva AI Receptionist" }) { request { id } } }`
        })
      });
    }
    
    logger.info('Jobber push complete', { clientId });
    return { success: true, clientId };
  } catch (e) {
    logger.error('Jobber push failed', { error: e.message });
    return { success: false, error: e.message };
  }
}

// ============= RESY =============

/**
 * Create a reservation via Resy (restaurant booking).
 * Note: Resy doesn't have a public API — uses internal endpoints.
 * This is a stub for when they open their API or we use a partner integration.
 */
async function pushToResy(config, callData) {
  logger.info('Resy integration stub', { collected: callData.collected });
  // TODO: Resy API integration when available
  // For now, fall back to webhook which can connect to OpenTable or Resy via Zapier
  return { success: false, error: 'Resy direct integration coming soon — use webhook + Zapier for now' };
}

module.exports = {
  sendWebhook,
  pushToHubSpot,
  pushToServiceTitan,
  pushToJobber,
  pushToResy,
  createCalendarEvent,
  sendCallSummaryEmail,
  pushCallData
};
