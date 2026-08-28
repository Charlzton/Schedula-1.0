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
import { SignInSuccessNotification } from '@/components/SignInSuccessNotification';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SchedulaApp() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [showSignInSuccess, setShowSignInSuccess] = useState(false);
  const [isNavigatingDashboard, setIsNavigatingDashboard] = useState(false);

  useEffect(() => {
    // Check if user just signed in from another view/redirect
    if (typeof window !== 'undefined') {
      const justSignedIn = sessionStorage.getItem('schedula_sign_in_success');
      if (justSignedIn === 'true') {
        sessionStorage.removeItem('schedula_sign_in_success');
        setShowSignInSuccess(true);
      }
    }
  }, []);

  const handleOpenDashboard = () => {
    if (isNavigatingDashboard) return;
    if (user) {
      setIsNavigatingDashboard(true);
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleOpenAuthModal = (mode: 'signin' | 'signup' = 'signup') => {
    if (isNavigatingDashboard) return;
    if (user) {
      setIsNavigatingDashboard(true);
      router.push('/dashboard');
    } else {
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowSignInSuccess(true);
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
    <div className="min-h-screen flex flex-col bg-[#F7F9FB] dark:bg-[#0A0B10] text-[#111827] dark:text-[#F9FAFB] font-system selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 relative transition-colors duration-300">
      {/* Sign-in Success Dropdown Glassmorphism Notification */}
      <SignInSuccessNotification
        show={showSignInSuccess}
        onClose={() => setShowSignInSuccess(false)}
      />

      {/* Schedula Top Navigation Bar */}
      <Navbar
        onDashboardClick={handleOpenDashboard}
        onFaqClick={handleScrollToFaq}
        onHomeClick={handleScrollToHome}
        onOpenAuthModal={handleOpenAuthModal}
        isNavigatingDashboard={isNavigatingDashboard}
      />

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
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Landing Page Back To Top Floating Action */}
      <LandingScrollToTop />
    </div>
  );
}
