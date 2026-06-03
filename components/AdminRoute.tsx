import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading || !isAuthenticated || !user) {
        setIsAdmin(false);
        return;
      }
      
      const localMockUserStr = localStorage.getItem('caliber_mock_user');
      let isMockAdmin = false;
      if (localMockUserStr) {
        try {
          const parsed = JSON.parse(localMockUserStr);
          if (parsed && parsed.role === 'Admin') {
            isMockAdmin = true;
          }
        } catch (_) {}
      }

      if (isMockAdmin || !isSupabaseConfigured) {
        setIsAdmin(user.role === 'Admin');
        return;
      }

      try {
        // Verify against the database, not JWT claims that the user can influence
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(!error && data?.role === 'Admin');
      } catch (err) {
        console.error('Error checking admin session', err);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user, isAuthenticated, authLoading]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
