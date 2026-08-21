'use client';

import React from 'react';

interface SchedulaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  textColor?: string;
  isDark?: boolean;
}

export function SchedulaLogo({
  className = '',
  size = 'md',
  showText = true,
  textColor,
  isDark = false
}: SchedulaLogoProps) {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    hero: 'w-7 h-7 sm:w-8 sm:h-8'
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-[17px] font-semibold',
    lg: 'text-xl font-bold',
    hero: 'text-xl sm:text-2xl font-bold'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Schedula Pure Vector Logo - No Background Rectangle/Box */}
      <svg
        className={`${iconSizes[size]} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="schedula-flow" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="60%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Dynamic Schedula Chrono Loop */}
        <path
          d="M8 12.5C8 9.46243 10.4624 7 13.5 7H22.5C25.5376 7 28 9.46243 28 12.5C28 15.5376 25.5376 18 22.5 18H13.5C10.4624 18 8 20.4624 8 23.5C8 26.5376 10.4624 29 13.5 29H22.5C25.5376 29 28 26.5376 28 23.5"
          stroke="url(#schedula-flow)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Schedule Time Nodes */}
        <circle cx="28" cy="12.5" r="2.8" fill="#06B6D4" />
        <circle cx="8" cy="23.5" r="2.8" fill="#2563EB" />
      </svg>

      {showText && (
        <span
          className={`font-system tracking-[-0.025em] ${textSizes[size]} ${
            textColor || 'text-[#111827] dark:text-[#F9FAFB]'
          }`}
        >
          Schedula
        </span>
      )}
    </div>
  );
}
