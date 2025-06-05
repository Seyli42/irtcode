/*
  # Update user role to auto-entrepreneur

  1. Changes
    - Update role for baarakafinance@gmail.com to auto-entrepreneur
    - Update metadata in auth.users
    - Update role in public.users
    
  2. Security
    - No changes to RLS policies
    - Maintains existing security settings
*/

-- First, verify the user exists in auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = 'baarakafinance@gmail.com'
  ) THEN
    -- Create the user if they don't exist
    INSERT INTO auth.users (
      email,
      raw_user_meta_data,
      created_at,
      updated_at,
      role
    ) VALUES (
      'baarakafinance@gmail.com',
      '{"role": "auto-entrepreneur"}'::jsonb,
      now(),
      now(),
      'authenticated'
    );
  ELSE
    -- Update existing user's metadata
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "auto-entrepreneur"}'::jsonb
    WHERE email = 'baarakafinance@gmail.com';
  END IF;
END $$;

-- Then, handle the public.users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE email = 'baarakafinance@gmail.com'
  ) THEN
    -- Create the user if they don't exist
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      created_at,
      updated_at
    ) 
    SELECT 
      id,
      email,
      'Baaraka Finance',
      'auto-entrepreneur',
      now(),
      now()
    FROM auth.users
    WHERE email = 'baarakafinance@gmail.com';
  ELSE
    -- Update existing user's role
    UPDATE public.users
    SET 
      role = 'auto-entrepreneur',
      updated_at = now()
    WHERE email = 'baarakafinance@gmail.com';
  END IF;
END $$;