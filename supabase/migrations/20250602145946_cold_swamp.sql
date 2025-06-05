/*
  # Fix Users Table RLS Policies

  1. Changes
    - Remove existing problematic RLS policies that cause recursion
    - Create new policies using JWT claims for role-based access
    - Maintain security while avoiding self-referential queries
  
  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Admins can perform all operations
      - Users can read their own data
      - Users can update their own data
*/

-- First, disable then re-enable RLS to ensure a clean slate
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Create new policies using JWT claims
CREATE POLICY "Admins can do everything" ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Users can read own data" ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can update own data" ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);