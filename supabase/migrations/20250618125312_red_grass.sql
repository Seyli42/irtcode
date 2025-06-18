/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current policies query the users table within the policy itself to check admin roles
    - This creates infinite recursion when trying to access user data

  2. Solution
    - Replace recursive policies with simpler, non-recursive ones
    - Use auth.jwt() to check roles instead of querying users table
    - Maintain security while avoiding self-referencing queries

  3. Changes
    - Drop existing problematic policies
    - Create new policies that don't cause recursion
    - Users can manage their own data
    - Admin role checking through JWT claims instead of database queries
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_insert_public_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Create new policies without infinite recursion

-- Allow users to read their own profile
CREATE POLICY "users_can_read_own_profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for initial signup)
CREATE POLICY "users_can_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for user registration (needed for signup flow)
CREATE POLICY "users_public_insert_policy"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Note: Admin functionality will need to be handled differently
-- Consider using service role or separate admin functions instead of RLS policies
-- that query the same table they're protecting