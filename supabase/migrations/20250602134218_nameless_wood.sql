-- Function to safely insert users if they don't exist
CREATE OR REPLACE FUNCTION insert_user_if_not_exists(
  p_email text,
  p_password text,
  p_name text,
  p_role text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) THEN
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
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', p_name, 'role', p_role),
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
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert users safely
SELECT insert_user_if_not_exists(
  'admin@irt.fr',
  'Admin123!',
  'Administrateur IRT',
  'admin'
);

SELECT insert_user_if_not_exists(
  'entrepreneur@irt.fr',
  'Entrepreneur123!',
  'Auto-Entrepreneur IRT',
  'auto-entrepreneur'
);

SELECT insert_user_if_not_exists(
  'employee@irt.fr',
  'Employee123!',
  'Employé IRT',
  'employee'
);

-- Clean up the function
DROP FUNCTION IF EXISTS insert_user_if_not_exists;