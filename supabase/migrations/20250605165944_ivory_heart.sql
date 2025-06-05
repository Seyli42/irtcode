/*
  # Fix user management policies

  1. Changes
    - Drop existing policies
    - Add public read access
    - Add policy for user creation
    - Add policy for user management
    
  2. Security
    - Enable RLS
    - Allow public read access
    - Allow authenticated users to create accounts
    - Allow admins to manage all users
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Users can manage own data" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows public read access
CREATE POLICY "Allow public read access"
ON users
FOR SELECT
TO PUBLIC
USING (true);

-- Create a policy that allows user creation
CREATE POLICY "Allow user creation"
ON users
FOR INSERT
TO PUBLIC
WITH CHECK (true);

-- Create a policy that allows admins to manage all users
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'admin')
WITH CHECK ((auth.jwt() ->> 'role')::text = 'admin');