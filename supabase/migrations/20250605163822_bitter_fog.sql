/*
  # Fix users table and policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Add proper role-based policies for admin access
    - Fix policy conditions to use proper role checking
    - Add policy for public role selection

  2. Security
    - Enable RLS on users table
    - Add policies for admin and user access
    - Ensure proper role-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can do everything" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create new policies with proper role checking
CREATE POLICY "Enable read access for admin users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = id
);

CREATE POLICY "Enable insert for admin users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = id
);

CREATE POLICY "Enable update for admin users"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = id
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
  OR auth.uid() = id
);

CREATE POLICY "Enable delete for admin users"
ON users
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;