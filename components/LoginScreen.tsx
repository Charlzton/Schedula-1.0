'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CanonicalAuthCard } from '@/components/CanonicalAuthCard';

interface LoginScreenProps {
  onClose?: () => void;
  onOpenDashboard?: () => void;
}

export function LoginScreen({ onOpenDashboard }: LoginScreenProps) {
  const router = useRouter();

  return (
    <CanonicalAuthCard
      initialMode="signin"
      initialRole="lecturer"
      showHeaderLogo={false}
      onSuccess={(targetRoute) => {
        if (targetRoute) {
          router.replace(targetRoute);
        } else if (onOpenDashboard) {
          onOpenDashboard();
        } else {
          router.replace('/dashboard');
        }
      }}
    />
  );
}
