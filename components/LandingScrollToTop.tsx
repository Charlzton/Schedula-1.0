'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

export function LandingScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 180) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 no-print select-none animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        id="landing-scroll-to-top-btn"
        onClick={scrollToTop}
        className="
          group flex items-center justify-center
          w-12 h-12 sm:w-13 sm:h-13 rounded-full
          bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl
          border border-slate-300/80 dark:border-white/20
          text-slate-800 dark:text-white
          shadow-xl shadow-slate-900/15 dark:shadow-black/50
          hover:bg-white dark:hover:bg-zinc-800
          hover:border-blue-500/60 dark:hover:border-blue-400/60
          hover:shadow-blue-500/20 dark:hover:shadow-blue-500/20
          hover:scale-105 active:scale-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          transition-all duration-200 ease-out cursor-pointer
        "
        aria-label="Scroll to top of page"
        title="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform duration-200 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
