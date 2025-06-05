/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing policies
    - Create new policies using correct JWT claim syntax
    - Add policies for admin access and user self-access
  
  2. Security
    - Admins can perform all operations
    - Users can only read their own data
    - Uses role from auth.jwt() claims
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policies using correct JWT claim syntax
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
  OR auth.uid() = id
);

CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);