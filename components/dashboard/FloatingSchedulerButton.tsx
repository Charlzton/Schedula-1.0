'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { useTheme } from '@/context/ThemeContext';

export function FloatingSchedulerButton() {
  const { activeView, setActiveView } = useTimetable();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const isActive = activeView === 'generate';
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    setActiveView('generate');
  };

  return (
    <div
      className="no-print select-none fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out"
    >
      {/* Tooltip on Hover */}
      <div
        role="tooltip"
        className={`absolute bottom-full right-0 mb-3 pointer-events-none transition-all duration-200 transform ${
          isHovered
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
        }`}
      >
        <div className="px-3 py-1.5 rounded-xl bg-zinc-900/95 dark:bg-black/95 text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-2xl backdrop-blur-xl border border-white/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span>Intelligent Schedule Optimization</span>
        </div>
      </div>

      {/* Pure Translucent Circular Floating Action Control */}
      <button
        id="floating-scheduler-btn"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label="Open AI timetable optimization"
        title="Open AI Timetable Optimization"
        className={`
          relative group flex items-center justify-center
          w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full aspect-square
          focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2
          animate-subtle-float cursor-pointer
          ${
            isDark
              ? 'bg-zinc-950/80 backdrop-blur-xl border border-white/15 shadow-xl shadow-black/40 hover:bg-zinc-900/90 hover:border-white/30 hover:shadow-cyan-500/20'
              : 'bg-white/85 backdrop-blur-xl border border-white/40 shadow-lg shadow-cyan-500/15 hover:bg-white hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/25'
          }
          ${isActive ? 'ring-2 ring-cyan-400/80 ring-offset-2 dark:ring-offset-zinc-950 scale-110 shadow-2xl' : 'hover:scale-105 active:scale-95'}
          transition-all duration-200 ease-out
        `}
      >
        {/* Subtle Ambient Hover/Active Aura */}
        <div
          className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xs pointer-events-none bg-gradient-to-tr from-cyan-400/25 via-blue-400/15 to-purple-500/25"
        />

        {/* AI Vector Artwork with Living Letter Typing & Independent Sparkle Shimmer */}
        <div className="relative w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 flex items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-xs"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Light mode gradient with userSpaceOnUse so 1D strokes (like 'I') render with full vibrant contrast */}
              <linearGradient id="aiVectorLightGrad" gradientUnits="userSpaceOnUse" x1="14" y1="24" x2="82" y2="78">
                <stop offset="0%" stopColor="#00B4D8" />
                <stop offset="25%" stopColor="#0284C7" />
                <stop offset="55%" stopColor="#4F46E5" />
                <stop offset="85%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>

              {/* Sparkles gradient with userSpaceOnUse */}
              <linearGradient id="aiStarsLightGrad" gradientUnits="userSpaceOnUse" x1="55" y1="10" x2="90" y2="45">
                <stop offset="0%" stopColor="#00B4D8" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8A2BE2" />
              </linearGradient>
            </defs>

            {/* Rounded Squarish Outer Frame with Open Top-Right Aperture */}
            <path
              d="M 52 24 L 28 24 C 20.268 24 14 30.268 14 38 L 14 66 C 14 73.732 20.268 80 28 80 L 66 80 C 73.732 80 80 73.732 80 66 L 80 48"
              stroke={isDark ? '#FFFFFF' : 'url(#aiVectorLightGrad)'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Sparkle 1: Large Main Star (Gently rotates and breathes) */}
            <path
              className="animate-ai-sparkle-1"
              d="M 68 15 Q 68 26 79 26 Q 68 26 68 37 Q 68 26 57 26 Q 68 26 68 15 Z"
              fill={isDark ? '#FFFFFF' : 'url(#aiStarsLightGrad)'}
            />

            {/* Sparkle 2: Small Upper-Right Star (Independent twinkle & fade) */}
            <path
              className="animate-ai-sparkle-2"
              d="M 79 8 Q 79 13 84 13 Q 79 13 79 18 Q 79 13 74 13 Q 79 13 79 8 Z"
              fill={isDark ? '#FFFFFF' : 'url(#aiStarsLightGrad)'}
            />

            {/* Sparkle 3: Medium Mid-Right Star (Subtle float & pulse) */}
            <path
              className="animate-ai-sparkle-3"
              d="M 81 29 Q 81 35 87 35 Q 81 35 81 41 Q 81 35 75 35 Q 81 35 81 29 Z"
              fill={isDark ? '#FFFFFF' : 'url(#aiStarsLightGrad)'}
            />

            {/* Animated 'A' Letter: Autonomous Progressive Typing/Drawing Reveal Loop */}
            <path
              className="animate-ai-letter-a"
              d="M 25 66 L 36.5 35 L 48 66 M 29.5 56 L 43.5 56"
              stroke={isDark ? '#FFFFFF' : 'url(#aiVectorLightGrad)'}
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Animated 'I' Letter: Autonomous Sequential Typing/Drawing Reveal */}
            <path
              className="animate-ai-letter-i"
              d="M 59 35 L 59 66"
              stroke={isDark ? '#FFFFFF' : 'url(#aiVectorLightGrad)'}
              strokeWidth="6.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Active Console Status Dot */}
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border border-white dark:border-zinc-950" />
          </span>
        )}
      </button>
    </div>
  );
}
