import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, LogIn, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, loginWithGoogle, authError } = useAuth();
  const navigate = useNavigate();

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // UI state
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Google Auth Simulation states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) return;
      
      const loggedUser = await login(
        email,
        isRegister ? (name || email.split('@')[0]) : undefined,
        undefined,
        password
      );

      // Redirect based on role
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'delivery') {
        navigate('/delivery');
      } else if (loggedUser.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    // Simulate mock API reset link
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setForgotLoading(false);
    setForgotSuccess(true);
  };

  const handleGoogleLogin = async (emailToUse, nameToUse) => {
    setLoading(true);
    setError('');
    setShowGoogleModal(false);
    try {
      const loggedUser = await login(
        emailToUse,
        nameToUse || emailToUse.split('@')[0],
        undefined,
        undefined
      );

      // Redirect based on role
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'delivery') {
        navigate('/delivery');
      } else if (loggedUser.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthClick = async () => {
    // If Firebase is configured, trigger the real Google Sign-In popup
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      setLoading(true);
      setError('');
      try {
        const loggedUser = await loginWithGoogle();

        // Redirect based on role
        if (loggedUser.role === 'admin') {
          navigate('/admin');
        } else if (loggedUser.role === 'delivery') {
          navigate('/delivery');
        } else if (loggedUser.role === 'manager') {
          navigate('/manager');
        } else {
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to simulation modal if Firebase env variables aren't set
      setShowGoogleModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-white relative overflow-hidden font-sans">
      
      {/* Welcome & branding header matching custom spec */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/10">
          <LogIn className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-5">
          {isRegister ? 'Create an account' : 'Welcome back'}
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          {isRegister ? 'Set up your distributor credentials' : 'Log in to your account'}
        </p>
      </div>

      {/* Main card matching a premium login portal */}
      <div className="w-full max-w-[400px] bg-white border border-gray-250 rounded-[1.5rem] shadow-xl p-7 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Google Authentication Option */}
        <button
          type="button"
          onClick={handleGoogleAuthClick}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* OR divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Alert feedback blocks */}
        {(error || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-start gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-semibold leading-normal">{error || authError}</span>
          </div>
        )}

        {/* Primary Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-700">Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-indigo-650 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="........"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] mt-3 disabled:bg-gray-200 disabled:text-gray-450 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>

      {/* Roster Switch Footer Link */}
      <div className="mt-6 text-center text-xs font-semibold">
        {isRegister ? (
          <p className="text-gray-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className="text-indigo-600 font-extrabold hover:underline"
            >
              Log in
            </button>
          </p>
        ) : (
          <p className="text-gray-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className="text-indigo-600 font-extrabold hover:underline"
            >
              Create one
            </button>
          </p>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-[360px] bg-white border border-gray-200 rounded-[2rem] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-gray-805">
            <h2 className="text-lg font-black tracking-tight font-display text-gray-900 mb-1.5">Reset Password</h2>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Enter your registered email address and we'll send a password recovery link.
            </p>

            {forgotSuccess ? (
              <div className="text-center py-2 space-y-3">
                <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xs font-bold text-gray-900">Instructions Dispatched</h3>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  A reset link has been dispatched to <span className="font-semibold text-gray-700">{forgotEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                    setForgotEmail('');
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl mt-4 transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
 
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotEmail('');
                    }}
                    className="w-1/2 border border-gray-350 text-gray-500 rounded-xl py-2.5 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail}
                    className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:bg-gray-150 disabled:text-gray-400"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google Sign-in Mock Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-[380px] bg-white border border-gray-200 rounded-[2rem] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-gray-850">
            <div className="flex flex-col items-center mb-5 text-center">
              {/* Google logo SVG */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </div>
              <h2 className="text-lg font-black tracking-tight text-gray-900 font-display">Sign in with Google</h2>
              <p className="text-xs text-gray-550 mt-1">Choose an account to continue to Manisha</p>
            </div>

            {showCustomGoogleInput ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail) {
                    handleGoogleLogin(customGoogleEmail, customGoogleName);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
 
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Google Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
 
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomGoogleInput(false);
                      setCustomGoogleEmail('');
                      setCustomGoogleName('');
                    }}
                    className="w-1/2 border border-gray-350 text-gray-500 rounded-xl py-2.5 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2.5">

                {/* Custom account selection */}
                <button
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full text-center py-2.5 border border-dashed border-gray-300 hover:bg-gray-50 text-gray-500 font-bold text-xs rounded-xl transition-all"
                >
                  Use another account
                </button>

                <button
                  onClick={() => setShowGoogleModal(false)}
                  className="w-full text-center py-2 text-gray-400 hover:text-gray-600 font-bold text-[11px] uppercase tracking-wider pt-4"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
