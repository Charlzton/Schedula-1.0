'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { LecturerViewType, RoomBookingRequest } from '@/lib/lecturerTypes';
import { 
  DoorOpen, 
  CalendarDays, 
  ClipboardList, 
  ArrowRight,
  Clock,
  MapPin,
  Users,
  BookOpen,
  User
} from 'lucide-react';

interface LecturerOverviewViewProps {
  onNavigate: (view: LecturerViewType) => void;
  bookingRequests: RoomBookingRequest[];
  onOpenProfileModal?: () => void;
}

export function LecturerOverviewView({ onNavigate, bookingRequests, onOpenProfileModal }: LecturerOverviewViewProps) {
  const { user, lecturerProfile } = useAuth();
  const { schedules, courses, lecturers } = useTimetable();

  // Find effective lecturer profile
  const activeLecturer = useMemo(() => {
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
    return lecturers.find(l => l.lecturerId === 'L308') || lecturers[0] || null;
  }, [lecturerProfile, user, lecturers]);

  const lecturerName = activeLecturer?.fullName || user?.name || 'Faculty Member';

  // Lecturer schedules
  const lecturerSchedules = useMemo(() => {
    if (!activeLecturer) return [];
    const id = activeLecturer.lecturerId;
    const nameLower = activeLecturer.fullName.toLowerCase();
    return schedules.filter(s => 
      s.lecturerId === id || 
      (s.lecturerName && s.lecturerName.toLowerCase() === nameLower)
    );
  }, [schedules, activeLecturer]);

  // Determine current day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayRaw = dayNames[new Date().getDay()];
  const isWeekend = todayRaw === 'Sunday' || todayRaw === 'Saturday';
  const effectiveDay = isWeekend ? 'Monday' : todayRaw;

  // Filter lectures for active day
  const todayLectures = useMemo(() => {
    return lecturerSchedules
      .filter(s => s.day === effectiveDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [lecturerSchedules, effectiveDay]);

  // Assigned courses
  const assignedCoursesList = useMemo(() => {
    if (!activeLecturer) return [];
    if (Array.isArray(activeLecturer.assignedCourses)) {
      return activeLecturer.assignedCourses;
    }
    if (typeof activeLecturer.assignedCourses === 'string') {
      return activeLecturer.assignedCourses.split(',').map(c => c.trim()).filter(Boolean);
    }
    return courses
      .filter(c => c.assignedLecturerId === activeLecturer.lecturerId)
      .map(c => c.courseCode);
  }, [activeLecturer, courses]);

  // Booking stats
  const pendingCount = bookingRequests.filter(r => r.status === 'Pending').length;
  const approvedCount = bookingRequests.filter(r => r.status === 'Approved').length;

  return (
    <div className="space-y-6 pb-12 font-system">
      
      {/* 1. Header & Identity Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Faculty Overview
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {activeLecturer?.department || 'Computer Science'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {activeLecturer?.title || 'Faculty Member'} • Staff ID: {activeLecturer?.lecturerId || 'FACULTY'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigate('rooms')}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold text-xs transition-all cursor-pointer"
          >
            <DoorOpen className="w-4 h-4" />
            <span>Check Venues</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('schedule')}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Weekly Schedule</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip (Admin Style) */}
      <section aria-label="Key Faculty Metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Weekly Sessions */}
        <div 
          onClick={() => onNavigate('schedule')}
          className="p-4 rounded-2xl liquid-glass border border-zinc-200/70 dark:border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Weekly Sessions</span>
            <CalendarDays className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {lecturerSchedules.length}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            {todayLectures.length} scheduled {isWeekend ? 'for Monday' : 'today'}
          </p>
        </div>

        {/* Assigned Courses */}
        <div 
          onClick={() => onNavigate('schedule')}
          className="p-4 rounded-2xl liquid-glass border border-zinc-200/70 dark:border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Assigned Courses</span>
            <BookOpen className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {assignedCoursesList.length || '—'}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            {assignedCoursesList.slice(0, 3).join(', ')}
          </p>
        </div>

        {/* Pending Requests */}
        <div 
          onClick={() => onNavigate('requests')}
          className="p-4 rounded-2xl liquid-glass border border-zinc-200/70 dark:border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Pending Requests</span>
            <ClipboardList className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {pendingCount}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            {approvedCount} approved to date
          </p>
        </div>

        {/* Campus Venues */}
        <div 
          onClick={() => onNavigate('rooms')}
          className="p-4 rounded-2xl liquid-glass border border-zinc-200/70 dark:border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Venue Search</span>
            <DoorOpen className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            14
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            Halls & labs available
          </p>
        </div>
      </section>

      {/* 3. Today's Sessions & Quick Actions (Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Teaching Sessions (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {isWeekend ? 'Upcoming Monday Classes' : `${effectiveDay} Classes`}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                {todayLectures.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Full Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayLectures.length > 0 ? (
            <div className="liquid-glass rounded-3xl border border-zinc-200/70 dark:border-white/10 divide-y divide-zinc-200/60 dark:divide-white/5 overflow-hidden">
              {todayLectures.map((lecture) => (
                <div 
                  key={lecture.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        {lecture.courseCode} — {lecture.courseTitle}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        {lecture.sessionType}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {lecture.startTime} – {lecture.endTime}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {lecture.hallName}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        Level {lecture.level} ({lecture.expectedEnrollment} Students)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0 self-start sm:self-auto">
                    {lecture.semester}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="liquid-glass rounded-3xl border border-zinc-200/70 dark:border-white/10 p-8 text-center space-y-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No teaching sessions scheduled for {isWeekend ? 'Monday' : 'today'}.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                Open Weekly Schedule
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Quick Navigation & Booking Status (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="w-full p-4 rounded-2xl liquid-glass-interactive border border-zinc-200/70 dark:border-white/10 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <DoorOpen className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Room Availability
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Live occupancy & reservations
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="w-full p-4 rounded-2xl liquid-glass-interactive border border-zinc-200/70 dark:border-white/10 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <CalendarDays className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Teaching Schedule
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Weekly grid and agenda views
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="w-full p-4 rounded-2xl liquid-glass-interactive border border-zinc-200/70 dark:border-white/10 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <ClipboardList className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Booking Requests
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {pendingCount > 0 ? `${pendingCount} pending review` : 'Manage room reservations'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="w-full p-4 rounded-2xl liquid-glass-interactive border border-zinc-200/70 dark:border-white/10 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Faculty Profile
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Manage contact details & availability
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
