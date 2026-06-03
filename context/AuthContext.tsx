import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { subscribeToAuth, getUserProfile, logout as backendLogout } from '../services/supabaseService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const logout = async () => {
    await backendLogout();
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      const profile = await getUserProfile(supabaseUser.id);
      setUser({ ...profile, email: supabaseUser.email } as any);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const mockStr = localStorage.getItem('caliber_mock_user');
      if (mockStr) {
        try {
          const mockUser = JSON.parse(mockStr);
          setUser(mockUser);
          setSupabaseUser(null);
          setLoading(false);
          setIsAuthReady(true);
          return;
        } catch (e) {
          // ignore
        }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSupabaseUser(session.user);
          const profile = await getUserProfile(session.user.id);
          setUser({ ...profile, email: session.user.email } as any); // Include email
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to retrieve Supabase session:', err);
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    };

    initAuth();

    const unsubscribe = subscribeToAuth(async (sUser) => {
      const mockStr = localStorage.getItem('caliber_mock_user');
      if (mockStr) {
        try {
          const mockUser = JSON.parse(mockStr);
          setUser(mockUser);
          setSupabaseUser(null);
          setLoading(false);
          setIsAuthReady(true);
          return;
        } catch (e) {
          // ignore
        }
      }

      setSupabaseUser(sUser);
      if (sUser) {
        const profile = await getUserProfile(sUser.id || sUser.uid);
        setUser({ ...profile, email: sUser.email } as any); // Include email
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, isAuthReady, isAuthenticated, logout, refreshUser }}>
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
