/*
  # Fix users table structure and policies

  1. Changes
    - Ensure proper ID generation with UUID
    - Add proper constraints and defaults
    - Update policies for proper access control
  
  2. Security
    - Enable RLS
    - Add policies for public read and creation
    - Add admin management policy
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Recreate the users table with proper constraints
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'auto-entrepreneur', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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