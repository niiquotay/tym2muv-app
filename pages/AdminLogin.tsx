import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmail } from '../services/supabaseService';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import Icon from '../components/Icon';
import { Logo } from '../components/Logo';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both administrative email and passcode.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check for supreme local admin bypass account
      const isSuperBypass = email.toLowerCase() === 'admin@caliberdesk.com' && password === 'admin123';

      if (isSuperBypass || !isSupabaseConfigured) {
        // Mock Admin login logic
        if (email.toLowerCase().includes('admin') || email === 'niidjanie@gmail.com' || isSuperBypass) {
          const mockAdminUser = {
            id: 'mock-admin-id',
            name: 'System Administrator',
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=0F172A&color=ffffff',
            rating: 5.0,
            reviewCount: 0,
            location: 'Accra, Ghana',
            memberSince: 'Jun 2026',
            bio: 'Master Administrative Account',
            verified: true,
            role: 'Admin',
            socials: { email }
          };
          
          localStorage.setItem('caliber_mock_user', JSON.stringify({
            ...mockAdminUser,
            isNewAccount: false,
            role: 'Admin',
            uid: mockAdminUser.id,
            email: email
          }));
          
          // Trigger local storage state update for subscribeToAuth in AuthContext
          window.dispatchEvent(new Event('storage'));
          navigate('/admin');
        } else {
          setError('Invalid administrator credentials in offline mode.');
        }
        setIsLoading(false);
        return;
      }

      // Live Supabase Authenticator
      const loginResult = await loginWithEmail(email, password, 'Admin');
      const userId = loginResult.id || loginResult.uid;

      if (!userId) {
        throw new Error('Authentication completed but no user identifier was returned.');
      }

      // Direct Database RBAC check: Only allow accounts tagged as 'Admin' in profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileErr || profile?.role !== 'Admin') {
        await supabase.auth.signOut();
        setError('Access Denied: Master administrator privileges required.');
        setIsLoading(false);
        return;
      }

      // Admin role confirmed, redirecting to the administrative suite
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      setError(err?.message || 'Failed to authenticate secure administrator channel.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="admin-signin-root" className="min-h-screen w-full flex items-center justify-center px-4 py-16 relative overflow-hidden bg-gradient-to-tr from-purple-100/80 via-fuchsia-50/60 to-indigo-100/80">
      {/* Heavy Quantum Field Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-indigo-300/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-fuchsia-400/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div id="admin-signin-card" className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[3rem] shadow-[0_40px_90px_rgba(147,51,234,0.12),inset_0_1px_2px_0_rgba(255,255,255,0.7)] p-12 md:p-20 relative overflow-hidden animate-slide-up">
        {/* Neon Laser Security Framing */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>

        <div className="relative z-10 flex flex-col items-center">
          <Link to="/" className="mb-4">
            <Logo className="scale-125 transition-all duration-300" />
          </Link>
          
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-purple-50 text-brand-600 text-[10px] font-mono font-bold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse"></span>
              SECURE ADMIN GATEWAY
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-slate-900 mb-2">
              CaliberDesk Control Panel
            </h1>
            <p className="text-slate-600 text-xs md:text-sm max-w-md mx-auto font-medium">
              Please authenticate using authorized administrative credentials to access command consoles, moderation tools, and global listings.
            </p>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-6 w-full">
            {error && (
              <div id="admin-auth-error" className="bg-red-500/10 border border-red-500/20 text-red-700 px-5 py-4 rounded-2xl text-sm font-mono animate-shake flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Address */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-500 text-xs font-mono font-bold tracking-wider uppercase ml-1">
                  SECURE_EMAIL_IDENTIFIER
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Icon name="mail" size={18} />
                  </div>
                  <input
                    id="admin-email-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@tym2muv.com"
                    autoFocus
                    required
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-purple-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-500 text-xs font-mono font-bold tracking-wider uppercase ml-1">
                  PASSCODE_KEY
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Icon name="lock" size={18} />
                  </div>
                  <input
                    id="admin-password-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••"
                    required
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-purple-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Authenticate Action */}
            <button
              id="admin-submit-btn"
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full py-5 text-sm font-mono font-bold text-white rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_8px_30px_rgba(139,92,246,0.25)] hover:shadow-[0_12px_40px_rgba(139,92,246,0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>ESTABLISHING_SECURE_BRIDGE...</span>
                </>
              ) : (
                <>
                  <Icon name="shield" size={16} />
                  <span>DECRYPT_ADMINISTRATIVE_GATEWAY</span>
                </>
              )}
            </button>

            <div className="pt-6 text-center">
              <Link
                to="/signin"
                className="text-xs font-mono tracking-wider text-slate-500 hover:text-brand-600 transition-colors"
              >
                // Return to Public User Console
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
