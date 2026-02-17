-- Add call recording columns
ALTER TABLE calls ADD COLUMN recording_url TEXT;
ALTER TABLE calls ADD COLUMN recording_duration INTEGER;
