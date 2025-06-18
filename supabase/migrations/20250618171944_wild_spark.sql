/*
  # Fix User Identification and Admin Access

  1. Database Changes
    - Create a secure function to check admin status
    - Update RLS policies to allow proper admin access
    - Ensure user identification works correctly

  2. Security
    - Use security definer function to avoid recursion
    - Maintain proper access controls
    - Allow admin users to see all users for management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_during_signup" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;

-- Create a security definer function to check if current user is admin
-- This function runs with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION auth.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth.is_current_user_admin() TO authenticated;

-- Create new RLS policies using the security definer function

-- Allow users to read their own data OR admins to read all data
CREATE POLICY "users_select_own_or_admin" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    auth.is_current_user_admin()
  );

-- Allow users to update their own data OR admins to update any data
CREATE POLICY "users_update_own_or_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    auth.is_current_user_admin()
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    auth.is_current_user_admin()
  );

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_during_signup" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for registration
CREATE POLICY "users_insert_public" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow only admins to delete users
CREATE POLICY "users_delete_admin_only" ON users
  FOR DELETE
  TO authenticated
  USING (auth.is_current_user_admin());

-- Ensure the admin index exists for performance
CREATE INDEX IF NOT EXISTS users_role_admin_idx ON users (id) WHERE role = 'admin';