'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { Clock, MapPin, Calendar, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { ScheduleAssignment } from '@/lib/dataset';

export function LecturerNextClassCountdownWidget() {
  const { user, lecturerProfile } = useAuth();
  const { schedules, lecturers, academicPeriods } = useTimetable();
  const [minimized, setMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; targetSchedule: ScheduleAssignment | null } | null>(null);

  // Authenticated lecturer resolution (matching LecturerTeachingScheduleView)
  const currentLecturer = useMemo(() => {
    if (lecturerProfile) return lecturerProfile;
    if (user?.lecturerId) {
      const found = lecturers.find(l => l.lecturerId === user.lecturerId);
      if (found) return found;
    }
    if (user?.email) {
      const emailLower = user.email.toLowerCase();
      const found = lecturers.find(l => 
        (l.officeEmail && l.officeEmail.toLowerCase() === emailLower) ||
        (l.email && l.email.toLowerCase() === emailLower)
      );
      if (found) return found;
    }
    return null;
  }, [lecturerProfile, user, lecturers]);

  // Lecturer schedules strictly filtered by publishing status
  const lecturerSchedules = useMemo(() => {
    if (!currentLecturer) return [];
    const id = currentLecturer.lecturerId;
    const nameLower = currentLecturer.fullName.toLowerCase();

    return schedules.filter(s => {
      const match = s.lecturerId === id || (s.lecturerName && s.lecturerName.toLowerCase() === nameLower);
      if (!match) return false;

      // Check if period is published in system
      if (s.academicYear && s.semester) {
        const period = academicPeriods.find(p => 
          p.academicYear === s.academicYear && 
          p.semester === s.semester
        );
        if (period && !period.isPublished) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, currentLecturer, academicPeriods]);

  useEffect(() => {
    if (lecturerSchedules.length === 0) {
      setTimeLeft(null);
      return;
    }

    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const calculateNextClass = () => {
      const now = new Date();
      const currentDayIndex = now.getDay(); // 0-6
      const currentMinutesToday = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();

      let closestTargetTime: number | null = null;
      let closestSchedule: ScheduleAssignment | null = null;

      lecturerSchedules.forEach(schedule => {
        const targetDayNum = dayMap[schedule.day];
        if (targetDayNum === undefined) return;

        // Parse start time (e.g., "08:00" or "14:30")
        const timeParts = schedule.startTime.split(':');
        if (timeParts.length < 2) return;
        const startHour = parseInt(timeParts[0], 10);
        const startMin = parseInt(timeParts[1], 10);
        if (isNaN(startHour) || isNaN(startMin)) return;

        const startMinutesTotal = startHour * 60 + startMin;

        // Calculate days difference from today
        let dayDiff = targetDayNum - currentDayIndex;
        if (dayDiff < 0 || (dayDiff === 0 && startMinutesTotal * 60 <= (currentMinutesToday * 60 + currentSeconds))) {
          dayDiff += 7; // Next week occurrence
        }

        // Calculate absolute date/time for this occurrence
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + dayDiff);
        targetDate.setHours(startHour, startMin, 0, 0);

        const diffMs = targetDate.getTime() - now.getTime();
        if (diffMs > 0 && (closestTargetTime === null || diffMs < closestTargetTime)) {
          closestTargetTime = diffMs;
          closestSchedule = schedule;
        }
      });

      if (closestTargetTime !== null && closestSchedule !== null) {
        const totalSeconds = Math.floor(closestTargetTime / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setTimeLeft({ days, hours, minutes, seconds, targetSchedule: closestSchedule });
      } else {
        setTimeLeft(null);
      }
    };

    calculateNextClass();
    const interval = setInterval(calculateNextClass, 1000);
    return () => clearInterval(interval);
  }, [lecturerSchedules]);

  if (!currentLecturer || lecturerSchedules.length === 0) {
    return null; // Don't show widget if no lecturer profile or no published classes
  }

  return (
    <aside 
      aria-label="Next Class Countdown" 
      className="fixed bottom-4 right-4 z-40 max-w-xs w-full sm:w-80 shadow-2xl rounded-3xl liquid-glass border border-blue-500/30 dark:border-blue-500/20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600/10 dark:bg-blue-500/10 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Next Class Countdown
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(prev => !prev)}
          className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          title={minimized ? "Expand widget" : "Minimize widget"}
        >
          {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Widget Body */}
      {!minimized && (
        <div className="p-4 space-y-3">
          {timeLeft && timeLeft.targetSchedule ? (
            <>
              {/* Course info */}
              <div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  {timeLeft.targetSchedule.courseCode} — {timeLeft.targetSchedule.day}
                </div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white truncate mt-0.5">
                  {timeLeft.targetSchedule.courseTitle}
                </h4>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-zinc-200/50 dark:border-white/10">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate font-medium">{timeLeft.targetSchedule.hallName}</span>
                <span className="ml-auto text-[10px] text-zinc-500 shrink-0">
                  {timeLeft.targetSchedule.startTime} - {timeLeft.targetSchedule.endTime}
                </span>
              </div>

              {/* Countdown timer blocks */}
              <div className="pt-1">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mb-1.5">
                  Starts in:
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-zinc-900/5 dark:bg-white/5 p-2 rounded-xl border border-zinc-200/60 dark:border-white/10">
                    <div className="text-base font-black text-zinc-900 dark:text-white">
                      {timeLeft.days}
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase font-semibold">Days</div>
                  </div>
                  <div className="bg-zinc-900/5 dark:bg-white/5 p-2 rounded-xl border border-zinc-200/60 dark:border-white/10">
                    <div className="text-base font-black text-zinc-900 dark:text-white">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase font-semibold">Hrs</div>
                  </div>
                  <div className="bg-zinc-900/5 dark:bg-white/5 p-2 rounded-xl border border-zinc-200/60 dark:border-white/10">
                    <div className="text-base font-black text-zinc-900 dark:text-white">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase font-semibold">Mins</div>
                  </div>
                  <div className="bg-zinc-900/5 dark:bg-white/5 p-2 rounded-xl border border-zinc-200/60 dark:border-white/10">
                    <div className="text-base font-black text-blue-600 dark:text-blue-400">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase font-semibold">Secs</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-1">
              <Sparkles className="w-6 h-6 text-blue-500 mx-auto opacity-60" />
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                No upcoming classes
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                All scheduled classes for this period have concluded or none are published.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
