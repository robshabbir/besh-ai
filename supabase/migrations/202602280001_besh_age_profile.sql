-- Add age-aware profile fields to besh_users
ALTER TABLE besh_users 
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS age_group TEXT DEFAULT 'young_adult',
ADD COLUMN IF NOT EXISTS comm_style TEXT DEFAULT 'normal';

-- Set default values for existing users
UPDATE besh_users SET age_group = 'young_adult' WHERE age_group IS NULL;
UPDATE besh_users SET comm_style = 'normal' WHERE comm_style IS NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_besh_users_age_group ON besh_users(age_group);
CREATE INDEX IF NOT EXISTS idx_besh_users_comm_style ON besh_users(comm_style);
