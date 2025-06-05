/*
  # Fix users table ID handling

  1. Changes
    - Drop and recreate users table with proper UUID handling
    - Update policies to ensure proper access control
    - Add trigger for updated_at timestamp

  2. Security
    - Enable RLS
    - Add policies for public read and admin management
*/

-- Drop existing table and recreate with proper UUID handling
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id uuid DEFAULT auth.uid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'auto-entrepreneur', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
ON users
FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Allow user creation"
ON users
FOR INSERT
TO PUBLIC
WITH CHECK (true);

CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'admin')
WITH CHECK ((auth.jwt() ->> 'role')::text = 'admin');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();