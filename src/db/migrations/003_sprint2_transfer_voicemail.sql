-- Migration 003: Sprint 2 Features (Human Handoff + Voicemail)
-- Add transfer tracking columns to calls table
-- Add voicemails table

-- Add transfer columns to calls table
ALTER TABLE calls ADD COLUMN transferred INTEGER DEFAULT 0;

ALTER TABLE calls ADD COLUMN transfer_to TEXT;

-- Create voicemails table
CREATE TABLE IF NOT EXISTS voicemails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  caller_phone TEXT NOT NULL,
  recording_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  transcription TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_voicemails_tenant ON voicemails(tenant_id);

CREATE INDEX IF NOT EXISTS idx_voicemails_created ON voicemails(created_at DESC);
