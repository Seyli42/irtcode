// src/context/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserWithPublicTable = async (user) => {
    console.log('🔄 Sync start for user:', user?.id);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking user:', error.message);
      }

      if (!data) {
        console.log('🆕 Inserting new user in public.users table...');
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
        });

        if (insertError) {
          console.error('❌ Insert error:', insertError.message);
        } else {
          console.log('✅ Inserted user successfully');
        }
      } else {
        console.log('✅ User already exists in users table');
      }
    } catch (err) {
      console.error('❌ Exception in sync:', err.message);
    }
  };

  useEffect(() => {
    const getSessionAndSync = async () => {
      console.log('🔍 Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session error:', error.message);
      } else {
        console.log('✅ Session retrieved:', session?.user?.id);
      }

      setSession(session);

      if (session?.user) {
        await syncUserWithPublicTable(session.user);
      }

      setLoading(false);
      console.log('✅ Finished auth loading');
    };

    getSessionAndSync();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('📡 Auth state changed:', _event);
        setSession(session);

        if (session?.user) {
          await syncUserWithPublicTable(session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
