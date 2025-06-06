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

  console.log('🚀 AuthProvider initialized');

  const syncUserWithPublicTable = async (supabaseUser: SupabaseUser): Promise<void> => {
    console.log('🔄 Starting user sync for:', supabaseUser.email);
    
    try {
      // Check if user exists in public.users table
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error checking user existence:', selectError);
        return; // Don't block auth flow
      }

      if (!existingUser) {
        console.log('👤 User not found in public.users, creating...');
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
            role: 'employee' // Default role
          });

        if (insertError) {
          console.error('❌ Failed to create user in public.users:', insertError);
          return; // Don't block auth flow
        }
        
        console.log('✅ User created in public.users table');
      } else {
        console.log('✅ User already exists in public.users');
      }
    } catch (error) {
      console.error('❌ Exception in syncUserWithPublicTable:', error);
      // Don't throw - allow auth flow to continue
    }
  };

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    console.log('📋 Fetching user profile for:', supabaseUser.email);
    
    try {
      // Ensure user exists in public table first
      await syncUserWithPublicTable(supabaseUser);
      
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      if (!userProfile) {
        console.error('❌ User profile not found in database');
        return null;
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role as UserRole,
        createdAt: new Date(userProfile.created_at),
      };

      console.log('✅ User profile loaded:', user.email, 'Role:', user.role);
      return user;
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect triggered');
    
    const initializeAuth = async () => {
      console.log('🔍 Initializing authentication...');
      
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Auth initialization timeout - proceeding without auth');
          setLoading(false);
        }, 10000); // 10 second timeout

        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('❌ Session error:', error);
          setUser(null);
        } else if (session?.user) {
          console.log('✅ Session found for:', session.user.email);
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else {
          console.log('ℹ️ No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setUser(null);
      } finally {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📡 Auth state change:', event);
      
      try {
        if (session?.user) {
          console.log('👤 Processing auth state change for:', session.user.email);
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else {
          console.log('👋 No user in session, clearing user state');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error);
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw new Error("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
      }

      if (!data.user) {
        throw new Error("Aucun utilisateur trouvé.");
      }

      console.log('✅ Login successful for:', data.user.email);
      
      const userProfile = await fetchUserProfile(data.user);
      if (!userProfile) {
        throw new Error("Profil utilisateur non trouvé dans la base de données.");
      }

      setUser(userProfile);
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('👋 Logout initiated');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        const isSessionError = 
          error.message.includes('Auth session missing') || 
          error.message.includes('Session from session_id claim in JWT does not exist');
        
        if (!isSessionError) {
          throw error;
        } else {
          console.warn('⚠️ Session already invalid during logout:', error.message);
        }
      }
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    } finally {
      setUser(null);
    }
  };

  const isAllowed = (allowedRoles: UserRole[]) => {
    return user !== null && allowedRoles.includes(user.role);
  };

  console.log('🎯 AuthProvider render - Loading:', loading, 'User:', user?.email || 'None');

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