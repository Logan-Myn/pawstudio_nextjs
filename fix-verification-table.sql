-- Fix verification_tokens table to match Better-Auth schema
-- Better-Auth expects a 'value' column but migration guide had 'token' instead

-- Add the 'value' column (this is what Better-Auth expects)
ALTER TABLE verification_tokens ADD COLUMN IF NOT EXISTS value TEXT;

-- If you have a 'token' column from old schema, copy data and drop it
DO $$
BEGIN
    -- Check if 'token' column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'verification_tokens'
        AND column_name = 'token'
    ) THEN
        -- Copy data from 'token' to 'value' if 'value' is empty
        UPDATE verification_tokens
        SET value = token
        WHERE value IS NULL AND token IS NOT NULL;

        -- Drop the old 'token' column
        ALTER TABLE verification_tokens DROP COLUMN token;
    END IF;
END $$;

-- Ensure 'value' is NOT NULL (after data migration)
ALTER TABLE verification_tokens ALTER COLUMN value SET NOT NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'verification_tokens'
ORDER BY ordinal_position;
