/*
  # Fix Users Table RLS Policies

  1. Security Changes
    - Enable RLS on users table
    - Add policy for users to insert their own data
    - Update select policy to use maybeSingle() compatible conditions
    - Add policy for users to update their own data
    - Add policy for users to delete their own data

  Note: These policies ensure users can only access and modify their own data
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can delete own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own data
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for users to delete their own data
CREATE POLICY "Users can delete own data"
ON users
FOR DELETE
TO authenticated
USING (auth.uid() = id);