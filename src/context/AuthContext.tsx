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

  const ensureUserProfileExists = async (supabaseUser: SupabaseUser): Promise<void> => {
    console.log('🔄 Ensuring user profile exists for:', supabaseUser.email);
    
    try {
      const userEmail = supabaseUser.email || '';
      const userName = supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';
      const userRole = supabaseUser.user_metadata?.role || 'employee';
      const userSiren = supabaseUser.user_metadata?.siren || null;
      const userAddress = supabaseUser.user_metadata?.address || null;
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing user:', checkError);
        return;
      }

      if (existingUser) {
        console.log('✅ User profile already exists');
        return;
      }

      // Create user profile if it doesn't exist
      console.log('📝 Creating new user profile...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: userEmail,
          name: userName,
          role: userRole,
          siren: userSiren,
          address: userAddress,
        });

      if (insertError) {
        // If it's a duplicate key error, that's fine - user was created by another process
        if (insertError.code === '23505') {
          console.log('✅ User profile already exists (created concurrently)');
          return;
        }
        console.error('❌ Failed to create user profile:', insertError);
        return;
      }
      
      console.log('✅ User profile created successfully');
    } catch (error) {
      console.error('❌ Exception in ensureUserProfileExists:', error);
    }
  };

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    console.log('📋 Fetching user profile for:', supabaseUser.email);
    
    try {
      // First ensure the user profile exists
      await ensureUserProfileExists(supabaseUser);
      
      // Now fetch the user profile
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
        siren: userProfile.siren || undefined,
        address: userProfile.address || undefined,
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
        // Timeout de sécurité
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Auth initialization timeout - proceeding without auth');
          setLoading(false);
          setInitialized(true);
          processingAuth.current = false;
        }, 10000);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setUser(null);
        } else if (session?.user) {
          console.log('✅ Active session found for:', session.user.email);
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('📡 Auth state change:', event, 'Session:', session?.user?.email || 'None');
      
      // Skip processing during initialization
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
      
      // Fetch user profile immediately after successful login
      const userProfile = await fetchUserProfile(data.user);
      setUser(userProfile);
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
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
          error.message.includes('Session from session_id claim in JWT does not exist') ||
          error.message.includes('refresh_token_not_found');
        
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