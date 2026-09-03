'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  className?: string;
}

export function ScrollToTop({ className = '' }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Scroll detection across admin/lecturer main scroll containers and window
  useEffect(() => {
    const getMainElement = () => 
      document.getElementById('admin-main-content') || 
      document.getElementById('lecturer-main-content') || 
      document.querySelector('main');

    const toggleVisibility = () => {
      const winScroll = window.scrollY || 0;
      const mainEl = getMainElement();
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      if (winScroll > 150 || mainScroll > 150) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    const mainEl = getMainElement();
    if (mainEl) {
      mainEl.addEventListener('scroll', toggleVisibility, { passive: true });
    }
    
    // Periodic check in case view changes altered the main container
    const interval = setInterval(toggleVisibility, 500);
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (mainEl) {
        mainEl.removeEventListener('scroll', toggleVisibility);
      }
      clearInterval(interval);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    const mainEl = 
      document.getElementById('admin-main-content') || 
      document.getElementById('lecturer-main-content') || 
      document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`no-print select-none fixed z-30 transition-all duration-300 ease-out
        bottom-6 right-6 sm:bottom-8 sm:right-8 ${className}`}
    >
      <button
        type="button"
        id="floating-scroll-to-top-btn"
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className="
          group flex items-center justify-center
          w-11 h-11 sm:w-12 sm:h-12 rounded-full
          bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
          border border-slate-300/80 dark:border-white/20
          text-slate-800 dark:text-white
          shadow-xl shadow-slate-900/15 dark:shadow-black/50
          hover:bg-white dark:hover:bg-zinc-800
          hover:border-blue-500/60 dark:hover:border-blue-400/60
          hover:shadow-blue-500/20 dark:hover:shadow-blue-500/20
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          hover:scale-105 active:scale-95
          transition-transform duration-200 ease-out
          cursor-pointer
        "
        aria-label="Scroll back to top"
        title="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform duration-200 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
