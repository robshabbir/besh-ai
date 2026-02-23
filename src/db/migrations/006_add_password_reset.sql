-- Add password reset columns to users table
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires INTEGER;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
