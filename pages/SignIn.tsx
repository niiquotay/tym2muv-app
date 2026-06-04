import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginWithGoogle, loginWithLinkedIn, loginWithEmail, signupWithEmail } from '../services/supabaseService';
import Icon from '../components/Icon';
import { Logo } from '../components/Logo';

interface SignInProps {
  defaultTab?: 'signin' | 'signup';
}

const SignIn: React.FC<SignInProps> = ({ defaultTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(defaultTab === 'signup' || location.pathname === '/signup');
  const [selectedRole, setSelectedRole] = React.useState<'Tenant' | 'Agent'>('Tenant');
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  
  // Email/Password states
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    setIsSignUp(defaultTab === 'signup' || location.pathname === '/signup');
  }, [location.pathname, defaultTab]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      localStorage.setItem('oauth_selected_role', selectedRole);
      await loginWithGoogle(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleLinkedInAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      localStorage.setItem('oauth_selected_role', selectedRole);
      await loginWithLinkedIn(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with LinkedIn.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and passcode.');
      return;
    }
    if (isSignUp && !name) {
      setError('Please provide your name.');
      return;
    }
    if (isSignUp && !agreedToTerms) {
      setError('Please accept terms and conditions.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const targetRole = selectedRole === 'Agent' ? 'Agent' : 'Tenant';
      if (isSignUp) {
        await signupWithEmail(email, password, name, targetRole);
        setMessage('Registration successful! Decrypting your secure session...');
      } else {
        await loginWithEmail(email, password, targetRole);
        setMessage('Authentication successful! Logging in...');
      }

      window.dispatchEvent(new Event('storage'));

      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      console.error('Email auth error:', err);
      setError(err.message || 'Failed to authenticate secure candidate channel.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="signin-root-container" className="min-h-screen w-full flex items-center justify-center px-4 py-16 relative overflow-hidden bg-gradient-to-tr from-purple-100/80 via-fuchsia-50/60 to-indigo-100/80">
      {/* Heavy Quantum Field Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-indigo-300/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-fuchsia-400/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div id="signin-container-card" className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[3rem] shadow-[0_40px_90px_rgba(147,51,234,0.12),inset_0_1px_2px_0_rgba(255,255,255,0.7)] p-12 md:p-20 relative overflow-hidden animate-slide-up">
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
              {isSignUp ? 'SECURE REGISTRATION GATEWAY' : 'SECURE AUTHENTICATION GATEWAY'}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-slate-900 mb-2">
              {isSignUp ? 'Create CaliberDesk Account' : 'Welcome to CaliberDesk'}
            </h1>
            <p className="text-slate-600 text-xs md:text-sm max-w-md mx-auto font-medium">
              {isSignUp 
                ? 'Join our hyper-growth global workforce matching top-tier talent with world-class agents.'
                : 'Access your secure candidate dashboard, active jobs, and custom listings.'
              }
            </p>
          </div>

          <div className="space-y-8 w-full">
            {error && (
              <div id="auth-error-display" className="bg-red-500/10 border border-red-500/20 text-red-700 px-5 py-4 rounded-2xl text-sm font-mono animate-shake flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>{error}</span>
              </div>
            )}
            
            {message && (
              <div id="auth-success-display" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-5 py-4 rounded-2xl text-sm font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{message}</span>
              </div>
            )}

            {/* Futuristic Role Switcher */}
            <div className="grid grid-cols-2 p-2 bg-slate-950/5 rounded-3xl border border-purple-100 shadow-inner">
              <button
                id="role-tenant-btn"
                type="button"
                onClick={() => setSelectedRole('Tenant')}
                className={`py-5 text-sm font-mono font-bold rounded-2xl transition-all duration-350 relative overflow-hidden ${
                  selectedRole === 'Tenant'
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_6px_16px_rgba(139,92,246,0.25)] border border-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                RENTER_BUYER
              </button>
              <button
                id="role-agent-btn"
                type="button"
                onClick={() => setSelectedRole('Agent')}
                className={`py-5 text-sm font-mono font-bold rounded-2xl transition-all duration-350 relative overflow-hidden ${
                  selectedRole === 'Agent'
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_6px_16px_rgba(139,92,246,0.25)] border border-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                AGENT_SELLER
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-6 w-full">
              {isSignUp && (
                <div className="flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-mono font-bold tracking-wider uppercase ml-1">
                    FULL_NAME
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Icon name="user" size={18} />
                    </div>
                    <input
                      id="signup-name-field"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-4 bg-white/80 border border-purple-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-sans"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-mono font-bold tracking-wider uppercase ml-1">
                    EMAIL_ADDRESS
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Icon name="mail" size={18} />
                    </div>
                    <input
                      id="signin-email-field"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. email@example.com"
                      required
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-4 bg-white/80 border border-purple-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-slate-500 text-xs font-mono font-bold tracking-wider uppercase ml-1">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Icon name="lock" size={18} />
                    </div>
                    <input
                      id="signin-password-field"
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

              {isSignUp && (
                <div id="terms-checkbox-container" className="flex items-start gap-3 bg-brand-50/40 border border-brand-100/50 p-4 rounded-2xl animate-fade-in transition-all">
                  <input
                    id="signup-agree-checkbox"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-500 hover:border-brand-400 accent-brand-600 cursor-pointer"
                  />
                  <label id="signup-agree-label" htmlFor="signup-agree-checkbox" className="text-xs text-slate-700 font-semibold cursor-pointer leading-relaxed select-none">
                    I consent to CaliberDesk's secure profile registration and agree to the <Link to="/info/terms" className="text-brand-600 hover:underline font-bold" target="_blank">Terms of Service</Link> and <Link to="/info/privacy" className="text-brand-600 hover:underline font-bold" target="_blank">Privacy Policy</Link>.
                  </label>
                </div>
              )}

              <button
                id="email-auth-submit-btn"
                type="submit"
                disabled={isLoading || (isSignUp && !agreedToTerms)}
                className="w-full py-5 text-sm font-mono font-bold text-white rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_8px_30px_rgba(139,92,246,0.25)] hover:shadow-[0_12px_40px_rgba(139,92,246,0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>ESTABLISHING_SECURE_BRIDGE...</span>
                  </>
                ) : (
                  <>
                    <Icon name="key" size={16} />
                    <span>{isSignUp ? 'REGISTER_ACCOUNT' : 'DECRYPT_CREDENTIAL_GATEWAY'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-5 items-center w-full">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-450 font-mono text-[10px] font-bold tracking-wider uppercase">OR_USE_AUTHENTICATORS</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Futuristic Larger Social Authentication Buttons with logos only */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center items-center gap-8 pt-2 pb-2">
                {/* Google Authentication Port */}
                <button
                  id="auth-google-btn"
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading || (isSignUp && !agreedToTerms)}
                  title={isSignUp ? 'Sign up with Google (Requires Consent)' : 'Sign in with Google'}
                  className="w-28 h-28 flex items-center justify-center bg-white border border-purple-100 hover:border-brand-500/40 rounded-[2rem] transition-all duration-300 shadow-[0_10px_40px_rgba(147,51,234,0.08)] hover:shadow-[0_16px_50px_rgba(147,51,234,0.18)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none group"
                >
                  <svg className="w-14 h-14 transition-transform duration-300 group-hover:scale-110 group-disabled:scale-100" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.43 1.74 14.93 1 12 1 7.22 1 3.19 3.73 1.25 7.73l3.8 2.95C5.97 7.15 8.73 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.43-4.94 3.43-8.58z" />
                    <path fill="#FBBC05" d="M5.05 14.68c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.25 7.17C.45 8.78 0 10.59 0 12.5s.45 3.72 1.25 5.33l3.8-3.15z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.03.69-2.34 1.1-4.23 1.1-3.27 0-6.03-2.11-7.02-5.18l-3.8 2.95C3.19 20.27 7.22 23 12 23z" />
                  </svg>
                </button>

                {/* LinkedIn Authentication Port */}
                <button
                  id="auth-linkedin-btn"
                  type="button"
                  onClick={handleLinkedInAuth}
                  disabled={isLoading || (isSignUp && !agreedToTerms)}
                  title={isSignUp ? 'Sign up with LinkedIn (Requires Consent)' : 'Sign in with LinkedIn'}
                  className="w-28 h-28 flex items-center justify-center bg-[#0A66C2] hover:bg-[#004182] border border-transparent rounded-[2rem] transition-all duration-300 shadow-[0_10px_40px_rgba(10,102,194,0.22)] hover:shadow-[0_16px_50px_rgba(10,102,194,0.35)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none group"
                >
                  <svg className="w-14 h-14 fill-current text-white transition-transform duration-300 group-hover:scale-110 group-disabled:scale-100" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </button>
              </div>

              {isSignUp && !agreedToTerms && (
                <p id="consent-warning-msg" className="text-center text-[10px] font-mono text-purple-600 font-bold tracking-wider animate-pulse mt-1">
                  ⚡ PLEASE ACCEPT REGISTRATION CONSENT TO OPEN GATEWAY
                </p>
              )}
            </div>

            <div className="pt-6 text-center">
              {isSignUp ? (
                <Link
                  to="/signin"
                  className="text-xs font-mono tracking-wider text-slate-500 hover:text-brand-600 transition-colors"
                >
                  // Already registered? Decrypt existing credential gateway
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="text-xs font-mono tracking-wider text-slate-500 hover:text-brand-600 transition-colors"
                >
                  // Missing keys? Provision a new active secure profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
