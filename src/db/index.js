const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

function init() {
  if (supabase) return supabase;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('[DB] Connected to Supabase');
  return supabase;
}

function getDb() {
  if (!supabase) throw new Error('Database not initialized. Call init() first.');
  return supabase;
}

function getSupabase() { return getDb(); }

function close() { supabase = null; }

// Helper: parse config_json from JSONB (already object in Supabase)
function parseTenant(t) {
  if (!t) return null;
  if (t.config_json && typeof t.config_json === 'object') t.config = t.config_json;
  else if (t.config_json && typeof t.config_json === 'string') t.config = JSON.parse(t.config_json);
  return t;
}

function parseCall(c) {
  if (!c) return null;
  if (c.transcript_json) c.transcript = typeof c.transcript_json === 'string' ? JSON.parse(c.transcript_json) : c.transcript_json;
  if (c.collected_data_json) c.collected_data = typeof c.collected_data_json === 'string' ? JSON.parse(c.collected_data_json) : c.collected_data_json;
  // Convert timestamptz to unix epoch for backward compat
  if (c.created_at && typeof c.created_at === 'string') c.created_at_ts = Math.floor(new Date(c.created_at).getTime() / 1000);
  return c;
}

function parseNotification(n) {
  if (!n) return null;
  if (n.payload_json) n.payload = typeof n.payload_json === 'string' ? JSON.parse(n.payload_json) : n.payload_json;
  return n;
}

// ============= TENANT QUERIES =============

