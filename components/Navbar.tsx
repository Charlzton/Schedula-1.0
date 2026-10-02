'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Loader2, Sun, Moon } from 'lucide-react';
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

            {/* Center: Desktop Navigation Tabs */}
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

            {/* Right Desktop Controls (Theme Toggle & Sign In) */}
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

              {/* Desktop Sign In / Dashboard Button */}
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
                className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold border border-slate-300/80 dark:border-white/20 bg-white/90 dark:bg-white/10 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-slate-900 dark:text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xs backdrop-blur-md disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[100px] flex items-center justify-center gap-1.5"
                id="nav-signin-btn"
              >
                {isNavigatingDashboard && user ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{user ? 'Dashboard' : 'Sign In'}</span>
                )}
              </button>
            </div>

            {/* Mobile Navigation Controls (Theme Toggle & Hamburger ONLY) */}
            <div className="flex sm:hidden items-center gap-1.5">
              {/* Mobile Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl text-slate-800 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                id="mobile-nav-theme-toggle"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-slate-700" />
                )}
              </button>

              {/* Hamburger Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                className="p-2 rounded-xl text-slate-800 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                id="mobile-menu-toggle-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Hamburger Navigation Menu (Contains EXACTLY: Overview, FAQ, Sign In) */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
            aria-hidden="true"
          />
          <div className="fixed top-16 right-4 left-4 z-50 sm:hidden max-w-xs ml-auto bg-white/95 dark:bg-[#0f1424]/95 rounded-2xl p-2 shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white backdrop-blur-xl">
            <div className="flex flex-col gap-1">
              {/* 1. Overview */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleHomeClick();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Overview
              </button>

              {/* 2. FAQ */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleFaqClick();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                FAQ
              </button>

              {/* 3. Sign In / Dashboard */}
              <button
                type="button"
                disabled={isNavigatingDashboard}
                aria-busy={isNavigatingDashboard}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (user) {
                    if (onDashboardClick) onDashboardClick();
                  } else {
                    if (onOpenAuthModal) onOpenAuthModal('signin');
                    else if (onDashboardClick) onDashboardClick();
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer disabled:opacity-75 flex items-center justify-between"
              >
                {isNavigatingDashboard && user ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Loading...</span>
                  </span>
                ) : (
                  <span>{user ? 'Dashboard' : 'Sign In'}</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
