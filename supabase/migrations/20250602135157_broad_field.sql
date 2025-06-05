-- Update user metadata to set admin role
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'bouir.ilyes@gmail.com';

-- Verify the update was successful
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = 'bouir.ilyes@gmail.com' 
    AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Failed to update user role to admin';
  END IF;
END $$;