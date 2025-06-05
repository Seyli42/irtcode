/*
  # Add RLS policies for user management

  1. Security Changes
    - Enable RLS on users table (already enabled)
    - Add policy for admins to read all users
    - Add policy for admins to insert new users
    - Add policy for admins to delete users
    - Add policy for users to read their own data

  2. Notes
    - Policies are scoped to authenticated users only
    - Admin role check is performed using auth.jwt() -> user_role
    - Users can only read their own data (id match)
    - Only admins can create and delete users
*/

-- Policy to allow admins to read all users
CREATE POLICY "Admins can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'user_role')::text = 'admin'
);

-- Policy to allow users to read their own data
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Policy to allow admins to insert new users
CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'user_role')::text = 'admin'
);

-- Policy to allow admins to delete users
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'user_role')::text = 'admin'
);