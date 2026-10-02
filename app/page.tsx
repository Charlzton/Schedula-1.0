'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { TechLogoRow } from '@/components/TechLogoRow';
import { FaqSection } from '@/components/FaqSection';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { LandingScrollToTop } from '@/components/LandingScrollToTop';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SchedulaApp() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [isNavigatingDashboard, setIsNavigatingDashboard] = useState(false);

  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');
      const loggedOut = params.get('loggedOut');
      const reason = params.get('reason');

      if (loggedOut === 'true') {
        setLogoutNotice(reason ? decodeURIComponent(reason) : 'You have been successfully signed out.');
        setTimeout(() => setLogoutNotice(null), 5000);
      }

      if (authParam === 'signin' || authParam === 'login') {
        setAuthModalMode('signin');
        setAuthModalOpen(true);
      } else if (authParam === 'signup' || authParam === 'register') {
        setAuthModalMode('signup');
        setAuthModalOpen(true);
      }
    }
  }, []);

  const handleOpenDashboard = () => {
    if (isNavigatingDashboard) return;
    if (user) {
      setIsNavigatingDashboard(true);
      if (user.role === 'lecturer') {
        router.push('/lecturer');
      } else {
        router.push('/dashboard');
      }
    } else {
      setAuthModalMode('signin');
      setAuthModalOpen(true);
    }
  };

  const handleOpenAuthModal = (mode: 'signin' | 'signup' = 'signup') => {
    if (isNavigatingDashboard) return;
    if (user) {
      setIsNavigatingDashboard(true);
      if (user.role === 'lecturer') {
        router.push('/lecturer');
      } else {
        router.push('/dashboard');
      }
    } else {
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    }
  };

  const handleScrollToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToFaq = () => {
    const faqElement = document.getElementById('faq');
    if (faqElement) {
      faqElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FB] dark:bg-[#0A0B10] text-[#111827] dark:text-[#F9FAFB] font-system selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 relative transition-colors duration-120">
      {/* Schedula Top Navigation Bar */}
      <Navbar
        onDashboardClick={handleOpenDashboard}
        onFaqClick={handleScrollToFaq}
        onHomeClick={handleScrollToHome}
        onOpenAuthModal={handleOpenAuthModal}
        isNavigatingDashboard={isNavigatingDashboard}
      />

      {/* Floating Logout / Notification Toast */}
      {logoutNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="px-4 py-2.5 rounded-2xl glass-panel shadow-xl border border-zinc-200/80 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{logoutNotice}</span>
          </div>
        </div>
      )}

      {/* Main Content: Hero Section & FAQs */}
      <main className="flex-1 flex flex-col justify-center relative">
        <HeroSection
          onOpenDashboard={handleOpenDashboard}
          onOpenAuthModal={handleOpenAuthModal}
          isNavigatingDashboard={isNavigatingDashboard}
        />

        {/* Technology & Framework Logos Row */}
        <TechLogoRow isDark={isDark} />

        {/* FAQs Section */}
        <FaqSection />
      </main>

      {/* Footer with Copyright */}
      <Footer />

      {/* Smooth Quick-Access Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={(targetRoute) => {
          if (targetRoute) {
            router.replace(targetRoute);
          }
        }}
      />

      {/* Landing Page Back To Top Floating Action */}
      <LandingScrollToTop />
    </div>
  );
}
