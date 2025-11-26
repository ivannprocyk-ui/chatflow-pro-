import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  fullName?: string;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  aiEnabled: boolean;
  whatsappConnected?: boolean;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkUser();

    // Listen for auth state changes
    let subscription: any = null;

    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);

        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setOrganization(null);
        }
      });

      subscription = result.data.subscription;
    } catch (error: any) {
      console.warn('[AuthContext] Could not set up auth listener - offline mode:', error.message);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('[AuthContext] Supabase connection error:', error.message);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserData(session.user);
      }
    } catch (error: any) {
      console.warn('[AuthContext] Error checking user - app will continue without auth:', error.message);
      // Don't throw - allow app to continue without authentication
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (authUser: SupabaseUser) => {
    try {
      // Get user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('[AuthContext] Error loading user data:', userError);
        return;
      }

      // Get organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();

      if (orgError) {
        console.error('[AuthContext] Error loading organization:', orgError);
        return;
      }

      // Set user state
      setUser({
        id: userData.id,
        email: userData.email,
        organizationId: userData.organization_id,
        role: userData.role,
        fullName: userData.full_name,
      });

      // Set organization state
      setOrganization({
        id: orgData.id,
        name: orgData.name,
        plan: orgData.plan || 'free',
        aiEnabled: orgData.ai_enabled || false,
        whatsappConnected: orgData.whatsapp_connected || false,
      });

      console.log('[AuthContext] User data loaded successfully');
    } catch (error) {
      console.error('[AuthContext] Error in loadUserData:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting login with Supabase:', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await loadUserData(data.user);
      }

      console.log('[AuthContext] Login successful');
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, organizationName: string) => {
    try {
      console.log('[AuthContext] Attempting register with Supabase:', { email, organizationName });

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0], // Use email prefix as default name
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // 2. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          plan: 'free',
          ai_enabled: false,
          whatsapp_connected: false,
        })
        .select()
        .single();

      if (orgError) {
        throw orgError;
      }

      // 3. Create user record in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          organization_id: orgData.id,
          email: email,
          full_name: email.split('@')[0],
          role: 'admin',
          is_active: true,
        });

      if (userError) {
        throw userError;
      }

      // Load user data
      await loadUserData(authData.user);

      console.log('[AuthContext] Registration successful');
    } catch (error: any) {
      console.error('[AuthContext] Register error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setOrganization(null);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
