/*
  # Fix user profile insertion policy

  This migration ensures users can insert their own profile in the users table.
  It handles the case where the policy might already exist.

  1. Security
    - Drop existing policy if it exists (to avoid conflicts)
    - Create new policy allowing users to insert only their own profile
    - Policy uses auth.uid() = id to ensure users can only insert their own data
*/

-- Drop the policy if it already exists to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);