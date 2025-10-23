-- Migration: Remove CASCADE from images.photo_id foreign key
-- This allows generated images to persist even when the original uploaded photo is deleted
-- Run this on your Neon database

-- Drop the existing foreign key constraint
ALTER TABLE images
DROP CONSTRAINT IF EXISTS images_photo_id_fkey;

-- Add the new foreign key constraint with SET NULL instead of CASCADE
ALTER TABLE images
ADD CONSTRAINT images_photo_id_fkey
FOREIGN KEY (photo_id)
REFERENCES photos(id)
ON DELETE SET NULL;

-- Verify the change
-- You can check the constraint with:
-- SELECT conname, confdeltype FROM pg_constraint WHERE conname = 'images_photo_id_fkey';
-- 'a' = SET NULL, 'c' = CASCADE
