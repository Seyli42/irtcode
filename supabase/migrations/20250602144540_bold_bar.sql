/*
  # Fix User Management RLS Policies

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new simplified policies for:
      - Admin access to all users
      - User access to own data
      - Admin user management (insert/delete)
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Use direct role checks from auth.jwt()
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create new simplified policies
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Add policy for admins to update users
CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);