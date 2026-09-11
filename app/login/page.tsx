'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { HeroBackground } from '@/components/HeroBackground';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  useEffect(() => {
    // Schedula uses one canonical public entry point on the landing page
    router.replace('/?auth=signin');
  }, [router]);

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 font-system">
      <HeroBackground isDark={isDark} />
      <div className="relative z-10 flex items-center gap-3 px-5 py-3 rounded-2xl glass-panel text-xs font-semibold text-zinc-900 dark:text-white">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span>Redirecting to Schedula entry point...</span>
      </div>
    </main>
  );
}
