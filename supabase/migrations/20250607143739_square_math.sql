/*
  # Fix Admin Policies for User Management

  1. Problem
    - Current policies rely on JWT claims that don't contain the user role
    - This prevents admins from seeing all users in the management interface

  2. Solution
    - Use direct database queries instead of JWT claims for admin checks
    - Implement proper recursion prevention
    - Ensure admins can view and manage all users

  3. Security
    - Maintain RLS protection
    - Users can only see their own data unless they're admin
    - Admins can manage all users
*/

-- First, get a clean slate by dropping ALL policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on users table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
END $$;

-- Create a function to check if current user is admin (prevents recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Allow public insert for user registration (needed for sign up)
CREATE POLICY "public_insert_registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to insert their own data during registration
CREATE POLICY "user_insert_own"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own data OR if they're admin, read all
CREATE POLICY "user_select_own_or_admin_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR is_admin()
  );

-- Allow users to update their own data OR if they're admin, update all
CREATE POLICY "user_update_own_or_admin_all"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR is_admin()
  );

-- Allow only admins to delete users
CREATE POLICY "admin_delete_users"
  ON users
  FOR DELETE
  TO authenticated
  USING (is_admin());