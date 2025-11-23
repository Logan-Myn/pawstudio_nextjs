-- Migration: Add trial_mode column to users table
-- Date: 2025-01-23
-- Description: Adds trial_mode boolean field to support onboarding trial flow

-- Add trial_mode column with default value
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_mode BOOLEAN DEFAULT TRUE NOT NULL;

-- Update default credits from 3 to 0
ALTER TABLE users
ALTER COLUMN credits SET DEFAULT 0;

-- For existing users: set trial_mode to false (they already have credits)
-- For new users: they'll get trial_mode = true and 0 credits by default
UPDATE users
SET trial_mode = false
WHERE credits > 0 OR created_at < NOW();

-- Note: New users will automatically get:
-- - credits = 0
-- - trial_mode = true
-- This is handled by the schema.sql default values
