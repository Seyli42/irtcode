/*
  # Fix user identification and admin access

  1. Security
    - Create a security definer function in public schema to check admin status
    - Update RLS policies to allow admin access without recursion
    - Maintain data security while enabling proper user identification

  2. Changes
    - Drop existing problematic policies
    - Create admin check function in public schema (not auth schema)
    - Add new policies that work with the admin check function
    - Ensure proper permissions and indexing
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_during_signup" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;

-- Create a security definer function in public schema to check if current user is admin
-- This function runs with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
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
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon;

-- Create new RLS policies using the security definer function

-- Allow users to read their own data OR admins to read all data
CREATE POLICY "users_select_own_or_admin" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    public.is_current_user_admin()
  );

-- Allow users to update their own data OR admins to update any data
CREATE POLICY "users_update_own_or_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    public.is_current_user_admin()
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    public.is_current_user_admin()
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
  USING (public.is_current_user_admin());

-- Ensure the admin index exists for performance
CREATE INDEX IF NOT EXISTS users_role_admin_idx ON users (id) WHERE role = 'admin';