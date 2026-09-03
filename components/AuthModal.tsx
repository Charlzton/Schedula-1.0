'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, AlertCircle, CheckCircle2, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { SchedulaLogo } from './SchedulaLogo';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup', onAuthSuccess }: AuthModalProps) {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset, user } = useAuth();

  const [role, setRole] = useState<UserRole>('lecturer');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sync mode and clear errors when opening
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccess(null);
      setName('');
      setEmail('');
      setPassword('');
      setShowForgotPassword(false);
      setResetEmailSent(false);
      setLoading(false);
      setGoogleLoading(false);
    }
  }, [isOpen, initialMode]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        onClose();
        if (res.targetRoute) {
          router.replace(res.targetRoute);
        } else if (onAuthSuccess) {
          onAuthSuccess();
        }
      } else {
        setError(res.error || 'Failed to sign in with Google');
      }
    } catch {
      setError('An unexpected error occurred during Google sign in');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (role === 'admin') {
          setError('Administrator registration is restricted. Please sign in with an authorized administrator account.');
          setLoading(false);
          return;
        }

        const res = await signUpWithEmail(name, cleanEmail, password, 'University of Ghana', role);
        if (res.success) {
          onClose();
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        } else {
          setError(res.error || 'Failed to create account');
        }
      } else {
        const res = await signInWithEmail(cleanEmail, password, role);
        if (res.success) {
          onClose();
          if (res.targetRoute) {
            router.replace(res.targetRoute);
          } else if (onAuthSuccess) {
            onAuthSuccess();
          }
        } else {
          setError(res.error || 'Incorrect email or password');
        }
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPasswordReset(cleanEmail);
      if (res.success) {
        setResetEmailSent(true);
      } else {
        setError(res.error || 'Failed to send reset link');
      }
    } catch {
      setError('Failed to dispatch password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-system">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
          />

          {/* Top-Right Page Controls (Theme Toggle & Close) - Belongs to Shell, Not Form */}
          <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              id="auth-modal-theme-toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              title="Close"
              className="p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              id="auth-modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[420px] rounded-3xl p-6 sm:p-7 glass-panel shadow-2xl z-10 my-auto"
          >
            {/* Schedula Insignia & Heading */}
            <div className="flex flex-col items-center text-center space-y-2 mb-4">
              <SchedulaLogo size="lg" isDark={isDark} />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {showForgotPassword
                  ? 'Reset Password'
                  : mode === 'signin'
                  ? 'Welcome back'
                  : 'Create account'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {showForgotPassword
                  ? 'Enter your email to receive recovery instructions'
                  : 'Academic Timetable & Facility Scheduling'}
              </p>
            </div>

            {showForgotPassword ? (
              /* Forgot Password Flow */
              <div className="space-y-3.5 text-center">
                {resetEmailSent ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Reset link dispatched to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>. Please check your inbox.
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-3 text-left">
                    <div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      />
                    </div>
                    {error && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span className="leading-snug">{error}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    setError(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              /* Main Sign In / Sign Up View */
              <div className="space-y-3.5">
                {/* Single-Container Role Selector */}
                <div className="p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('lecturer');
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                      role === 'lecturer'
                        ? 'bg-white dark:bg-[#1E202C] text-blue-600 dark:text-blue-400 shadow-xs border border-black/5 dark:border-white/10'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Lecturer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('admin');
                      setMode('signin');
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                      role === 'admin'
                        ? 'bg-white dark:bg-[#1E202C] text-blue-600 dark:text-blue-400 shadow-xs border border-black/5 dark:border-white/10'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* Feedback Alerts */}
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-snug flex-1">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span className="leading-snug">{success}</span>
                  </div>
                )}

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-800 dark:text-white" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.24 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 12s.43 3.88 1.19 5.42l4.09-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-zinc-200 dark:border-white/10" />
                  <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                    or
                  </span>
                  <div className="flex-grow border-t border-zinc-200 dark:border-white/10" />
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {role === 'lecturer' && mode === 'signup' && (
                    <div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        disabled={loading}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        disabled={loading}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signin' && (
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium hover:underline cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                        </>
                      ) : (
                        <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Bottom Toggle / Note */}
                <div className="pt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {role === 'admin' ? (
                    <p>
                      Administrator portal is restricted to authorized personnel.
                    </p>
                  ) : mode === 'signin' ? (
                    <p>
                      New faculty member?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError(null);
                        }}
                        className="text-zinc-900 dark:text-white font-semibold hover:underline cursor-pointer ml-0.5"
                      >
                        Register
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          setError(null);
                        }}
                        className="text-zinc-900 dark:text-white font-semibold hover:underline cursor-pointer ml-0.5"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
