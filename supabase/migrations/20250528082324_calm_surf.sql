/*
  # Update users table and policies

  1. Changes
    - Add updated_at column to users table
    - Add RLS policies for update and delete operations
    - Add trigger for automatic updated_at timestamp
    - Set admin role for specific user

  2. Security
    - Enable policies for users to manage their own data
    - Restrict operations to authenticated users only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own data
CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update admin user role
UPDATE public.users
SET role = 'admin'
WHERE email = 'bouir.ilyes@gmail.com';