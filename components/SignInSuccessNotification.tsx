'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface SignInSuccessNotificationProps {
  show: boolean;
  onClose: () => void;
  message?: string;
  duration?: number;
}

export function SignInSuccessNotification({
  show,
  onClose,
  message = 'Sign in completed successfully',
  duration = 2800,
}: SignInSuccessNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed top-5 sm:top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{
              duration: 0.32,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pointer-events-auto flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-white/85 dark:bg-[#0F1424]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white shadow-xl shadow-slate-900/10 dark:shadow-black/40 max-w-[92vw] sm:max-w-md"
            id="signin-success-notification"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap select-none">
              {message}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
