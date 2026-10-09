'use client';

import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useTour } from '@/context/TourContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Compass 
} from 'lucide-react';

interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export function OnboardingTour() {
  const { 
    isActive, 
    forceSidebarExpand,
    currentStep, 
    currentStepIndex, 
    totalSteps, 
    nextStep, 
    prevStep, 
    skipTour, 
    finishTour 
  } = useTour();

  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  const [spotlightRect, setSpotlightRect] = useState<RectBounds | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTargetFound, setIsTargetFound] = useState<boolean>(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Smart target element selector that filters out hidden/zero-size duplicate elements
  const findTargetElement = useCallback((selector: string): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (elements.length === 0) return null;
    if (elements.length === 1) return elements[0];

    // When multiple elements share the selector (e.g. mobile drawer vs desktop sidebar), pick the visible one
    const visible = elements.find((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    return visible || elements[0];
  }, []);

  // Calculate and update spotlight and tooltip coordinates
  const updatePositions = useCallback(() => {
    if (!isActive || !currentStep) return;

    const targetEl = findTargetElement(currentStep.targetSelector);

    if (!targetEl) {
      setIsTargetFound(false);
      // Center fallback position
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tw = Math.min(380, vw - 32);
      const th = tooltipRef.current?.offsetHeight || 190;
      setSpotlightRect(null);
      setTooltipPos({
        x: Math.round((vw - tw) / 2),
        y: Math.round((vh - th) / 2)
      });
      return;
    }

    setIsTargetFound(true);

    const rect = targetEl.getBoundingClientRect();
    const padding = currentStep.padding ?? 8;
    const radius = currentStep.radius ?? 14;

    const spotX = Math.max(0, rect.left - padding);
    const spotY = Math.max(0, rect.top - padding);
    const spotW = rect.width + padding * 2;
    const spotH = rect.height + padding * 2;

    const updatedSpotlight: RectBounds = {
      x: Math.round(spotX),
      y: Math.round(spotY),
      width: Math.round(spotW),
      height: Math.round(spotH),
      radius
    };

    setSpotlightRect(updatedSpotlight);

    // Compute Tooltip position with precision viewport responsiveness & clearance math
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;
    const margin = isMobile ? 12 : 16;
    const spacing = isMobile ? 12 : 16;
    const tw = Math.min(380, vw - margin * 2);
    const th = tooltipRef.current?.offsetHeight || 190;

    let tx = 0;
    let ty = 0;

    // Mobile-specific viewport handling: avoid overflow and clipping on small screens
    if (isMobile) {
      // If the spotlight covers full height (e.g. Step 2 mobile drawer), anchor tooltip at bottom
      if (spotH >= vh * 0.7) {
        tx = Math.round((vw - tw) / 2);
        ty = Math.round(vh - th - 20);
      } else if (spotY + spotH + th + spacing <= vh - margin) {
        // Fits below target
        tx = Math.round(Math.max(margin, Math.min(vw - tw - margin, spotX + spotW / 2 - tw / 2)));
        ty = Math.round(spotY + spotH + spacing);
      } else if (spotY - th - spacing >= margin) {
        // Fits above target
        tx = Math.round(Math.max(margin, Math.min(vw - tw - margin, spotX + spotW / 2 - tw / 2)));
        ty = Math.round(spotY - th - spacing);
      } else {
        // Choose the side with maximum clearance
        const spaceBelow = vh - (spotY + spotH);
        const spaceAbove = spotY;
        tx = Math.round(Math.max(margin, Math.min(vw - tw - margin, spotX + spotW / 2 - tw / 2)));
        ty = spaceBelow >= spaceAbove
          ? Math.round(Math.min(vh - th - margin, spotY + spotH + spacing))
          : Math.round(Math.max(margin, spotY - th - spacing));
      }
    } else {
      // Desktop positioning with collision avoidance and placement fallback
      const preferred = currentStep.preferredPlacement || 'auto';

      const tryPlacement = (placement: 'top' | 'bottom' | 'left' | 'right') => {
        switch (placement) {
          case 'bottom':
            return {
              x: spotX + spotW / 2 - tw / 2,
              y: spotY + spotH + spacing,
              fits: spotY + spotH + spacing + th <= vh - margin
            };
          case 'top':
            return {
              x: spotX + spotW / 2 - tw / 2,
              y: spotY - th - spacing,
              fits: spotY - th - spacing >= margin
            };
          case 'right':
            return {
              x: spotX + spotW + spacing,
              y: spotY + spotH / 2 - th / 2,
              fits: spotX + spotW + spacing + tw <= vw - margin
            };
          case 'left':
            return {
              x: spotX - tw - spacing,
              y: spotY + spotH / 2 - th / 2,
              fits: spotX - tw - spacing >= margin
            };
        }
      };

      let calculated: { x: number; y: number; fits: boolean };

      if (preferred === 'auto') {
        if (spotX + spotW + spacing + tw <= vw - margin) {
          calculated = tryPlacement('right');
        } else if (spotY + spotH + spacing + th <= vh - margin) {
          calculated = tryPlacement('bottom');
        } else if (spotY - th - spacing >= margin) {
          calculated = tryPlacement('top');
        } else {
          calculated = tryPlacement('left');
        }
      } else {
        calculated = tryPlacement(preferred);
        if (!calculated.fits) {
          // Fallback to opposite or best fitting side
          if (preferred === 'right' && spotX - tw - spacing >= margin) {
            calculated = tryPlacement('left');
          } else if (preferred === 'right' && spotY + spotH + spacing + th <= vh - margin) {
            calculated = tryPlacement('bottom');
          } else if (preferred === 'bottom' && spotY - th - spacing >= margin) {
            calculated = tryPlacement('top');
          } else if (preferred === 'top' && spotY + spotH + spacing + th <= vh - margin) {
            calculated = tryPlacement('bottom');
          } else if (preferred === 'left' && spotX + spotW + spacing + tw <= vw - margin) {
            calculated = tryPlacement('right');
          }
        }
      }

      tx = calculated.x;
      ty = calculated.y;

      // Viewport clamping
      tx = Math.max(margin, Math.min(vw - tw - margin, tx));
      ty = Math.max(margin, Math.min(vh - th - margin, ty));

      // Overlap clearance guarantee
      const hasOverlap = !(
        tx + tw < spotX ||
        tx > spotX + spotW ||
        ty + th < spotY ||
        ty > spotY + spotH
      );

      if (hasOverlap) {
        if (spotY + spotH + th + spacing <= vh) {
          ty = spotY + spotH + spacing;
        } else if (spotY - th - spacing >= 0) {
          ty = spotY - th - spacing;
        }
        ty = Math.max(margin, Math.min(vh - th - margin, ty));
      }
    }

    setTooltipPos({ x: Math.round(tx), y: Math.round(ty) });
  }, [isActive, currentStep, findTargetElement]);

  // When active step changes or forceSidebarExpand updates, inject explicit layout-settling delay
  useEffect(() => {
    if (!isActive || !currentStep) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const targetEl = findTargetElement(currentStep.targetSelector);
    if (targetEl) {
      targetEl.scrollIntoView({
        behavior: isReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }

    // Multi-phase settling for smooth transitions and mobile drawer opening:
    // Phase 1: Fast initial calculation (40ms)
    const initialTimer = setTimeout(() => {
      startTransition(() => {
        updatePositions();
      });
    }, 40);

    // Phase 2: Mid-transition update (180ms)
    const midTimer = setTimeout(() => {
      startTransition(() => {
        updatePositions();
      });
    }, 180);

    // Phase 3: Authoritative settling delay (280ms for mobile drawer 250ms slide + desktop 200ms transition)
    const settlingTimer = setTimeout(() => {
      startTransition(() => {
        updatePositions();
      });
    }, 280);

    // Phase 4: Final confirmation after smooth scroll completes (400ms)
    const finalTimer = setTimeout(() => {
      startTransition(() => {
        updatePositions();
      });
    }, 400);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(midTimer);
      clearTimeout(settlingTimer);
      clearTimeout(finalTimer);
    };
  }, [isActive, currentStep, currentStepIndex, forceSidebarExpand, isReducedMotion, updatePositions, findTargetElement]);

  // Track window resize and viewport scroll
  useEffect(() => {
    if (!isActive) return;

    const handleScrollOrResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updatePositions();
      });
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [isActive, updatePositions]);

  // Keyboard navigation & accessibility focus
  useEffect(() => {
    if (!isActive) return;

    // Auto-focus next button for keyboard users
    const focusTimer = setTimeout(() => {
      nextBtnRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!isActive || !currentStep || !isVisible) {
    return null;
  }

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div 
      className="fixed inset-0 z-[9990] overflow-hidden select-none pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Onboarding Tour"
    >
      {/* 1. Backdrop Click Interceptor to prevent background control mis-clicks */}
      <div 
        className="fixed inset-0 z-[9991]" 
        aria-hidden="true" 
      />

      {/* 2. SVG Dimming Overlay with Dynamic Cutout & Highlight Ring */}
      <svg 
        className="fixed inset-0 w-full h-full pointer-events-none z-[9992]"
        aria-hidden="true"
      >
        <defs>
          <mask id="schedula-tour-spotlight-mask">
            {/* White covers entire viewport */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout reveals active target */}
            {spotlightRect && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={spotlightRect.radius}
                ry={spotlightRect.radius}
                fill="black"
                style={{
                  transition: isReducedMotion ? 'none' : 'all 320ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            )}
          </mask>
        </defs>

        {/* Masked Darkening Surface */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={isDark ? 'rgba(5, 6, 10, 0.76)' : 'rgba(15, 23, 42, 0.65)'}
          mask="url(#schedula-tour-spotlight-mask)"
        />

        {/* Glowing Spotlight Focus Border Ring */}
        {spotlightRect && isTargetFound && (
          <rect
            x={spotlightRect.x}
            y={spotlightRect.y}
            width={spotlightRect.width}
            height={spotlightRect.height}
            rx={spotlightRect.radius}
            ry={spotlightRect.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-blue-500/80 dark:text-blue-400/90"
            style={{
              transition: isReducedMotion ? 'none' : 'all 320ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        )}
      </svg>

      {/* 3. Floating Instructional Tooltip Card */}
      <div
        ref={tooltipRef}
        style={{
          transform: `translate3d(${tooltipPos.x}px, ${tooltipPos.y}px, 0)`,
          transition: isReducedMotion 
            ? 'none' 
            : 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease'
        }}
        className="fixed top-0 left-0 z-[9995] w-[calc(100vw-32px)] max-w-[380px] pointer-events-auto"
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-white/15 rounded-2xl shadow-2xl p-4 sm:p-5 text-zinc-900 dark:text-white transition-colors duration-150">
          
          {/* Header: Step Counter & Skip Button */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono tabular-nums">
              <Compass className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            </div>

            <button
              type="button"
              onClick={skipTour}
              aria-label="Skip onboarding tour"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Skip
            </button>
          </div>

          {/* Body: Title & Concise Functional Description */}
          <div className="space-y-1.5 py-1">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
              {currentStep.title}
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              {currentStep.description}
            </p>
          </div>

          {/* Footer: Back & Next / Finish Controls */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-white/10">
            {/* Back Button */}
            <button
              type="button"
              onClick={prevStep}
              disabled={isFirstStep}
              aria-label="Go to previous tour step"
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isFirstStep 
                  ? 'opacity-0 pointer-events-none' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {/* Next or Finish Button */}
            <button
              ref={nextBtnRef}
              type="button"
              onClick={isLastStep ? finishTour : nextStep}
              aria-label={isLastStep ? 'Finish onboarding tour' : 'Advance to next tour step'}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-600/20 active:scale-98 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {isLastStep ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
