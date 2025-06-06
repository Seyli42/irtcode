import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes. Veuillez cliquer sur "Connect to Supabase" pour configurer votre projet.');
}

// Création du client Supabase avec options de configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'irt-app'
    }
  }
});

// Vérification de la connexion avec gestion d'erreur
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('Connecté avec succès');
  } else if (event === 'SIGNED_OUT') {
    console.log('Déconnecté');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token rafraîchi');
  }
});