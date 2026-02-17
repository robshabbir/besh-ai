-- Add language column to calls table to track detected language
ALTER TABLE calls ADD COLUMN language TEXT DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_calls_language ON calls(language);
