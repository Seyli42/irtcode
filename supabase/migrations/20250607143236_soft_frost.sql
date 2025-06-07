/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Multiple overlapping RLS policies on users table
    - Some policies query the users table itself, causing infinite recursion
    - Policies like checking user role from users table create circular dependencies

  2. Solution
    - Drop all existing problematic policies
    - Create clean, non-recursive policies
    - Use auth.uid() and JWT claims instead of querying users table
    - Separate admin access from regular user access

  3. New Policies
    - Users can read their own data (using auth.uid())
    - Users can update their own data (using auth.uid())
    - Admins can do everything (using JWT role claim)
    - Public can insert during registration
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can do everything" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Allow user insert own row" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create clean, non-recursive policies

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own data during registration
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public insert for user registration (needed for sign up)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin policies using JWT claims (no table queries)
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() = id
  );

CREATE POLICY "Admins can update all users"
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

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');