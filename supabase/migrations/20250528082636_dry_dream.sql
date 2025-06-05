/*
  # Add unique constraint for id and email

  1. Changes
    - Add a unique constraint on the users table combining id and email columns
    - This enables the ON CONFLICT clause to work correctly in upsert operations

  2. Security
    - No changes to RLS policies
    - Maintains existing table security settings
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'users_id_email_unique'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_id_email_unique 
    UNIQUE (id, email);
  END IF;
END $$;