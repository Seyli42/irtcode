/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table contain subqueries that reference the same users table
    - This creates infinite recursion when Supabase tries to evaluate the policies
    - Error: "infinite recursion detected in policy for relation users"

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid recursive subqueries
    - Use auth.jwt() to check user role from JWT claims instead of database queries
    - Maintain same security model but without recursion

  3. Security Changes
    - Users can read their own profile: auth.uid() = id
    - Users can update their own profile: auth.uid() = id  
    - Admins can read/update/delete any user: check role from JWT claims
    - Public can insert during registration: allow public inserts
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_insert_public_policy" ON users;

-- Create new non-recursive policies

-- Allow users to read their own profile OR if they are admin (from JWT)
CREATE POLICY "users_can_read_own_or_admin" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Allow users to update their own profile OR if they are admin (from JWT)
CREATE POLICY "users_can_update_own_or_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Allow only admins to delete users (from JWT)
CREATE POLICY "admins_can_delete_users" ON users
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_can_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public inserts for registration
CREATE POLICY "public_can_insert_for_registration" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);