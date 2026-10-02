'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { UserRole } from '@/context/AuthContext';
import { CanonicalAuthCard } from '@/components/CanonicalAuthCard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: UserRole;
  onAuthSuccess?: (targetRoute?: string) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  initialRole = 'lecturer',
  onAuthSuccess
}: AuthModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSuccess = (targetRoute?: string) => {
    if (onAuthSuccess) {
      onAuthSuccess(targetRoute);
    }
    if (targetRoute) {
      router.replace(targetRoute);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Close button at far right top corner of the window */}
        <button
          type="button"
          onClick={onClose}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full text-white/80 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-[420px] z-10"
        >
          {/* Canonical Auth Form Card */}
          <CanonicalAuthCard
            initialMode={initialMode}
            initialRole={initialRole}
            showHeaderLogo={false}
            onSuccess={handleSuccess}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
