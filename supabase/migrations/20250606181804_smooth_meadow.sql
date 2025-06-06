/*
  # Politique RLS pour auto-insertion utilisateur

  1. Sécurité
    - Permet aux utilisateurs authentifiés d'insérer leur propre ligne dans `public.users`
    - Vérifie que l'ID correspond à l'utilisateur authentifié
    - Empêche la création de comptes pour d'autres utilisateurs
*/

-- Politique pour permettre aux utilisateurs d'insérer leur propre ligne
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);