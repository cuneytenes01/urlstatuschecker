/*
  # Add Screenshot Data Column

  1. Changes
    - Add `screenshot_data` column to `url_alerts` table to store base64 encoded screenshot data
    - This allows us to store screenshots directly in the database instead of relying on external APIs

  2. Notes
    - Column is nullable for backward compatibility
    - Text type can store large base64 strings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'url_alerts' AND column_name = 'screenshot_data'
  ) THEN
    ALTER TABLE url_alerts ADD COLUMN screenshot_data text;
  END IF;
END $$;
