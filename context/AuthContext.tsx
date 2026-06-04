import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { subscribeToAuth, getUserProfile, logout as backendLogout, ensureUserProfileExists } from '../services/supabaseService';
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
    let active = true;

    const unsubscribe = subscribeToAuth(async (sUser) => {
      const mockStr = localStorage.getItem('caliber_mock_user');
      if (mockStr) {
        try {
          const mockUser = JSON.parse(mockStr);
          if (active) {
            setUser(mockUser);
            setSupabaseUser(null);
            setLoading(false);
            setIsAuthReady(true);
          }
          return;
        } catch (e) {
          // ignore
        }
      }

      if (active) {
        setSupabaseUser(sUser);
      }

      if (sUser) {
        let profile = await getUserProfile(sUser.id || (sUser as any).uid);
        if (!profile) {
          const oauthSelectedRole = localStorage.getItem('oauth_selected_role') || undefined;
          if (oauthSelectedRole) {
            localStorage.removeItem('oauth_selected_role');
          }
          profile = await ensureUserProfileExists(sUser.id || (sUser as any).uid, sUser.email, sUser.user_metadata, oauthSelectedRole);
        } else {
          const oauthSelectedRole = localStorage.getItem('oauth_selected_role') || undefined;
          if (oauthSelectedRole) {
            localStorage.removeItem('oauth_selected_role');
            profile = await ensureUserProfileExists(sUser.id || (sUser as any).uid, sUser.email, sUser.user_metadata, oauthSelectedRole);
          }
        }
        if (active) {
          setUser({ ...profile, email: sUser.email } as any);
        }
      } else {
        if (active) {
          setUser(null);
        }
      }

      if (active) {
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
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
