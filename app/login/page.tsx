'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, X } from 'lucide-react';
import { LoginScreen } from '@/components/LoginScreen';
import { HeroBackground } from '@/components/HeroBackground';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto font-system">
      <HeroBackground isDark={isDark} />
      
      {/* Top-Right Page Shell Controls (Theme Toggle & Close/Back) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
          id="login-page-theme-toggle"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Return to home"
          title="Return to home"
          className="p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
          id="login-page-close-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Centered Login Card Container */}
      <div className="relative z-10 w-full max-w-md my-auto py-8">
        <LoginScreen
          onClose={() => router.push('/')}
          onOpenDashboard={() => router.replace('/dashboard')}
        />
      </div>
    </main>
  );
}
