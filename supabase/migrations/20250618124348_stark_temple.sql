/*
  # Correction des politiques d'accès utilisateur

  1. Suppression des politiques récursives
  2. Création de politiques simples sans accès à auth.users
  3. Utilisation uniquement des données de la table public.users
  4. Suppression de la fonction is_admin() problématique

  ## Changements
  - Supprime toutes les politiques existantes
  - Crée des politiques simples et non-récursives
  - Permet l'accès basé sur l'ID utilisateur uniquement
  - Évite complètement l'accès à auth.users
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_registration" ON users;
DROP POLICY IF EXISTS "service_role_all_access" ON users;
DROP POLICY IF EXISTS "admin_select_all" ON users;
DROP POLICY IF EXISTS "admin_update_all" ON users;
DROP POLICY IF EXISTS "admin_delete_all" ON users;

-- Supprimer la fonction problématique
DROP FUNCTION IF EXISTS auth.is_admin();

-- Créer des politiques simples sans récursion

-- Permettre à tous les utilisateurs authentifiés de lire leur propre profil
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permettre l'insertion pour la synchronisation auth
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permettre l'insertion publique pour l'enregistrement
CREATE POLICY "users_insert_public" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Créer une table simple pour stocker les rôles admin
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Insérer les admins existants (basé sur le rôle dans la table users)
INSERT INTO admin_users (user_id)
SELECT id FROM users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Fonction simple pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = is_admin.user_id
  );
$$;

-- Politiques admin utilisant la nouvelle fonction
CREATE POLICY "admin_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admin_update_all" ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admin_delete_all" ON users
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Trigger pour maintenir la table admin_users synchronisée
CREATE OR REPLACE FUNCTION sync_admin_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si le rôle devient admin, ajouter à admin_users
  IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role != 'admin') THEN
    INSERT INTO admin_users (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Si le rôle n'est plus admin, retirer de admin_users
  IF NEW.role != 'admin' AND OLD.role = 'admin' THEN
    DELETE FROM admin_users WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS sync_admin_users_trigger ON users;
CREATE TRIGGER sync_admin_users_trigger
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_users();

-- Trigger pour les nouveaux utilisateurs admin
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO admin_users (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour les insertions
DROP TRIGGER IF EXISTS handle_new_admin_user_trigger ON users;
CREATE TRIGGER handle_new_admin_user_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_admin_user();

-- Activer RLS sur la nouvelle table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Politique pour admin_users (seuls les admins peuvent la voir)
CREATE POLICY "admin_users_admin_only" ON admin_users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());