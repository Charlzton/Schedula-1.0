'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { ChevronUp, ChevronDown, Sparkles, Clock } from 'lucide-react';
import { ScheduleAssignment } from '@/lib/dataset';
import { isScheduleAllocatedToLecturer, isSchedulePublished } from '@/lib/lecturerUtils';

export function LecturerNextClassCountdownWidget() {
  const { user, lecturerProfile } = useAuth();
  const { schedules, courses, lecturers, academicPeriods } = useTimetable();
  const [minimized, setMinimized] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const [countdownData, setCountdownData] = useState<{
    targetSchedule: ScheduleAssignment | null;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalRemainingMs: number;
    dayIndicator: string;
    progress: number;
  } | null>(null);

  // Listen to sidebar hover / expansion events to dynamically position on the left beside sidebar
  useEffect(() => {
    const handleSidebarHover = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.expanded === 'boolean') {
        setIsSidebarExpanded(customEvent.detail.expanded);
      }
    };
    window.addEventListener('sidebar-hover', handleSidebarHover);
    return () => window.removeEventListener('sidebar-hover', handleSidebarHover);
  }, []);

  // Outside click handler to collapse when user taps elsewhere
  useEffect(() => {
    if (minimized) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setMinimized(true);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [minimized]);

  const currentLecturer = useMemo(() => {
    if (lecturerProfile) return lecturerProfile;
    if (user?.lecturerId) {
      const found = lecturers.find(l => l.lecturerId.trim().toUpperCase() === user.lecturerId?.trim().toUpperCase());
      if (found) return found;
    }
    if (user?.id) {
      const found = lecturers.find(l => l.authUid === user.id);
      if (found) return found;
    }
    if (user?.email) {
      const emailLower = user.email.toLowerCase().trim();
      const found = lecturers.find(l => 
        (l.officeEmail && l.officeEmail.toLowerCase().trim() === emailLower) ||
        (l.email && l.email.toLowerCase().trim() === emailLower)
      );
      if (found) return found;
    }
    return null;
  }, [lecturerProfile, user, lecturers]);

  const publishedLecturerSchedules = useMemo(() => {
    if (!currentLecturer && !user) return [];
    return schedules.filter(s => {
      if (!isScheduleAllocatedToLecturer(s, currentLecturer, courses, user?.id, user?.email)) return false;
      if (!isSchedulePublished(s, academicPeriods)) return false;
      return true;
    });
  }, [schedules, currentLecturer, user, courses, academicPeriods]);

  useEffect(() => {
    if (publishedLecturerSchedules.length === 0) {
      setCountdownData(null);
      return;
    }

    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };

    const calculateNextClass = () => {
      const now = new Date();
      const currentDayIndex = now.getDay();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTotalSeconds = (currentHours * 60 + currentMinutes) * 60 + currentSeconds;

      let closestTargetTime: number | null = null;
      let closestSchedule: ScheduleAssignment | null = null;
      let targetDateObj: Date | null = null;

      publishedLecturerSchedules.forEach(schedule => {
        const targetDayNum = dayMap[schedule.day];
        if (targetDayNum === undefined) return;

        const startParts = schedule.startTime.split(':');
        if (startParts.length < 2) return;
        const startHour = parseInt(startParts[0], 10);
        const startMin = parseInt(startParts[1], 10);
        if (isNaN(startHour) || isNaN(startMin)) return;

        const startTotalSec = (startHour * 60 + startMin) * 60;

        let dayDiff = targetDayNum - currentDayIndex;
        if (dayDiff < 0 || (dayDiff === 0 && startTotalSec <= currentTotalSeconds)) {
          dayDiff += 7;
        }

        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + dayDiff);
        targetDate.setHours(startHour, startMin, 0, 0);

        const diffMs = targetDate.getTime() - now.getTime();
        if (diffMs > 0 && (closestTargetTime === null || diffMs < closestTargetTime)) {
          closestTargetTime = diffMs;
          closestSchedule = schedule;
          targetDateObj = targetDate;
        }
      });

      if (closestTargetTime !== null && closestSchedule !== null && targetDateObj !== null) {
        const totalSeconds = Math.floor(closestTargetTime / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const todayStr = now.toDateString();
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrowDate.toDateString();
        const targetDateStr = targetDateObj.toDateString();

        let dayIndicator = `Next class on ${closestSchedule.day}`;
        if (targetDateStr === todayStr) {
          dayIndicator = 'Next class today';
        } else if (targetDateStr === tomorrowStr) {
          dayIndicator = 'Next class tomorrow';
        }

        const maxCycleMs = 7 * 24 * 3600 * 1000;
        const progress = Math.min(1, Math.max(0, closestTargetTime / maxCycleMs));

        setCountdownData({
          targetSchedule: closestSchedule,
          days,
          hours,
          minutes,
          seconds,
          totalRemainingMs: closestTargetTime,
          dayIndicator,
          progress
        });
      } else {
        setCountdownData(null);
      }
    };

    calculateNextClass();
    const interval = setInterval(calculateNextClass, 1000);
    return () => clearInterval(interval);
  }, [publishedLecturerSchedules]);

  if (!currentLecturer) {
    return null;
  }

  const formatTimeDisplay = () => {
    if (!countdownData) return '00m 00s';
    const { days, hours, minutes, seconds } = countdownData;
    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progressValue = countdownData ? countdownData.progress : 0;
  const strokeDashoffset = circumference * (1 - progressValue);

  // Dynamic left position based on sidebar expansion state
  const leftPositionClass = isSidebarExpanded
    ? 'left-4 sm:left-6 lg:left-[304px]'
    : 'left-4 sm:left-6 lg:left-[104px]';

  return (
    <aside 
      ref={widgetRef}
      aria-label="Next Class Countdown" 
      className={`fixed bottom-4 ${leftPositionClass} z-40 flex flex-col items-start pointer-events-none font-system transition-all duration-200 ease-in-out`}
    >
      <div className="pointer-events-auto flex flex-col items-center">
        {!minimized ? (
          <div className="relative flex flex-col items-center p-1">
            {/* Minimize Toggle Button */}
            <button
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize countdown widget"
              className="absolute -top-1 -right-1 p-1 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-sm z-20 pointer-events-auto"
              title="Minimize countdown"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {countdownData ? (
              <div className="relative w-28 h-28 sm:w-30 sm:h-30 flex items-center justify-center">
                {/* Circular Progress Ring */}
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-zinc-300/40 dark:stroke-zinc-800/80"
                    strokeWidth="4.5"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-1000 ease-linear"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                    }}
                  />
                </svg>

                {/* Subtle blurred background and text placement inside the center of the circle */}
                <div className="absolute inset-2.5 rounded-full backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 border border-zinc-200/50 dark:border-white/10 shadow-sm flex flex-col items-center justify-center p-1 text-center overflow-hidden">
                  <div className="text-[9px] sm:text-[10px] font-black text-zinc-900 dark:text-white tracking-tight tabular-nums drop-shadow-xs">
                    {formatTimeDisplay()}
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 tracking-tight leading-tight truncate max-w-[80px]">
                    {countdownData.dayIndicator}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center p-3 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/50 dark:border-white/10 shadow-md text-center pointer-events-auto">
                <Sparkles className="w-4 h-4 text-blue-500 mb-0.5" />
                <div className="text-[10px] font-bold text-zinc-900 dark:text-white">No upcoming classes</div>
              </div>
            )}
          </div>
        ) : (
          /* Minimized State with NO rectangular card background */
          <button
            type="button"
            onClick={() => setMinimized(false)}
            aria-label="Expand countdown widget"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-white/15 shadow-lg text-xs font-bold text-zinc-900 dark:text-white hover:scale-105 transition-all cursor-pointer pointer-events-auto"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="tabular-nums font-extrabold text-[11px]">
              {countdownData ? formatTimeDisplay() : 'No classes'}
            </span>
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        )}
      </div>
    </aside>
  );
}
