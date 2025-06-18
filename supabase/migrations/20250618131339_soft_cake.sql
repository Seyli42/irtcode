/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table contain recursive queries
    - Policies check user role by querying the users table itself
    - This creates infinite recursion when fetching user profiles

  2. Solution
    - Remove all existing policies that cause recursion
    - Create simple, non-recursive policies
    - Use auth.uid() directly without subqueries to users table
    - Implement role-based access through JWT claims or simpler logic

  3. New Policies
    - Users can read their own profile (auth.uid() = id)
    - Users can update their own profile (auth.uid() = id)
    - Public insert policy for user registration
    - Remove admin-specific policies that cause recursion
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_insert_public_policy" ON users;

-- Create simple, non-recursive policies
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

-- Allow authenticated users to insert their own profile during registration
CREATE POLICY "users_can_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for user registration (needed for sign up process)
CREATE POLICY "users_public_insert_policy"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Note: Admin functionality will need to be handled differently
-- Consider using service role key for admin operations or
-- implementing admin checks in application logic rather than RLS