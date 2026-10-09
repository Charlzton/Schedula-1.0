'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  TourStep, 
  TourRole, 
  ADMIN_TOUR_STEPS, 
  SUPER_ADMIN_TOUR_STEPS, 
  LECTURER_TOUR_STEPS, 
  STUDENT_TOUR_STEPS 
} from '@/components/tour/tourDefinitions';

interface TourContextType {
  isActive: boolean;
  isTourActive: boolean;
  forceSidebarExpand: boolean;
  currentStepIndex: number;
  activeSteps: TourStep[];
  currentStep: TourStep | null;
  totalSteps: number;
  startTour: (roleOverride?: TourRole) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
  goToStep: (index: number) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([]);

  // Resolve steps for a role
  const resolveStepsForRole = useCallback((role?: string | null): TourStep[] => {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'super_admin') {
      return SUPER_ADMIN_TOUR_STEPS;
    }
    if (normalizedRole.includes('admin')) {
      return ADMIN_TOUR_STEPS;
    }
    if (normalizedRole.includes('lecturer')) {
      return LECTURER_TOUR_STEPS;
    }
    if (normalizedRole.includes('student')) {
      return STUDENT_TOUR_STEPS;
    }
    // Default fallback based on whether path/context is admin or lecturer
    return ADMIN_TOUR_STEPS;
  }, []);

  // Start tour handler with automatic overview redirection & layout-mount settling delay
  const startTour = useCallback((roleOverride?: TourRole) => {
    const roleToUse = roleOverride || user?.role || 'admin';
    const steps = resolveStepsForRole(roleToUse);

    if (steps.length === 0) return;

    setActiveSteps(steps);
    setCurrentStepIndex(0);

    // 1. Inspect current route and trigger redirection to primary Overview route
    const isLecturer = (roleToUse || '').toLowerCase().includes('lecturer');
    const targetPath = isLecturer ? '/lecturer' : '/dashboard';

    if (typeof window !== 'undefined') {
      // Dispatch global reset event to notify dashboard view state machines
      window.dispatchEvent(new CustomEvent('schedula-reset-to-overview', {
        detail: { role: roleToUse }
      }));

      // Synchronize window path if currently on a sub-route
      if (window.location.pathname !== targetPath) {
        try {
          window.history.pushState(null, '', targetPath);
        } catch {
          // Fallback if pushState is restricted
        }
      }
    }

    // 2. Delay initialization of Step 1 until Overview route layout and DOM components are mounted
    const targetSelector = steps[0]?.targetSelector;
    let attempts = 0;
    const checkAndActivate = () => {
      const el = (typeof document !== 'undefined' && targetSelector) 
        ? document.querySelector(targetSelector) 
        : null;

      if (el || attempts >= 8) {
        setIsActive(true);
      } else {
        attempts++;
        setTimeout(checkAndActivate, 60);
      }
    };

    setTimeout(checkAndActivate, 120);
  }, [user?.role, resolveStepsForRole]);

  // Step advancement
  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= activeSteps.length - 1) {
        setIsActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, [activeSteps.length]);

  // Step back
  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Direct step navigation
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < activeSteps.length) {
      setCurrentStepIndex(index);
    }
  }, [activeSteps.length]);

  // Skip and finish
  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const finishTour = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  // Listen to custom window event for triggering from anywhere
  useEffect(() => {
    const handleGlobalTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ role?: TourRole }>;
      startTour(customEvent.detail?.role);
    };

    window.addEventListener('start-onboarding-tour', handleGlobalTrigger);
    return () => {
      window.removeEventListener('start-onboarding-tour', handleGlobalTrigger);
    };
  }, [startTour]);

  const currentStep = useMemo(() => {
    if (!isActive || activeSteps.length === 0) return null;
    return activeSteps[currentStepIndex] || null;
  }, [isActive, activeSteps, currentStepIndex]);

  // Authoritative forceSidebarExpand calculation
  const forceSidebarExpand = useMemo(() => {
    if (!isActive || !currentStep) return false;
    const selector = currentStep.targetSelector || '';
    return (
      selector.includes('nav') ||
      selector.startsWith('#nav-item-') ||
      selector.startsWith('#lecturer-nav-') ||
      selector.includes('nav-settings') ||
      selector === 'data-tour="nav-settings"' ||
      selector === '[data-tour="nav-settings"]' ||
      selector.includes('sidebar')
    );
  }, [isActive, currentStep]);

  const value = useMemo<TourContextType>(() => ({
    isActive,
    isTourActive: isActive,
    forceSidebarExpand,
    currentStepIndex,
    activeSteps,
    currentStep,
    totalSteps: activeSteps.length,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    goToStep
  }), [
    isActive,
    forceSidebarExpand,
    currentStepIndex,
    activeSteps,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    goToStep
  ]);

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
