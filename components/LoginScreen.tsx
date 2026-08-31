'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SchedulaLogo } from '@/components/SchedulaLogo';

interface LoginScreenProps {
  onClose: () => void;
  onOpenDashboard?: () => void;
}

export function LoginScreen({ onClose, onOpenDashboard }: LoginScreenProps) {
  const { 
    user, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset,
    signInWithGoogle, 
    signOut, 
    isLoading 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      setErrorCode('auth/missing-email');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      setErrorCode('auth/missing-password');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(cleanEmail, password);
        if (!res.success) {
          setSubmitting(false);
          setErrorCode(res.code || null);
          if (res.unverified) {
            setVerificationEmail(res.email || cleanEmail);
          } else {
            setErrorMsg(res.error || 'Incorrect email or password. Please try again.');
          }
        } else {
          if (onOpenDashboard) {
            onOpenDashboard();
          }
        }
      } else {
        const res = await signUpWithEmail(fullName, cleanEmail, password, institution);
        setSubmitting(false);
        if (!res.success) {
          setErrorCode(res.code || null);
          setErrorMsg(res.error || 'Failed to create account. Please try again.');
        } else {
          setVerificationEmail(cleanEmail);
        }
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || 'An unexpected error occurred. Please try again.');
      setErrorCode(err?.code || null);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setSubmitting(false);
        setErrorMsg(res.error || 'Google authentication failed.');
        setErrorCode(res.code || null);
      } else {
        if (onOpenDashboard) {
          onOpenDashboard();
        }
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || 'Google login error. Please try again.');
      setErrorCode(err?.code || null);
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
    setErrorCode(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address first.');
      return;
    }
    setSubmitting(true);
    const res = await sendPasswordReset(cleanEmail);
    setSubmitting(false);
    if (res.success) {
      setResetEmailSent(true);
    } else {
      setErrorMsg(res.error || 'Failed to send password reset email.');
      setErrorCode(res.code || null);
    }
  };

  return (
    <div 
      className="relative w-full flex items-center justify-center p-2 sm:p-4 text-[#111827] dark:text-[#F9FAFB] font-system"
      id="schedula-login-container"
    >
      {/* Top Floating Controls: Theme Toggle & Close Button */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-white/90 dark:bg-[#1A1A22]/90 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white shadow-md border border-gray-200/80 dark:border-gray-800 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
          id="login-theme-toggle-btn"
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
          className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-white/90 dark:bg-[#1A1A22]/90 backdrop-blur text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white shadow-md border border-gray-200/80 dark:border-gray-800 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label="Close modal"
          id="login-close-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Master Card Container */}
      <div 
        className="relative w-full max-w-[500px] glass-modal p-6 sm:p-8 my-auto overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 rounded-3xl"
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* Schedula Brand Logo & Title */}
          <div className="text-center flex flex-col items-center justify-center space-y-2">
            <SchedulaLogo size="lg" isDark={true} />
          </div>

          {/* Schedula Authentication Form with Refined Typographic Scale */}
          <div className="w-full space-y-5">

            {verificationEmail ? (
              /* Email Verification Screen */
              <div className="py-2 space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    Verify your email
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed max-w-sm mx-auto">
                    We sent a verification link to <span className="font-semibold text-zinc-900 dark:text-white">{verificationEmail}</span>. Please click the link in your inbox to activate your account.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationEmail(null);
                      setMode('signin');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : showForgotPassword ? (
              /* Forgot Password Screen */
              <div className="space-y-5 text-center">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Reset Password
                  </h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed">
                    Enter your email address and we&apos;ll send you instructions to reset your password.
                  </p>
                </div>

                {resetEmailSent ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Reset link dispatched to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>. Please check your inbox.
                  </div>
                ) : (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
                    <div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span className="leading-snug">{errorMsg}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
                    </button>
                  </form>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                      setErrorMsg(null);
                    }}
                    className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* PRIMARY AUTH FORM */
              <div className="space-y-5">
                
                <div className="text-center space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                  </h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 font-normal">
                    {mode === 'signin' 
                      ? 'Please enter your login details below'
                      : 'Please enter your details below to register'}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      <span className="leading-snug flex-1">{errorMsg}</span>
                    </div>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="leading-snug">{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-3.5">
                  {mode === 'signup' && (
                    <>
                      <div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Institution / Faculty (Optional)"
                          className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <input
                      type="email"
                      required
                      disabled={submitting || isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={submitting || isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={submitting || isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {mode === 'signin' && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium hover:underline cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submitting || isLoading}
                      className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {submitting || isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                        </>
                      ) : (
                        <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      )}
                    </button>
                  </div>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-200 dark:border-white/10"></div>
                  <span className="flex-shrink mx-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-zinc-200 dark:border-white/10"></div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={submitting || isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-white dark:hover:bg-white/10 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.24 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 12s.43 3.88 1.19 5.42l4.09-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div className="pt-1 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  {mode === 'signin' ? (
                    <p>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-zinc-900 dark:text-white font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Sign up
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
                        className="text-zinc-900 dark:text-white font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
