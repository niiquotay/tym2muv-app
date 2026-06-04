
import React, { Component, ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Icon from './components/Icon';
import { logger } from './utils/logger';

const SearchPage = lazy(() => import('./pages/SearchPage'));
const PostAd = lazy(() => import('./pages/PostAd'));
const CreateVendor = lazy(() => import('./pages/CreateVendor'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const Profile = lazy(() => import('./pages/Profile'));
const Chat = lazy(() => import('./pages/Chat'));
const SavedListings = lazy(() => import('./pages/SavedListings'));
const Settings = lazy(() => import('./pages/Settings'));
const SignIn = lazy(() => import('./pages/SignIn'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const StaticCMSPage = lazy(() => import('./pages/StaticCMSPage'));
const RentFinancing = lazy(() => import('./pages/RentFinancing'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      <p className="mt-4 text-sm font-medium text-slate-500">Loading...</p>
    </div>
  </div>
);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    logger.error(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      if (error?.message === 'MISSING_ENV_VARS') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="database" size={32} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Connect to Supabase</h1>
              <p className="text-slate-500 text-sm mb-6">
                Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables to run this application.
              </p>
            </div>
          </div>
        );
      }

      let errorMessage = "Something went wrong.";
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.error) {
          errorMessage = `Error: ${parsedError.error} during ${parsedError.operationType} at ${parsedError.path}`;
        }
      } catch (e) {
        errorMessage = error?.message || String(error);
      }

      // Hide exact internal errors in production unless it's a known non-sensitive error
      if (import.meta.env.PROD && !errorMessage.startsWith('Error:')) {
          errorMessage = 'An unexpected error occurred. Our team has been notified.';
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="alert" size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Application Error</h1>
            <p className="text-slate-500 text-sm mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const EnvValidator: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (isMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="database" size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Connect to Supabase</h1>
          <p className="text-slate-500 text-sm mb-6">
            Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables to run this application.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <EnvValidator>
        <AuthProvider>
          <LocationProvider>
            <Router>
              <ScrollToTop />
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                  <Route path="/" element={<SearchPage />} />
                  <Route path="/signin" element={<SignIn defaultTab="signin" />} />
                  <Route path="/signup" element={<SignIn defaultTab="signup" />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/listing/:id" element={<ListingDetails />} /> 
                  <Route path="/payment/:id" element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected Routes */}
                  <Route path="/post" element={
                    <ProtectedRoute>
                      <PostAd />
                    </ProtectedRoute>
                  } />
                  <Route path="/create-vendor" element={
                    <ProtectedRoute>
                      <CreateVendor />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/:userId" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />
                  <Route path="/saved" element={
                    <ProtectedRoute>
                      <SavedListings />
                    </ProtectedRoute>
                  } />
                  <Route path="/rent-financing" element={<RentFinancing />} />

                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/agent-dashboard" element={
                    <ProtectedRoute>
                      <AgentDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/info/:slug" element={<StaticCMSPage />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </LocationProvider>
      </AuthProvider>
      </EnvValidator>
    </ErrorBoundary>
  );
};

export default App;
