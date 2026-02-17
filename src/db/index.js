const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/calva.db');

let db = null;

/**
 * Initialize database connection
 */
function init() {
  if (db) return db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Get database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

// ============= TENANT QUERIES =============

function createTenant(name, industry, phoneNumber, configJson, apiKey) {
  const stmt = getDb().prepare(`
    INSERT INTO tenants (name, industry, phone_number, config_json, api_key)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, industry, phoneNumber, JSON.stringify(configJson), apiKey);
  return result.lastInsertRowid;
}

function getTenantById(id) {
  const stmt = getDb().prepare('SELECT * FROM tenants WHERE id = ?');
  const tenant = stmt.get(id);
  if (tenant && tenant.config_json) {
    tenant.config = JSON.parse(tenant.config_json);
  }
  return tenant;
}

function getTenantByPhoneNumber(phoneNumber) {
  // Normalize: Twilio POST encodes + as space in form data
  const normalized = phoneNumber ? phoneNumber.trim().replace(/^\s/, '+') : phoneNumber;
  const stmt = getDb().prepare('SELECT * FROM tenants WHERE phone_number = ? AND active = 1');
  const tenant = stmt.get(normalized) || stmt.get(phoneNumber);
  if (tenant && tenant.config_json) {
    tenant.config = JSON.parse(tenant.config_json);
  }
  return tenant;
}

function getTenantByApiKey(apiKey) {
  const stmt = getDb().prepare('SELECT * FROM tenants WHERE api_key = ? AND active = 1');
  const tenant = stmt.get(apiKey);
  if (tenant && tenant.config_json) {
    tenant.config = JSON.parse(tenant.config_json);
  }
  return tenant;
}

function getAllTenants() {
  const stmt = getDb().prepare('SELECT * FROM tenants ORDER BY created_at DESC');
  const tenants = stmt.all();
  return tenants.map(t => {
    if (t.config_json) t.config = JSON.parse(t.config_json);
    return t;
  });
}

function updateTenant(id, updates) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.phone_number !== undefined) {
    fields.push('phone_number = ?');
    values.push(updates.phone_number);
  }
  if (updates.config_json !== undefined) {
    fields.push('config_json = ?');
    values.push(JSON.stringify(updates.config_json));
  }
  if (updates.active !== undefined) {
    fields.push('active = ?');
    values.push(updates.active ? 1 : 0);
  }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  const stmt = getDb().prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// ============= CALL QUERIES =============

function createCall(tenantId, callSid, callerPhone) {
  const stmt = getDb().prepare(`
    INSERT INTO calls (tenant_id, call_sid, caller_phone)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(tenantId, callSid, callerPhone);
  return result.lastInsertRowid;
}

function updateCall(callSid, updates) {
  const fields = [];
  const values = [];
  
  if (updates.transcript !== undefined) {
    fields.push('transcript_json = ?');
    values.push(JSON.stringify(updates.transcript));
  }
  if (updates.intent !== undefined) {
    fields.push('intent = ?');
    values.push(updates.intent);
  }
  if (updates.collected_data !== undefined) {
    fields.push('collected_data_json = ?');
    values.push(JSON.stringify(updates.collected_data));
  }
  if (updates.duration_seconds !== undefined) {
    fields.push('duration_seconds = ?');
    values.push(updates.duration_seconds);
  }
  if (updates.recording_url !== undefined) {
    fields.push('recording_url = ?');
    values.push(updates.recording_url);
  }
  if (updates.recording_duration !== undefined) {
    fields.push('recording_duration = ?');
    values.push(updates.recording_duration);
  }
  if (updates.language !== undefined) {
    fields.push('language = ?');
    values.push(updates.language);
  }
  if (updates.transferred !== undefined) {
    fields.push('transferred = ?');
    values.push(updates.transferred);
  }
  if (updates.transfer_to !== undefined) {
    fields.push('transfer_to = ?');
    values.push(updates.transfer_to);
  }
  
  if (fields.length === 0) return false;
  
  values.push(callSid);
  const stmt = getDb().prepare(`UPDATE calls SET ${fields.join(', ')} WHERE call_sid = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

function getCallBySid(callSid) {
  const stmt = getDb().prepare('SELECT * FROM calls WHERE call_sid = ?');
  const call = stmt.get(callSid);
  if (call) {
    if (call.transcript_json) call.transcript = JSON.parse(call.transcript_json);
    if (call.collected_data_json) call.collected_data = JSON.parse(call.collected_data_json);
  }
  return call;
}

function getCallsByTenant(tenantId, limit = 50) {
  const stmt = getDb().prepare(`
    SELECT * FROM calls 
    WHERE tenant_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  const calls = stmt.all(tenantId, limit);
  return calls.map(c => {
    if (c.transcript_json) c.transcript = JSON.parse(c.transcript_json);
    if (c.collected_data_json) c.collected_data = JSON.parse(c.collected_data_json);
    return c;
  });
}

// ============= BOOKING QUERIES =============

function createBooking(data) {
  const stmt = getDb().prepare(`
    INSERT INTO bookings (
      tenant_id, call_id, customer_name, customer_phone, customer_email,
      service, preferred_time, address, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.tenant_id,
    data.call_id || null,
    data.customer_name,
    data.customer_phone,
    data.customer_email || null,
    data.service,
    data.preferred_time || null,
    data.address || null,
    data.notes || null,
    data.status || 'pending'
  );
  return result.lastInsertRowid;
}

function getBookingsByTenant(tenantId, limit = 50) {
  const stmt = getDb().prepare(`
    SELECT * FROM bookings 
    WHERE tenant_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(tenantId, limit);
}

function updateBookingStatus(id, status) {
  const stmt = getDb().prepare('UPDATE bookings SET status = ? WHERE id = ?');
  const result = stmt.run(status, id);
  return result.changes > 0;
}

// ============= NOTIFICATION QUERIES =============

function createNotification(tenantId, type, payload) {
  const stmt = getDb().prepare(`
    INSERT INTO notifications (tenant_id, type, payload_json)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(tenantId, type, JSON.stringify(payload));
  return result.lastInsertRowid;
}

function getNotificationsByTenant(tenantId, limit = 50) {
  const stmt = getDb().prepare(`
    SELECT * FROM notifications 
    WHERE tenant_id = ? 
    ORDER BY sent_at DESC 
    LIMIT ?
  `);
  const notifications = stmt.all(tenantId, limit);
  return notifications.map(n => {
    if (n.payload_json) n.payload = JSON.parse(n.payload_json);
    return n;
  });
}

// ============= VOICEMAIL QUERIES =============

function createVoicemail(data) {
  const stmt = getDb().prepare(`
    INSERT INTO voicemails (
      tenant_id, caller_phone, recording_url, duration, transcription
    ) VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.tenant_id,
    data.caller_phone,
    data.recording_url,
    data.duration || 0,
    data.transcription || null
  );
  return result.lastInsertRowid;
}

function getVoicemailsByTenant(tenantId, limit = 50) {
  const stmt = getDb().prepare(`
    SELECT * FROM voicemails 
    WHERE tenant_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(tenantId, limit);
}

// ============= ANALYTICS QUERIES =============

function getCallAnalytics(tenantId, startTime, endTime) {
  const stmt = getDb().prepare(`
    SELECT 
      COUNT(*) as total_calls,
      AVG(duration_seconds) as avg_duration,
      SUM(CASE WHEN intent = 'booking' THEN 1 ELSE 0 END) as calls_with_bookings,
      COUNT(CASE WHEN transferred = 1 THEN 1 END) as transferred_calls
    FROM calls
    WHERE tenant_id = ? AND created_at >= ? AND created_at <= ?
  `);
  return stmt.get(tenantId, startTime, endTime);
}

function getCallsByHour(tenantId, startTime, endTime) {
  const stmt = getDb().prepare(`
    SELECT 
      strftime('%H', datetime(created_at, 'unixepoch')) as hour,
      COUNT(*) as count
    FROM calls
    WHERE tenant_id = ? AND created_at >= ? AND created_at <= ?
    GROUP BY hour
    ORDER BY count DESC
  `);
  return stmt.all(tenantId, startTime, endTime);
}

function getCallsByDay(tenantId, days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - (days * 24 * 60 * 60);
  
  const stmt = getDb().prepare(`
    SELECT 
      DATE(datetime(created_at, 'unixepoch')) as date,
      COUNT(*) as count
    FROM calls
    WHERE tenant_id = ? AND created_at >= ?
    GROUP BY date
    ORDER BY date DESC
  `);
  return stmt.all(tenantId, startTime);
}

// ============= USER QUERIES =============

function createUser(email, passwordHash, tenantId) {
  const stmt = getDb().prepare(`
    INSERT INTO users (email, password_hash, tenant_id)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(email, passwordHash, tenantId);
  return result.lastInsertRowid;
}

function getUserByEmail(email) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

function getUserById(id) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

module.exports = {
  init,
  getDb,
  close,
  // Tenants
  createTenant,
  getTenantById,
  getTenantByPhoneNumber,
  getTenantByApiKey,
  getAllTenants,
  updateTenant,
  // Calls
  createCall,
  updateCall,
  getCallBySid,
  getCallsByTenant,
  // Bookings
  createBooking,
  getBookingsByTenant,
  updateBookingStatus,
  // Notifications
  createNotification,
  getNotificationsByTenant,
  // Voicemails
  createVoicemail,
  getVoicemailsByTenant,
  // Analytics
  getCallAnalytics,
  getCallsByHour,
  getCallsByDay,
  // Users
  createUser,
  getUserByEmail,
  getUserById,
};
