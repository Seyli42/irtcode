import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAllowed: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    const metadata = supabaseUser.user_metadata;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: metadata?.name || supabaseUser.email?.split('@')[0] || '',
      role: (metadata?.role || 'employee') as UserRole,
      createdAt: new Date(supabaseUser.created_at),
    };
  };

  const syncUserWithPublicTable = async (supabaseUser: SupabaseUser) => {
    try {
      // Check if user exists in public.users table
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error checking user existence:', selectError);
        return;
      }

      // If user doesn't exist, create them
      if (!existingUser) {
        const metadata = supabaseUser.user_metadata;
        const userData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: metadata?.name || supabaseUser.email?.split('@')[0] || '',
          role: (metadata?.role || 'employee') as UserRole,
          created_at: supabaseUser.created_at,
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([userData]);

        if (insertError) {
          console.error('Error creating user in public table:', insertError);
        } else {
          console.log('User synced to public table:', userData.email);
        }
      }
    } catch (error) {
      console.error('Error syncing user with public table:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncUserWithPublicTable(session.user);
          setUser(mapSupabaseUser(session.user));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await syncUserWithPublicTable(session.user);
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error("Erreur Supabase :", error);
        throw new Error("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
      }

      if (!data.user) {
        throw new Error("Aucun utilisateur trouvé.");
      }

      await syncUserWithPublicTable(data.user);
      setUser(mapSupabaseUser(data.user));
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Check if the error is related to missing session
        const isSessionError = 
          error.message.includes('Auth session missing') || 
          error.message.includes('Session from session_id claim in JWT does not exist');
        
        if (!isSessionError) {
          throw error;
        } else {
          console.warn('Session already invalid during logout:', error.message);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Don't rethrow the error as we want to ensure the user state is cleared
    } finally {
      // Always clear the user state regardless of errors
      setUser(null);
    }
  };

  const isAllowed = (allowedRoles: UserRole[]) => {
    return user !== null && allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAllowed }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}