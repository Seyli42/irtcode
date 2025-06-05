/*
  # Fix users table RLS policies

  1. Changes
    - Drop all existing policies
    - Create new simplified policies that allow:
      - Admin users to read all users
      - Regular users to read their own data
    - Add public read access for initial setup
  
  2. Security
    - Enable RLS
    - Add policies for proper access control
    - Allow public read access temporarily
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for admin users" ON users;
DROP POLICY IF EXISTS "Enable insert for admin users" ON users;
DROP POLICY IF EXISTS "Enable update for admin users" ON users;
DROP POLICY IF EXISTS "Enable delete for admin users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows public read access
CREATE POLICY "Allow public read access"
ON users
FOR SELECT
TO PUBLIC
USING (true);

-- Create a policy that allows authenticated users to manage their own data
CREATE POLICY "Users can manage own data"
ON users
FOR ALL
TO authenticated
USING (
  auth.uid() = id
  OR (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  auth.uid() = id
  OR (auth.jwt() ->> 'role')::text = 'admin'
);