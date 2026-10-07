'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';

export interface CanonicalAuthCardProps {
  initialMode?: 'signin' | 'signup';
  initialRole?: UserRole;
  onSuccess?: (targetRoute?: string) => void;
  showHeaderLogo?: boolean;
}

export function CanonicalAuthCard({
  initialMode = 'signin',
  initialRole = 'lecturer',
  onSuccess
}: CanonicalAuthCardProps) {
  const router = useRouter();
  const {
    signInWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    verifyLecturerEmail,
    activateLecturerAccount,
    user,
    isLoading: authLoading
  } = useAuth();

  const [role, setRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [activationStep, setActivationStep] = useState<'email' | 'password'>('email');

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility controls
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Verified lecturer details (Step 1 -> Step 2)
  const [verifiedLecturer, setVerifiedLecturer] = useState<{
    lecturerId: string;
    fullName: string;
    department?: string;
    email: string;
  } | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [creating, setCreating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const hasRedirectedRef = useRef(false);

  // Auto-redirect if user is already authenticated on initial mount
  useEffect(() => {
    if (user && !authLoading && !loading && !googleLoading && !verifying && !creating && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const target = user.role === 'lecturer' ? '/lecturer' : '/dashboard';
      if (onSuccess) {
        onSuccess(target);
      }
      router.replace(target);
    }
  }, [user, authLoading, loading, googleLoading, verifying, creating, router, onSuccess]);

  // Sync mode and initial role when props change
  useEffect(() => {
    setMode(initialMode);
    setRole(initialRole);
    setActivationStep('email');
    setError(null);
    setSuccess(null);
  }, [initialMode, initialRole]);

  // Reset steps when toggling mode or role
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setError(null);
    setSuccess(null);
    if (newRole === 'admin') {
      setMode('signin');
      setActivationStep('email');
    }
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setActivationStep('email');
    setError(null);
    setSuccess(null);
  };

  // Google Sign In (for Sign In mode)
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        const target = res.targetRoute || (user?.role === 'lecturer' ? '/lecturer' : '/dashboard');
        hasRedirectedRef.current = true;
        if (onSuccess) {
          onSuccess(target);
        }
        router.replace(target);
        return;
      } else {
        setError(res.error || 'Failed to sign in with Google');
        setGoogleLoading(false);
      }
    } catch {
      setError('An unexpected error occurred during Google sign in');
      setGoogleLoading(false);
    }
  };

  // Step 1: Lecturer Email Verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setVerifying(true);
    const startTime = Date.now();
    try {
      const res = await verifyLecturerEmail(cleanEmail);
      const elapsed = Date.now() - startTime;
      if (elapsed < 650) {
        await new Promise((r) => setTimeout(r, 650 - elapsed));
      }
      if (res.success && res.verified) {
        setVerifiedLecturer({
          lecturerId: res.lecturerId || '',
          fullName: res.fullName || 'Faculty Member',
          department: res.department,
          email: cleanEmail
        });
        setActivationStep('password');
      } else {
        setError(res.error || 'Email not found in the faculty directory.');
      }
    } catch {
      setError('Unable to verify email address. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Lecturer Create Password & Activate Account
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setCreating(true);
    const startTime = Date.now();
    try {
      const targetEmail = verifiedLecturer?.email || email.trim().toLowerCase();
      const targetLecturerId = verifiedLecturer?.lecturerId;

      const res = await activateLecturerAccount(targetEmail, newPassword, targetLecturerId);
      const elapsed = Date.now() - startTime;
      if (elapsed < 700) {
        await new Promise((r) => setTimeout(r, 700 - elapsed));
      }
      if (res.success) {
        const target = res.targetRoute || '/lecturer';
        hasRedirectedRef.current = true;
        if (onSuccess) {
          onSuccess(target);
        }
        router.replace(target);
        return;
      } else {
        setError(res.error || 'Failed to activate account. Please try again.');
        setCreating(false);
      }
    } catch {
      setError('An unexpected error occurred during account activation. Please try again.');
      setCreating(false);
    }
  };

  // Sign In submit (Existing active lecturers or Administrators)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    try {
      const res = await signInWithEmail(cleanEmail, password, role);
      if (res.success) {
        // Ensure user perceives the smooth loading state and sequential dot animation
        const elapsed = Date.now() - startTime;
        if (elapsed < 750) {
          await new Promise((resolve) => setTimeout(resolve, 750 - elapsed));
        }

        const target = res.targetRoute || (user?.role === 'lecturer' ? '/lecturer' : '/dashboard');
        hasRedirectedRef.current = true;
        if (onSuccess) {
          onSuccess(target);
        }
        router.replace(target);
        return;
      } else {
        setError(res.error || 'Incorrect email or password');
        setLoading(false);
      }
    } catch {
      setError('Authentication failed. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  // Forgot password submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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
      setError('Failed to dispatch password reset link');
    } finally {
      setLoading(false);
    }
  };

  // Resolve Header Title
  const getHeaderTitle = () => {
    if (showForgotPassword) return 'Reset Password';
    if (mode === 'signin') return 'Welcome back';
    if (role === 'lecturer') {
      return activationStep === 'password' ? 'Create Password' : 'Verify Email';
    }
    return 'Create account';
  };

  return (
    <div className="w-full max-w-[420px] mx-auto font-system">
      <div className="relative w-full rounded-3xl p-6 sm:p-7 glass-panel shadow-2xl transition-all">
        {/* Header Title (Clean, no Schedula branding per specifications) */}
        <div className="text-center mb-5 flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {getHeaderTitle()}
          </h2>
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
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center disabled:opacity-75 cursor-pointer"
                >
                  <LoadingButtonContent
                    loading={loading}
                    loadingText="Sending link"
                    defaultText="Send Reset Link"
                  />
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
          /* Main Authentication Container */
          <div className="space-y-3.5">
            {/* Role Selector: Lecturer | Admin */}
            <div className="p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center">
              <button
                type="button"
                onClick={() => handleRoleChange('lecturer')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  role === 'lecturer'
                    ? 'bg-white dark:bg-[#1E202C] text-zinc-900 dark:text-white shadow-xs border border-black/5 dark:border-white/10'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Lecturer
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  role === 'admin'
                    ? 'bg-white dark:bg-[#1E202C] text-zinc-900 dark:text-white shadow-xs border border-black/5 dark:border-white/10'
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

            {/* FLOW A: Lecturer Account Activation (Step 1: Verify Email) */}
            {role === 'lecturer' && mode === 'signup' && activationStep === 'email' && (
              <form onSubmit={handleVerifyEmail} className="space-y-2.5">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    disabled={verifying}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-75 cursor-pointer flex items-center justify-center select-none"
                  >
                    <LoadingButtonContent
                      loading={verifying}
                      loadingText="Verifying"
                      defaultText="Verify"
                    />
                  </button>
                </div>
              </form>
            )}

            {/* FLOW B: Lecturer Account Activation (Step 2: Create Password) */}
            {role === 'lecturer' && mode === 'signup' && activationStep === 'password' && (
              <form onSubmit={handleCreatePassword} className="space-y-2.5">
                {/* New Password Field */}
                <div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      disabled={creating}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      disabled={creating}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-75 cursor-pointer flex items-center justify-center select-none"
                  >
                    <LoadingButtonContent
                      loading={creating}
                      loadingText="Creating"
                      defaultText="Create"
                    />
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActivationStep('email');
                      setError(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}

            {/* FLOW C: Sign In Mode (Lecturer or Administrator) */}
            {mode === 'signin' && (
              <>
                {/* Google Sign In - Exclusively for Admin / Super Admin */}
                {role !== 'lecturer' && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || loading}
                      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-75 select-none"
                    >
                      <LoadingButtonContent
                        loading={googleLoading}
                        loadingText="Connecting"
                        defaultText={
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.24 24 12 24z"/>
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 12s.43 3.88 1.19 5.42l4.09-3.15z"/>
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                            </svg>
                            <span>Continue with Google</span>
                          </span>
                        }
                      />
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center py-0.5">
                      <div className="flex-grow border-t border-zinc-200 dark:border-white/10" />
                      <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                        or
                      </span>
                      <div className="flex-grow border-t border-zinc-200 dark:border-white/10" />
                    </div>
                  </>
                )}

                {/* Email / Password Sign In Form */}
                <form onSubmit={handleSignIn} className="space-y-2.5">
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

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium hover:underline cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      aria-label={loading ? 'Signing in' : 'Sign In'}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-80 cursor-pointer flex items-center justify-center select-none"
                    >
                      <LoadingButtonContent
                        loading={loading}
                        loadingText="Signing in"
                        defaultText="Sign In"
                      />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Bottom Toggle / Portal Information */}
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
                    onClick={() => handleModeChange('signup')}
                    className="text-zinc-900 dark:text-white font-semibold hover:underline cursor-pointer ml-0.5"
                  >
                    Activate account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
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
    </div>
  );
}
