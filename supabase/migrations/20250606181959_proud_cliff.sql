/*
  # User Self-Insert Policy

  1. Security
    - Allow authenticated users to insert their own profile only
    - Ensures users can only create entries with their own auth.uid()
*/

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);