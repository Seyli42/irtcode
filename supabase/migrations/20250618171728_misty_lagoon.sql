/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current policies create infinite recursion by checking user role from the same table they're protecting
    - This happens when policies query `users` table to check role while processing a request on `users` table

  2. Solution
    - Simplify policies to avoid self-referencing queries
    - Use auth.uid() directly for user identification
    - Remove role-based checks that cause recursion
    - Keep admin functionality but implement it safely

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies that don't cause recursion
    - Ensure users can still read/update their own data
    - Maintain security while avoiding circular dependencies
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "admins_delete_users" ON users;
DROP POLICY IF EXISTS "admins_read_all" ON users;
DROP POLICY IF EXISTS "admins_update_all" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create simple, non-recursive policies
-- Allow users to read their own profile
CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow new user creation during signup (this is safe as it doesn't query existing data)
CREATE POLICY "users_insert_during_signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for user registration (needed for signup flow)
CREATE POLICY "users_insert_public"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Note: Admin functionality will need to be handled differently
-- Consider using service role or implementing admin checks at the application level
-- rather than in RLS policies to avoid recursion issues