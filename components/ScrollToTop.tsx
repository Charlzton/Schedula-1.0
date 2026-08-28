'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  className?: string;
}

export function ScrollToTop({ className = '' }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Scroll detection across both admin main scroll container and window
  useEffect(() => {
    const getMainElement = () => document.getElementById('admin-main-content') || document.querySelector('main');

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
    const mainEl = document.getElementById('admin-main-content') || document.querySelector('main');
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
      className={`no-print select-none fixed z-45 transition-all duration-300 ease-out
        bottom-20 right-6 
        lg:bottom-8 lg:left-[104px] lg:right-auto ${className}`}
    >
      {/* Tooltip on Hover */}
      <div
        role="tooltip"
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none transition-all duration-200 transform ${
          isHovered
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 dark:bg-black/90 text-white text-[11px] font-medium whitespace-nowrap shadow-xl backdrop-blur-md border border-white/10 flex items-center gap-1.5">
          <ArrowUp className="w-3 h-3 text-blue-400" />
          <span>Scroll to top</span>
        </div>
      </div>

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
