/*
  # Correction de l'accès au schéma auth

  1. Suppression des fonctions qui accèdent à auth.users
  2. Politiques simplifiées sans accès au schéma auth
  3. Utilisation uniquement de la table publique users
  4. Gestion des permissions via la table publique

  ## Changements
  - Suppression de toutes les fonctions accédant à auth.users
  - Politiques basées uniquement sur auth.uid()
  - Table admin_users pour gérer les permissions admin
  - Pas d'accès direct au schéma auth
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_public" ON users;
DROP POLICY IF EXISTS "admin_read_all" ON users;
DROP POLICY IF EXISTS "admin_update_all" ON users;
DROP POLICY IF EXISTS "admin_delete_all" ON users;
DROP POLICY IF EXISTS "admin_users_admin_only" ON admin_users;

-- Supprimer les fonctions qui accèdent au schéma auth
DROP FUNCTION IF EXISTS auth.is_admin();
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS sync_admin_users();
DROP FUNCTION IF EXISTS handle_new_admin_user();

-- Supprimer les triggers
DROP TRIGGER IF EXISTS sync_admin_users_trigger ON users;
DROP TRIGGER IF EXISTS handle_new_admin_user_trigger ON users;

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

-- Créer un index pour optimiser les vérifications de rôle admin
CREATE INDEX IF NOT EXISTS users_role_admin_idx ON users (id) WHERE role = 'admin';