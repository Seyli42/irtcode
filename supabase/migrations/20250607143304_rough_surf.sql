/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Multiple overlapping policies causing infinite recursion
    - Policies querying the users table itself create circular dependencies

  2. Solution
    - Drop ALL existing policies safely
    - Create clean, non-recursive policies using auth.uid() and JWT claims
    - Separate user self-access from admin access

  3. Security
    - Users can only access their own data
    - Admins can access all data via JWT role claim
    - Public can insert during registration
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

-- Create clean, non-recursive policies

-- Allow users to read their own data
CREATE POLICY "user_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "user_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own data during registration
CREATE POLICY "user_insert_own"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for user registration (needed for sign up)
CREATE POLICY "public_insert_registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin policies using JWT claims (no table queries to avoid recursion)
CREATE POLICY "admin_select_all"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() = id
  );

CREATE POLICY "admin_update_all"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() = id
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() = id
  );

CREATE POLICY "admin_delete_users"
  ON users
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');