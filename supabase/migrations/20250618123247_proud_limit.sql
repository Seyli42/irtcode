/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies are referencing the users table within themselves, creating circular dependencies
    - This prevents user profile fetching and causes authentication failures

  2. Solution
    - Drop all existing problematic policies
    - Create new, simplified policies that don't cause recursion
    - Use auth.uid() directly instead of subqueries to users table
    - Separate policies for different operations to avoid conflicts

  3. New Policies
    - Users can read their own profile using auth.uid() = id
    - Users can update their own profile using auth.uid() = id  
    - Users can insert their own profile using auth.uid() = id
    - Service role can perform all operations (for system operations)
    - Public can insert during registration (for initial user creation)
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can delete all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;
DROP POLICY IF EXISTS "public_insert_registration" ON users;
DROP POLICY IF EXISTS "user_insert_own" ON users;
DROP POLICY IF EXISTS "user_select_own_or_admin_all" ON users;
DROP POLICY IF EXISTS "user_update_own_or_admin_all" ON users;

-- Create new, non-recursive policies
-- Allow users to read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for auth sync)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for registration process
CREATE POLICY "users_insert_registration" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow service role full access (for system operations)
CREATE POLICY "service_role_all_access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a simple function to check if user is admin (without recursion)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role' = 'admin' 
     FROM auth.users 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Admin policies using the non-recursive function
CREATE POLICY "admin_select_all" ON users
  FOR SELECT
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "admin_update_all" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_delete_all" ON users
  FOR DELETE
  TO authenticated
  USING (auth.is_admin());