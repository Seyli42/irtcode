-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'auto-entrepreneur', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@irt.fr',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrateur IRT","role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  false,
  'authenticated'
);

-- Create auto-entrepreneur user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'entrepreneur@irt.fr',
  crypt('Entrepreneur123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Auto-Entrepreneur IRT","role":"auto-entrepreneur"}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  false,
  'authenticated'
);

-- Create employee user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'employee@irt.fr',
  crypt('Employee123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Employé IRT","role":"employee"}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  false,
  'authenticated'
);

-- Insert corresponding entries in public.users
INSERT INTO public.users (id, email, name, role)
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'admin@irt.fr' THEN 'Administrateur IRT'
    WHEN email = 'entrepreneur@irt.fr' THEN 'Auto-Entrepreneur IRT'
    ELSE 'Employé IRT'
  END as name,
  CASE 
    WHEN email = 'admin@irt.fr' THEN 'admin'
    WHEN email = 'entrepreneur@irt.fr' THEN 'auto-entrepreneur'
    ELSE 'employee'
  END as role
FROM auth.users
WHERE email IN ('admin@irt.fr', 'entrepreneur@irt.fr', 'employee@irt.fr');