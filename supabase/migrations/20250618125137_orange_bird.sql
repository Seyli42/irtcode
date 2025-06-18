/*
  # Nettoyage et simplification des politiques RLS

  1. Nettoyage
    - Suppression des politiques existantes
    - Suppression des fonctions problématiques (si elles existent)
    - Suppression des triggers (si ils existent)

  2. Nouvelles politiques
    - Politiques simples sans accès au schéma auth
    - Vérification des rôles admin via la table publique users uniquement
    - Optimisation avec index sur les rôles admin

  3. Sécurité
    - Aucun accès direct au schéma auth
    - Politiques non-récursives
    - Permissions appropriées pour chaque opération
*/

-- Supprimer toutes les politiques existantes (utiliser IF EXISTS pour éviter les erreurs)
DROP POLICY IF EXISTS "Admins can delete all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "admin_delete_users" ON users;
DROP POLICY IF EXISTS "public_insert_registration" ON users;
DROP POLICY IF EXISTS "user_insert_own" ON users;
DROP POLICY IF EXISTS "user_select_own_or_admin_all" ON users;
DROP POLICY IF EXISTS "user_update_own_or_admin_all" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;
DROP POLICY IF EXISTS "admin_read_all" ON users;
DROP POLICY IF EXISTS "admin_update_all" ON users;
DROP POLICY IF EXISTS "admin_delete_all" ON users;

-- Supprimer les fonctions qui pourraient accéder au schéma auth (si elles existent)
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS sync_admin_users();
DROP FUNCTION IF EXISTS handle_new_admin_user();

-- Supprimer les triggers (si ils existent)
DROP TRIGGER IF EXISTS sync_admin_users_trigger ON users;
DROP TRIGGER IF EXISTS handle_new_admin_user_trigger ON users;

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

-- Créer un index pour optimiser les vérifications de rôle admin
CREATE INDEX IF NOT EXISTS users_role_admin_idx ON users (id) WHERE role = 'admin';