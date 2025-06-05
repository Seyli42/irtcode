/*
  # Fix user roles and policies

  1. Changes
    - Drop existing policies
    - Create new policies for admin access
    - Update roles for specific users
    - Add safety checks for updates
  
  2. Security
    - Ensure admin users have proper access
    - Maintain user data protection
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policies using role field
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
  OR auth.uid() = id
);

CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- First ensure the users exist before updating
DO $$
BEGIN
  -- Insert users if they don't exist (this is safe due to the email UNIQUE constraint)
  INSERT INTO users (id, email, name, role)
  VALUES 
    (gen_random_uuid(), 'seyli.design@gmail.com', 'Seyli Design', 'admin'),
    (gen_random_uuid(), 'bouir.ilyes@gmail.com', 'Ilyes Bouir', 'admin')
  ON CONFLICT (email) DO NOTHING;
  
  -- Now update the roles
  UPDATE users
  SET role = 'admin'
  WHERE email IN ('seyli.design@gmail.com', 'bouir.ilyes@gmail.com');

  UPDATE users
  SET role = 'auto-entrepreneur'
  WHERE email LIKE '%@baarakafinance%';
END $$;