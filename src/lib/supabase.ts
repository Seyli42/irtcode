import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Environment variables validation with detailed logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Environment Check:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  
  // Create a mock client to prevent app crash
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) })
    })
  };
  
  export const supabase = mockClient as any;
} else {
  console.log('✅ Creating Supabase client...');
  
  // Create the real Supabase client
  export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  });

  // Test connection
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth Event:', event);
    if (event === 'SIGNED_IN') {
      console.log('✅ User signed in:', session?.user?.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out');
    }
  });
  
  console.log('✅ Supabase client initialized');
}