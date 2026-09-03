'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Home, HelpCircle, Loader2, Sun, Moon } from 'lucide-react';
import { SchedulaLogo } from './SchedulaLogo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  onDashboardClick?: () => void;
  onFaqClick?: () => void;
  onHomeClick?: () => void;
  onOpenAuthModal?: (mode: 'signin' | 'signup') => void;
  isNavigatingDashboard?: boolean;
}

export function Navbar({
  onDashboardClick,
  onFaqClick,
  onHomeClick,
  onOpenAuthModal,
  isNavigatingDashboard = false,
}: NavbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'faq'>('overview');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const faqElem = document.getElementById('faq');
      if (faqElem) {
        const rect = faqElem.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) {
          setActiveTab('faq');
        } else if (window.scrollY < 300) {
          setActiveTab('overview');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    setActiveTab('overview');
    if (onHomeClick) onHomeClick();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFaqClick = () => {
    setActiveTab('faq');
    if (onFaqClick) onFaqClick();
    else scrollToSection('faq');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#070b14]/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 shadow-xs py-3'
            : 'bg-transparent py-4 sm:py-6'
        }`}
        id="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeClick();
                }}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-xl transition-transform hover:opacity-95 group"
                id="nav-brand-logo"
              >
                <SchedulaLogo size="md" textColor="text-slate-900 dark:text-white" isDark={true} />
              </a>
            </div>

            {/* Center: Centered Direct Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                type="button"
                onClick={handleHomeClick}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
                id="nav-home-link"
              >
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={handleFaqClick}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'faq'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
                id="nav-faq-link"
              >
                <span>FAQ</span>
              </button>
            </nav>

            {/* Right: Sign In / Get Started Buttons */}
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-black/5 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                id="nav-theme-toggle-btn"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Sign In Text Button (if not logged in) */}
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal('signin');
                    else if (onDashboardClick) onDashboardClick();
                  }}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-zinc-200 dark:hover:text-white transition-colors cursor-pointer"
                  id="nav-signin-text-btn"
                >
                  Sign In
                </button>
              )}

              {/* Action Pill Button */}
              <button
                type="button"
                disabled={isNavigatingDashboard}
                aria-busy={isNavigatingDashboard}
                onClick={() => {
                  if (user) {
                    if (onDashboardClick) onDashboardClick();
                  } else {
                    if (onOpenAuthModal) onOpenAuthModal('signup');
                    else if (onDashboardClick) onDashboardClick();
                  }
                }}
                className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold border border-slate-300/80 dark:border-white/20 bg-white/90 dark:bg-white/10 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-slate-900 dark:text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xs backdrop-blur-md disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[100px] flex items-center justify-center gap-1.5"
                id="nav-auth-cta-btn"
              >
                {isNavigatingDashboard && user ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{user ? 'Dashboard' : 'Sign up Free'}</span>
                )}
              </button>
            </div>

            {/* Mobile Navigation Trigger */}
            <div className="flex sm:hidden items-center gap-1.5">
              {/* Mobile Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-1.5 rounded-xl text-slate-800 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                id="mobile-nav-theme-toggle"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              <button
                type="button"
                disabled={isNavigatingDashboard}
                aria-busy={isNavigatingDashboard}
                onClick={() => {
                  if (user) {
                    if (onDashboardClick) onDashboardClick();
                  } else {
                    if (onOpenAuthModal) onOpenAuthModal('signin');
                    else if (onDashboardClick) onDashboardClick();
                  }
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-white/30 bg-white/80 dark:bg-white/10 text-slate-800 dark:text-white flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isNavigatingDashboard && user ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{user ? 'Dashboard' : 'Sign in'}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-1.5 rounded-xl text-slate-800 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                id="mobile-menu-toggle-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
          />
          <div className="fixed top-16 inset-x-4 z-50 sm:hidden bg-slate-900 dark:bg-[#0F1424] rounded-3xl p-5 shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white font-system">
            <div className="space-y-4">
              <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                <SchedulaLogo size="md" textColor="text-white" />
                <span className="text-xs text-white/60">Navigation</span>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
                >
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={handleFaqClick}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
                >
                  <span>FAQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleTheme()}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-left text-sm font-medium text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                    <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 capitalize">
                    {theme}
                  </span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isNavigatingDashboard}
                  aria-busy={isNavigatingDashboard}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (user) {
                      if (onDashboardClick) onDashboardClick();
                    } else {
                      if (onOpenAuthModal) onOpenAuthModal('signup');
                      else if (onDashboardClick) onDashboardClick();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-white/30 bg-white/10 hover:bg-white hover:text-slate-900 text-white text-sm font-medium shadow-xs transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isNavigatingDashboard && user ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>{user ? 'Dashboard' : 'Get Started'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