async function createTenant(name, industry, phoneNumber, configJson, apiKey) {
  const { data, error } = await getDb().from('calva_tenants').insert({
    name, industry, phone_number: phoneNumber,
    config_json: configJson, api_key: apiKey, active: true
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getTenantById(id) {
  const { data, error } = await getDb().from('calva_tenants').select('*').eq('id', id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return parseTenant(data);
}

async function getTenantByPhoneNumber(phoneNumber) {
  const normalized = phoneNumber ? phoneNumber.trim().replace(/^\s/, '+') : phoneNumber;
  let { data, error } = await getDb().from('calva_tenants')
    .select('*').eq('phone_number', normalized).eq('active', true).single();
  if (error && error.code === 'PGRST116') {
    // Try original
    ({ data, error } = await getDb().from('calva_tenants')
      .select('*').eq('phone_number', phoneNumber).eq('active', true).single());
  }
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return parseTenant(data);
}

async function getTenantByApiKey(apiKey) {
  const { data, error } = await getDb().from('calva_tenants')
    .select('*').eq('api_key', apiKey).eq('active', true).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return parseTenant(data);
}

async function getAllTenants() {
  const { data, error } = await getDb().from('calva_tenants')
    .select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(parseTenant);
}

async function updateTenant(id, updates) {
  const patch = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.phone_number !== undefined) patch.phone_number = updates.phone_number;
  if (updates.config_json !== undefined) patch.config_json = updates.config_json;
  if (updates.active !== undefined) patch.active = !!updates.active;
  if (updates.industry !== undefined) patch.industry = updates.industry;
  if (Object.keys(patch).length === 0) return false;
  const { error, count } = await getDb().from('calva_tenants').update(patch).eq('id', id);
  if (error) throw error;
  return true;
}

// ============= CALL QUERIES =============

async function createCall(tenantId, callSid, callerPhone) {
  const { data, error } = await getDb().from('calva_calls').insert({
    tenant_id: tenantId, call_sid: callSid, caller_phone: callerPhone
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function updateCall(callSid, updates) {
  const patch = {};
  if (updates.transcript !== undefined) patch.transcript_json = updates.transcript;
  if (updates.intent !== undefined) patch.intent = updates.intent;
  if (updates.collected_data !== undefined) patch.collected_data_json = updates.collected_data;
  if (updates.duration_seconds !== undefined) patch.duration_seconds = updates.duration_seconds;
  if (updates.recording_url !== undefined) patch.recording_url = updates.recording_url;
  if (updates.recording_duration !== undefined) patch.recording_duration = updates.recording_duration;
  if (updates.language !== undefined) patch.language = updates.language;
  if (updates.transferred !== undefined) patch.transferred = updates.transferred;
  if (updates.transfer_to !== undefined) patch.transfer_to = updates.transfer_to;
  if (Object.keys(patch).length === 0) return false;
  const { error } = await getDb().from('calva_calls').update(patch).eq('call_sid', callSid);
  if (error) throw error;
  return true;
}

async function getCallBySid(callSid) {
  const { data, error } = await getDb().from('calva_calls').select('*').eq('call_sid', callSid).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return parseCall(data);
}

async function getCallsByTenant(tenantId, limit = 50) {
  const { data, error } = await getDb().from('calva_calls')
    .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []).map(parseCall);
}

// ============= BOOKING QUERIES =============

async function createBooking(d) {
  const { data, error } = await getDb().from('calva_bookings').insert({
    tenant_id: d.tenant_id, call_id: d.call_id || null,
    customer_name: d.customer_name, customer_phone: d.customer_phone,
    customer_email: d.customer_email || null, service: d.service,
    preferred_time: d.preferred_time || null, address: d.address || null,
    notes: d.notes || null, status: d.status || 'pending'
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getBookingsByTenant(tenantId, limit = 50) {
  const { data, error } = await getDb().from('calva_bookings')
    .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

async function updateBookingStatus(id, status) {
  const { error } = await getDb().from('calva_bookings').update({ status }).eq('id', id);
  if (error) throw error;
  return true;
}

// ============= NOTIFICATION QUERIES =============

async function createNotification(tenantId, type, payload) {
  const { data, error } = await getDb().from('calva_notifications').insert({
    tenant_id: tenantId, type, payload_json: payload
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getNotificationsByTenant(tenantId, limit = 50) {
  const { data, error } = await getDb().from('calva_notifications')
    .select('*').eq('tenant_id', tenantId).order('sent_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []).map(parseNotification);
}

// ============= VOICEMAIL QUERIES =============

async function createVoicemail(d) {
  const { data, error } = await getDb().from('calva_voicemails').insert({
    tenant_id: d.tenant_id, caller_phone: d.caller_phone,
    recording_url: d.recording_url, duration: d.duration || 0,
    transcription: d.transcription || null
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getVoicemailsByTenant(tenantId, limit = 50) {
  const { data, error } = await getDb().from('calva_voicemails')
    .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

// ============= ANALYTICS QUERIES =============

async function getCallAnalytics(tenantId, startTime, endTime) {
  // startTime/endTime may be unix epoch (number) or ISO string
  const start = typeof startTime === 'number' ? new Date(startTime * 1000).toISOString() : startTime;
  const end = typeof endTime === 'number' ? new Date(endTime * 1000).toISOString() : endTime;
  
  const { data, error } = await getDb().from('calva_calls')
    .select('duration_seconds, intent, transferred')
    .eq('tenant_id', tenantId)
    .gte('created_at', start)
    .lte('created_at', end);
  if (error) throw error;
  
  const rows = data || [];
  return {
    total_calls: rows.length,
    avg_duration: rows.length ? rows.reduce((s, r) => s + (r.duration_seconds || 0), 0) / rows.length : 0,
    calls_with_bookings: rows.filter(r => r.intent === 'booking').length,
    transferred_calls: rows.filter(r => r.transferred).length
  };
}

async function getCallsByHour(tenantId, startTime, endTime) {
  const start = typeof startTime === 'number' ? new Date(startTime * 1000).toISOString() : startTime;
  const end = typeof endTime === 'number' ? new Date(endTime * 1000).toISOString() : endTime;
  
  const { data, error } = await getDb().from('calva_calls')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', start)
    .lte('created_at', end);
  if (error) throw error;
  
  const hourMap = {};
  (data || []).forEach(r => {
    const h = new Date(r.created_at).getUTCHours().toString().padStart(2, '0');
    hourMap[h] = (hourMap[h] || 0) + 1;
  });
  return Object.entries(hourMap).map(([hour, count]) => ({ hour, count })).sort((a, b) => b.count - a.count);
}

async function getCallsByDay(tenantId, days = 7) {
  const start = new Date(Date.now() - days * 86400000).toISOString();
  
  const { data, error } = await getDb().from('calva_calls')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', start)
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  const dayMap = {};
  (data || []).forEach(r => {
    const d = r.created_at.split('T')[0];
    dayMap[d] = (dayMap[d] || 0) + 1;
  });
  return Object.entries(dayMap).map(([date, count]) => ({ date, count })).sort((a, b) => b.date.localeCompare(a.date));
}

// ============= USER QUERIES =============

async function createUser(email, passwordHash, tenantId) {
  const { data, error } = await getDb().from('calva_users').insert({
    email, password_hash: passwordHash, tenant_id: tenantId
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getUserByEmail(email) {
  const { data, error } = await getDb().from('calva_users').select('*').eq('email', email).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

async function getUserById(id) {
  const { data, error } = await getDb().from('calva_users').select('*').eq('id', id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

async function setVerificationToken(userId, token, expiresAt) {
  const expires = typeof expiresAt === 'number' ? new Date(expiresAt * 1000).toISOString() : expiresAt;
  const { error } = await getDb().from('calva_users').update({
    verification_token: token, verification_expires: expires
  }).eq('id', userId);
  if (error) throw error;
}

async function getUserByVerificationToken(token) {
  const { data, error } = await getDb().from('calva_users').select('*').eq('verification_token', token).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

async function markEmailVerified(userId) {
  const { error } = await getDb().from('calva_users').update({
    email_verified: true, verification_token: null, verification_expires: null
  }).eq('id', userId);
  if (error) throw error;
}

async function setResetToken(userId, token, expiresAt) {
  const expires = typeof expiresAt === 'number' ? new Date(expiresAt * 1000).toISOString() : expiresAt;
  const { error } = await getDb().from('calva_users').update({
    reset_token: token, reset_token_expires: expires
  }).eq('id', userId);
  if (error) throw error;
}

async function getUserByResetToken(token) {
  const { data, error } = await getDb().from('calva_users').select('*').eq('reset_token', token).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

async function clearResetToken(userId) {
  const { error } = await getDb().from('calva_users').update({
    reset_token: null, reset_token_expires: null
  }).eq('id', userId);
  if (error) throw error;
}

async function updateUserPassword(userId, passwordHash) {
  const { error } = await getDb().from('calva_users').update({
    password_hash: passwordHash
  }).eq('id', userId);
  if (error) throw error;
}

module.exports = {
  init, getDb, getSupabase, close,
  createTenant, getTenantById, getTenantByPhoneNumber, getTenantByApiKey, getAllTenants, updateTenant,
  createCall, updateCall, getCallBySid, getCallsByTenant,
  createBooking, getBookingsByTenant, updateBookingStatus,
  createNotification, getNotificationsByTenant,
  createVoicemail, getVoicemailsByTenant,
  getCallAnalytics, getCallsByHour, getCallsByDay,
  createUser, getUserByEmail, getUserById,
  setVerificationToken, getUserByVerificationToken, markEmailVerified,
  setResetToken, getUserByResetToken, clearResetToken, updateUserPassword,
};
