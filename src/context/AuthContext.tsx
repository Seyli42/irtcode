import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  const [initialized, setInitialized] = useState(false);
  const processingAuth = useRef(false);

  console.log('🚀 AuthProvider render - Loading:', loading, 'User:', user?.email || 'None', 'Initialized:', initialized);

  const syncUserWithPublicTable = async (supabaseUser: SupabaseUser): Promise<void> => {
    console.log('🔄 Starting user sync for:', supabaseUser.email);
    
    try {
      const userEmail = supabaseUser.email || '';
      const userName = supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';
      
      // First, try to find existing user by ID
      const { data: existingUserById } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (existingUserById) {
        // User exists with this ID, update their info if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: userEmail,
            name: userName,
          })
          .eq('id', supabaseUser.id);

        if (updateError) {
          console.error('❌ Failed to update existing user:', updateError);
          return;
        }
        
        console.log('✅ Updated existing user by ID');
        return;
      }

      // User doesn't exist by ID, check if email exists with different ID
      const { data: existingUserByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (existingUserByEmail) {
        // Email exists with different ID, update the existing record's ID
        const { error: updateError } = await supabase
          .from('users')
          .update({
            id: supabaseUser.id,
            name: userName,
          })
          .eq('email', userEmail);

        if (updateError) {
          console.error('❌ Failed to update user ID for existing email:', updateError);
          return;
        }
        
        console.log('✅ Updated existing user ID for email:', userEmail);
        return;
      }

      // Neither ID nor email exists, create new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: userEmail,
          name: userName,
          role: 'employee' // Default role
        });

      if (insertError) {
        console.error('❌ Failed to insert new user:', insertError);
        return;
      }
      
      console.log('✅ Created new user in public.users table');
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
      
      // Use select without .single() to avoid errors when no rows are returned
      const { data: userProfiles, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id);

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      if (!userProfiles || userProfiles.length === 0) {
        console.error('❌ User profile not found in database');
        return null;
      }

      const userProfile = userProfiles[0];

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
    if (initialized) {
      console.log('⚠️ Auth already initialized, skipping');
      return;
    }

    console.log('🔄 AuthProvider useEffect triggered - initializing auth');
    
    const initializeAuth = async () => {
      if (processingAuth.current) {
        console.log('⚠️ Auth already processing, skipping');
        return;
      }

      processingAuth.current = true;
      console.log('🔍 Initializing authentication...');
      
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Auth initialization timeout - proceeding without auth');
          setLoading(false);
          setInitialized(true);
          processingAuth.current = false;
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
        setInitialized(true);
        processingAuth.current = false;
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📡 Auth state change:', event, 'Processing:', processingAuth.current);
      
      // Prevent processing during initial load
      if (!initialized && event !== 'SIGNED_IN') {
        console.log('⚠️ Skipping auth state change during initialization');
        return;
      }

      // Prevent concurrent processing
      if (processingAuth.current) {
        console.log('⚠️ Auth processing in progress, skipping state change');
        return;
      }

      processingAuth.current = true;
      
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
      } finally {
        setLoading(false);
        processingAuth.current = false;
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt for:', email);
    setLoading(true);
    
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
      
      // Don't manually set user here - let the auth state change handler do it
      // This prevents race conditions and duplicate processing
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    console.log('👋 Logout initiated');
    setLoading(true);
    
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
      setLoading(false);
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