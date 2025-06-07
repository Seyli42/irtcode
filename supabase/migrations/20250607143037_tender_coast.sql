/*
  # User Management System Improvements

  1. Database Schema
    - Ensure email uniqueness constraint exists
    - Update RLS policies for admin privileges
    
  2. Security
    - Admins can view/edit all users
    - Regular users can only view/edit their own profile
    - Prevent duplicate email registrations
    
  3. Changes
    - Add unique constraint on email if not exists
    - Update RLS policies for role-based access
    - Add policy for admins to manage all users
*/

-- Ensure email uniqueness constraint exists (safe operation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_email_key' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Add policy for admins to view all users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can view all users'
  ) THEN
    CREATE POLICY "Admins can view all users"
      ON users
      FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;

-- Add policy for admins to update all users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can update all users'
  ) THEN
    CREATE POLICY "Admins can update all users"
      ON users
      FOR UPDATE
      TO authenticated
      USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      )
      WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;

-- Add policy for admins to delete all users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can delete all users'
  ) THEN
    CREATE POLICY "Admins can delete all users"
      ON users
      FOR DELETE
      TO authenticated
      USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;