import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from '../services/supabaseService';
import { Logo } from '../components/Logo';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [email, setEmail] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check both Hash router's search and main window's search
  const queryParamsRaw = new URLSearchParams(window.location.search);
  const queryParamsHash = new URLSearchParams(location.search);
  const oobCode = queryParamsHash.get('oobCode') || queryParamsRaw.get('oobCode');

  useEffect(() => {
    async function checkCode() {
      if (!oobCode) {
        setError('No reset code found in URL. Please use the link sent to your email.');
        setIsVerifying(false);
        return;
      }
      try {
        const userEmail = await verifyPasswordResetCode(oobCode);
        setEmail(userEmail);
      } catch (err: any) {
        setError(err.message || 'The password reset link is invalid or has expired.');
      } finally {
        setIsVerifying(false);
      }
    }
    checkCode();
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!oobCode) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');
    
    try {
      await confirmPasswordReset(oobCode, password);
      setMessage('Password updated successfully! You can now sign in with your new password.');
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to securely reset your password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-card rounded-3xl shadow-[0_20px_50px_-12px_rgba(147,51,234,0.15)] p-8 md:p-10 relative overflow-hidden animate-slide-up">
        
        {/* Decorative background elements inside card */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <Link to="/">
            <Logo className="mb-6 scale-110" />
          </Link>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-2 font-display">
            Set New Password
          </h2>
          
          {email && !error && !message && (
             <p className="text-sm font-medium text-slate-500 mb-6 bg-slate-50 px-4 py-2 rounded-xl">
               Resetting password for: <span className="font-bold text-slate-700">{email}</span>
             </p>
          )}

          <div className="space-y-4 w-full mt-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-shake text-left">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium text-left">
                 {message}
                 <div className="mt-3 flex gap-2 justify-center border-t border-green-100 pt-3">
                   <Link to="/signin" className="text-brand-600 hover:text-brand-700 font-bold underline">Go to Sign In</Link>
                 </div>
              </div>
            )}

            {isVerifying ? (
               <div className="py-8 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm font-medium animate-pulse">Verifying secure link...</p>
               </div>
            ) : (
              !message && !error && oobCode && (
                <form onSubmit={handleReset} className="space-y-4 text-left">
                  <div>
                    <input
                      type="password"
                      placeholder="New password (min. 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center justify-center py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                       'Update Password'
                    )}
                  </button>
                </form>
              )
            )}
            
            {(error || !oobCode) && (
               <div className="pt-4">
                 <Link to="/signin" className="w-full inline-block bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all shadow-sm">
                   Return to Safety
                 </Link>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
