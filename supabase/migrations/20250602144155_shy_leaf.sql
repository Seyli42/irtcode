/*
  # Fix users table RLS policies

  1. Changes
    - Remove existing policies that cause recursion
    - Add new, simplified policies for the users table that prevent infinite recursion
    
  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Admins can read all users
      - Users can read their own data
      - Admins can insert users
      - Admins can delete users
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policies without recursive checks
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
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
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);