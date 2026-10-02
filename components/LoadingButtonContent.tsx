'use client';

import React, { useState, useEffect } from 'react';

/**
 * Animated three dots cycling in sequence:
 * 1st dot -> 2nd dot -> 3rd dot -> 1st dot -> 2nd dot...
 * Rendered with opacity transitions on fixed spans so button width never jitters.
 */
export function LoadingDots() {
  const [dotPhase, setDotPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotPhase((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
    }, 320);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex tracking-wider text-left pl-0.5" aria-hidden="true">
      <span
        className={`inline-block transition-opacity duration-150 ${
          dotPhase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        .
      </span>
      <span
        className={`inline-block transition-opacity duration-150 ${
          dotPhase >= 2 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        .
      </span>
      <span
        className={`inline-block transition-opacity duration-150 ${
          dotPhase >= 3 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        .
      </span>
    </span>
  );
}

/**
 * Circular spinner on the left side of the button moving around smoothly.
 */
export function LoadingSpinner({
  className = 'h-4 w-4 text-current'
}: {
  className?: string;
}) {
  return (
    <svg
      className={`animate-spin shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-95"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface LoadingButtonContentProps {
  loading: boolean;
  loadingText: string;
  defaultText?: React.ReactNode;
  icon?: React.ReactNode;
  spinnerSize?: string;
}

/**
 * Consistent button content handler that renders either the default button text/icon
 * or the active loading state with moving circle on the left + sequential 3 dots.
 */
export function LoadingButtonContent({
  loading,
  loadingText,
  defaultText,
  icon,
  spinnerSize = 'h-4 w-4'
}: LoadingButtonContentProps) {
  if (!loading) {
    return (
      <span className="inline-flex items-center justify-center gap-2">
        {icon}
        {defaultText}
      </span>
    );
  }

  const cleanText = loadingText.replace(/\.+$/, '');

  return (
    <span className="inline-flex items-center justify-center gap-2 select-none">
      <LoadingSpinner className={`${spinnerSize} text-current`} />
      <span className="inline-flex items-center">
        <span>{cleanText}</span>
        <LoadingDots />
      </span>
    </span>
  );
}
