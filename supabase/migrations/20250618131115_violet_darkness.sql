/*
  # Fix RLS policies and remove auth schema dependencies

  1. Database Changes
    - Drop all existing policies in correct order
    - Drop triggers before functions to avoid dependency errors
    - Remove admin_users table and related functions
    - Create simplified RLS policies without auth schema access

  2. Security
    - Maintain proper access control
    - Allow users to read/update their own data
    - Allow admins to manage all users
    - Enable public registration
*/

-- Supprimer les triggers AVANT les fonctions pour éviter les erreurs de dépendance
DROP TRIGGER IF EXISTS sync_admin_users_trigger ON users;
DROP TRIGGER IF EXISTS handle_new_admin_user_trigger ON users;

-- Maintenant supprimer les fonctions
DROP FUNCTION IF EXISTS sync_admin_users();
DROP FUNCTION IF EXISTS handle_new_admin_user();
DROP FUNCTION IF EXISTS auth.is_admin();
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;
DROP POLICY IF EXISTS "users_public_insert_policy" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_read_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "admin_read_all" ON users;
DROP POLICY IF EXISTS "admin_update_all" ON users;
DROP POLICY IF EXISTS "admin_delete_all" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Supprimer les politiques de admin_users si elles existent
DROP POLICY IF EXISTS "admin_users_admin_only" ON admin_users;

-- Supprimer la table admin_users
DROP TABLE IF EXISTS admin_users;

-- Créer des politiques ultra-simples sans aucun accès au schéma auth

-- Lecture : utilisateurs peuvent lire leur propre profil OU si c'est un admin
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );

-- Mise à jour : utilisateurs peuvent modifier leur propre profil OU si c'est un admin
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );

-- Insertion : permettre l'insertion pour la synchronisation
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Insertion publique pour l'enregistrement
CREATE POLICY "users_insert_public_policy" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Suppression : seuls les admins peuvent supprimer
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );

-- Créer un index pour optimiser les vérifications de rôle admin (si pas déjà existant)
CREATE INDEX IF NOT EXISTS users_role_admin_idx ON users (id) WHERE role = 'admin';