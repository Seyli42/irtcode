/*
  # Ajouter les champs SIREN et adresse pour les auto-entrepreneurs

  1. Modifications de la table
    - Ajouter le champ `siren` (text, optionnel)
    - Ajouter le champ `address` (text, optionnel)
  
  2. Contraintes
    - Le SIREN doit être unique s'il est renseigné
    - Le SIREN doit faire exactement 9 chiffres s'il est renseigné
  
  3. Sécurité
    - Les politiques existantes couvrent déjà ces nouveaux champs
*/

-- Ajouter les nouveaux champs à la table users
DO $$
BEGIN
  -- Ajouter le champ siren s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'siren'
  ) THEN
    ALTER TABLE users ADD COLUMN siren text;
  END IF;

  -- Ajouter le champ address s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;
END $$;

-- Ajouter une contrainte unique sur le SIREN (seulement s'il est renseigné)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'users_siren_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_siren_unique UNIQUE (siren);
  END IF;
END $$;

-- Ajouter une contrainte de validation pour le format du SIREN
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_siren_format'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_siren_format 
    CHECK (siren IS NULL OR (siren ~ '^[0-9]{9}$'));
  END IF;
END $$;

-- Créer un index sur le SIREN pour les recherches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_siren_idx'
  ) THEN
    CREATE INDEX users_siren_idx ON users (siren) WHERE siren IS NOT NULL;
  END IF;
END $$;