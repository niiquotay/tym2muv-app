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
      console.log("[AuthContext] subscribeToAuth callback triggered with sUser:", sUser);
      
      try {
        const mockStr = localStorage.getItem('caliber_mock_user');
        
        // Prioritize mock user ONLY if there is no active Supabase session (sUser is null)
        if (mockStr && !sUser) {
          try {
            const mockUser = JSON.parse(mockStr);
            console.log("[AuthContext] Fallback to mock user from localStorage:", mockUser);
            if (active) {
              setUser(mockUser);
              setSupabaseUser(null);
            }
            return;
          } catch (e) {
            console.warn("[AuthContext] Failed to parse caliber_mock_user:", e);
          }
        }

        if (active) {
          setSupabaseUser(sUser);
        }

        if (sUser) {
          // Clear any stale mock user from localStorage as we have a real Supabase session
          if (localStorage.getItem('caliber_mock_user')) {
            console.log("[AuthContext] Real session active. Clearing stale caliber_mock_user.");
            localStorage.removeItem('caliber_mock_user');
          }

          const userId = sUser.id || (sUser as any).uid;
          console.log("[AuthContext] Loading profile for user ID:", userId);
          
          let profile = await getUserProfile(userId);
          console.log("[AuthContext] Retried getUserProfile result:", profile);
          
          if (!profile) {
            const oauthSelectedRole = localStorage.getItem('oauth_selected_role') || undefined;
            console.log("[AuthContext] Profile missing in database. Selected role from OAuth flow:", oauthSelectedRole);
            if (oauthSelectedRole) {
              localStorage.removeItem('oauth_selected_role');
            }
            profile = await ensureUserProfileExists(userId, sUser.email, sUser.user_metadata, oauthSelectedRole);
            console.log("[AuthContext] Created missing profile:", profile);
          } else {
            const oauthSelectedRole = localStorage.getItem('oauth_selected_role') || undefined;
            if (oauthSelectedRole) {
              console.log("[AuthContext] Profile exists. Clearing oauth_selected_role & updating role if mismatched:", oauthSelectedRole);
              localStorage.removeItem('oauth_selected_role');
              profile = await ensureUserProfileExists(userId, sUser.email, sUser.user_metadata, oauthSelectedRole);
            }
          }
          
          if (active) {
            console.log("[AuthContext] Setting active user profile:", profile);
            setUser({ ...profile, email: sUser.email } as any);
          }
        } else {
          if (active) {
            console.log("[AuthContext] No active session (sUser is null). Setting user to null.");
            setUser(null);
          }
        }
      } catch (err) {
        console.error("[AuthContext] Uncaught error during auth state change subscriber processing:", err);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
          setIsAuthReady(true);
        }
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
