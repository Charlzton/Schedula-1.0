'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff
} from 'lucide-react';
import Image from 'next/image';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SchedulaLogo } from '@/components/SchedulaLogo';

interface LoginScreenProps {
  onClose?: () => void;
  onOpenDashboard?: () => void;
}

export function LoginScreen({ onOpenDashboard }: LoginScreenProps) {
  const { 
    user, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset,
    signInWithGoogle, 
    signOut, 
    isLoading 
  } = useAuth();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const router = useRouter();
  
  const [role, setRole] = useState<UserRole>('lecturer');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(cleanEmail, password, role);
        if (!res.success) {
          setSubmitting(false);
          if (res.unverified) {
            setVerificationEmail(res.email || cleanEmail);
          } else {
            setErrorMsg(res.error || 'Incorrect email or password.');
          }
        } else {
          setSubmitting(false);
          if (res.targetRoute) {
            router.replace(res.targetRoute);
          } else if (onOpenDashboard) {
            onOpenDashboard();
          }
        }
      } else {
        if (role === 'admin') {
          setSubmitting(false);
          setErrorMsg('Administrator registration is restricted. Please sign in with an authorized account.');
          return;
        }

        const res = await signUpWithEmail(fullName, cleanEmail, password, institution, role);
        setSubmitting(false);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        } else {
          setVerificationEmail(cleanEmail);
        }
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await signInWithGoogle(role);
      if (!res.success) {
        setSubmitting(false);
        setErrorMsg(res.error || 'Google authentication failed.');
      } else {
        setSubmitting(false);
        if (res.targetRoute) {
          router.replace(res.targetRoute);
        } else if (onOpenDashboard) {
          onOpenDashboard();
        }
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || 'Google sign-in error.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSuccessMsg('Signed out successfully.');
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendPasswordReset(cleanEmail);
      setSubmitting(false);
      if (res.success) {
        setResetEmailSent(true);
      } else {
        setErrorMsg(res.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || 'Failed to send password reset email.');
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto font-system">
      {/* Refined Schedula Glass Container - Consistent across modal and page */}
      <div className="relative rounded-3xl p-6 sm:p-7 glass-panel shadow-2xl transition-all">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <SchedulaLogo size="lg" isDark={isDark} />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {user 
              ? 'Account Overview' 
              : showForgotPassword 
              ? 'Reset Password' 
              : mode === 'signin' 
              ? 'Welcome back' 
              : 'Create account'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {user 
              ? 'Signed into Schedula Academic Console'
              : showForgotPassword
              ? 'Enter your email to receive recovery instructions'
              : 'Academic Timetable & Facility Scheduling'}
          </p>
        </div>

        {/* 1. Logged-in State */}
        {user ? (
          <div className="space-y-4 text-center py-1">
            <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 shadow-sm">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xl font-bold">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 mb-1">
                {user.role === 'admin' ? 'Administrator' : 'Faculty Member'}
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {user.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (user.role === 'lecturer') {
                    router.push('/lecturer');
                  } else if (onOpenDashboard) {
                    onOpenDashboard();
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                {user.role === 'lecturer' ? 'Open Lecturer Portal' : 'Open Administrator Dashboard'}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 px-4 rounded-xl border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* 2. Unauthenticated Flows */
          <div className="w-full space-y-3.5">
            {verificationEmail ? (
              /* Email Verification View */
              <div className="py-2 space-y-4 text-center">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Check your inbox
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed max-w-xs mx-auto">
                    We sent a verification link to <span className="font-semibold text-zinc-900 dark:text-white">{verificationEmail}</span>. Click the link to activate your account.
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationEmail(null);
                      setMode('signin');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : showForgotPassword ? (
              /* Forgot Password View */
              <div className="space-y-3.5 text-center">
                {resetEmailSent ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Reset link dispatched to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>. Please check your inbox.
                  </div>
                ) : (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-left">
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
                    {errorMsg && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span className="leading-snug">{errorMsg}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              /* Main Authentication View */
              <div className="space-y-3.5">
                
                {/* 1. Single-Container Role Selector */}
                <div className="p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('lecturer');
                      setErrorMsg(null);
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
                      setErrorMsg(null);
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

                {/* Alerts */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-snug flex-1">{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span className="leading-snug">{successMsg}</span>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={submitting || isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.24 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 12s.43 3.88 1.19 5.42l4.09-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
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
                <form onSubmit={handleEmailAuth} className="space-y-2.5">
                  {mode === 'signup' && (
                    <>
                      <div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Department / Faculty (Optional)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                        />
                      </div>
                    </>
                  )}

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

                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
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
                      disabled={submitting || isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {submitting || isLoading ? (
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

                {/* Bottom Toggle / Disclaimer */}
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
                          setErrorMsg(null);
                          setSuccessMsg(null);
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
                          setErrorMsg(null);
                          setSuccessMsg(null);
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

          </div>
        )}

      </div>
    </div>
  );
}
