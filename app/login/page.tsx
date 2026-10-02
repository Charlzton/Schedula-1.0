'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CanonicalAuthCard } from '@/components/CanonicalAuthCard';
import { HeroBackground } from '@/components/HeroBackground';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  useEffect(() => {
    if (!isLoading && user) {
      const target = user.role === 'lecturer' ? '/lecturer' : '/dashboard';
      router.replace(target);
    }
  }, [user, isLoading, router]);

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 font-system bg-[#F7F9FB] dark:bg-[#0A0B10]">
      <HeroBackground isDark={isDark} />
      <div className="relative z-10 w-full max-w-[420px]">
        <CanonicalAuthCard
          initialMode="signin"
          initialRole="lecturer"
          showHeaderLogo={false}
          onSuccess={(targetRoute) => {
            if (targetRoute) {
              router.replace(targetRoute);
            }
          }}
        />
      </div>
    </main>
  );
}
