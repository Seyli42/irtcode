/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing RLS policies
    - Add new policies for:
      - Selecting own user data
      - Inserting new user data during signup
      - Updating own user data
      - Deleting own user data
  
  2. Security
    - Enable RLS on users table
    - Add policies to ensure users can only:
      - Read their own data
      - Insert their own data during signup
      - Update their own data
      - Delete their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
CREATE POLICY "Enable read access to own user data"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Enable insert access for new users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Enable update access to own user data"
ON users FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Enable delete access to own user data"
ON users FOR DELETE
TO authenticated
USING (
  auth.uid() = id
);