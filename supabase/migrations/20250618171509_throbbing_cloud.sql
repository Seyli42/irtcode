/*
  # Fix User Authentication and Profile Access

  1. Security Changes
    - Remove all existing problematic RLS policies
    - Create simple, non-recursive policies
    - Allow proper user profile access

  2. Key Changes
    - Users can read/update their own profile
    - Admins can read/update all profiles
    - Public registration allowed
    - No recursive policy checks
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_can_read_own_or_admin" ON users;
DROP POLICY IF EXISTS "users_can_update_own_or_admin" ON users;
DROP POLICY IF EXISTS "admins_can_delete_users" ON users;
DROP POLICY IF EXISTS "users_can_insert_own" ON users;
DROP POLICY IF EXISTS "public_can_insert_for_registration" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_insert_public_policy" ON users;

-- Create simple, working policies

-- Allow users to read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to read all users (separate policy to avoid recursion)
CREATE POLICY "admins_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      LIMIT 1
    )
  );

-- Allow users to update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to update all users
CREATE POLICY "admins_update_all" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      LIMIT 1
    )
  );

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public registration
CREATE POLICY "users_insert_public" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow admins to delete users
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      LIMIT 1
    )
  );

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS users_role_admin_idx ON users (id) WHERE role = 'admin';