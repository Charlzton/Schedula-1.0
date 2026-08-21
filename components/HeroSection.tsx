'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { HeroBackground } from '@/components/HeroBackground';

interface HeroSectionProps {
  onOpenDashboard?: () => void;
  onOpenAuthModal?: (mode: 'signin' | 'signup') => void;
}

export function HeroSection({
  onOpenDashboard,
  onOpenAuthModal,
}: HeroSectionProps) {
  const { user } = useAuth();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  const handleCtaClick = () => {
    if (user) {
      if (onOpenDashboard) onOpenDashboard();
    } else {
      if (onOpenAuthModal) onOpenAuthModal('signup');
      else if (onOpenDashboard) onOpenDashboard();
    }
  };

  return (
    <div className="relative w-full overflow-hidden font-system">
      {/* ========================================================================= */}
      {/* 1. HERO CONTAINER WITH ANIMATED BACKGROUND & FLOATING TECH LOGO BUBBLES    */}
      {/* ========================================================================= */}
      <section
        id="schedula-hero-section"
        className="relative w-full rounded-b-[40px] sm:rounded-b-[56px] lg:rounded-b-[72px] pt-32 sm:pt-36 md:pt-40 pb-20 sm:pb-24 lg:pb-28 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white select-none overflow-hidden transition-colors duration-700"
      >
        {/* Animated SaaS Motion Background */}
        <HeroBackground isDark={isDark} />

        {/* ======================================================================= */}
        {/* HERO MAIN COPY & CALL TO ACTION                                         */}
        {/* ======================================================================= */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Main Display Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[62px] font-bold tracking-[-0.03em] text-slate-900 dark:text-white leading-[1.12] sm:leading-[1.08] max-w-3xl">
              Automate Your Academic Timetable With{' '}
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                Zero-Clash Precision
              </span>
            </h1>
          </motion.div>

          {/* Short Supporting Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3.5 sm:mt-4 max-w-xl mx-auto"
          >
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-600 dark:text-blue-100/85 font-normal leading-relaxed">
              Automated clash-free academic timetable scheduling and lecture hall allocation for universities.
            </p>
          </motion.div>

          {/* Hero CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 sm:mt-8 flex items-center justify-center"
          >
            <button
              type="button"
              onClick={handleCtaClick}
              className="px-8 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-xl shadow-slate-900/15 dark:shadow-white/10 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center"
              id="hero-primary-coral-cta"
            >
              <span>{user ? 'Go to Schedula Console' : 'Get Started'}</span>
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
