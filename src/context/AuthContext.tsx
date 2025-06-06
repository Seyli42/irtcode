// src/context/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserWithPublicTable = async (user) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!data) {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
        });

        if (insertError) console.error('Insert error:', insertError.message);
      }
    } catch (err) {
      console.error('Sync error:', err.message);
    }
  };

  useEffect(() => {
    const getSessionAndSync = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Session error:', error.message);

      setSession(session);

      if (session?.user) {
        await syncUserWithPublicTable(session.user);
      }

      setLoading(false);
    };

    getSessionAndSync();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
