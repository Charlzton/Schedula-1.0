'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/LoginScreen';
import { HeroBackground } from '@/components/HeroBackground';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <HeroBackground isDark={true} />
      
      <div className="relative z-10 w-full max-w-md">
        <LoginScreen
          onClose={() => {
            router.push('/');
          }}
          onOpenDashboard={() => {
            router.replace('/dashboard');
          }}
        />
      </div>
    </main>
  );
}


