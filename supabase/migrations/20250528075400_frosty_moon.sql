-- Delete demo users from auth.users
DELETE FROM auth.users
WHERE email IN ('admin@example.com', 'entrepreneur@example.com', 'employee@example.com');

-- Delete demo users from public.users
DELETE FROM public.users
WHERE email IN ('admin@example.com', 'entrepreneur@example.com', 'employee@example.com');

-- Verify admin account exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'bouir.ilyes@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Admin account not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'bouir.ilyes@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Admin account not found in public.users';
  END IF;
END $$;