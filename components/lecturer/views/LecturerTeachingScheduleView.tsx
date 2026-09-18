'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { ScheduleAssignment } from '@/lib/dataset';
import { exportGeneratedTimetablePDF, exportGeneratedTimetableExcel, exportGeneratedTimetableCSV } from '@/lib/exportUtils';
import { Clock, MapPin, Users, Calendar, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';

export function LecturerTeachingScheduleView() {
  const { user, lecturerProfile } = useAuth();
  const { schedules, lecturers, academicPeriods, currentAcademicYear } = useTimetable();

  const [selectedYear, setSelectedYear] = useState<string>(currentAcademicYear || '2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<'All' | 'Semester 1' | 'Semester 2'>('Semester 1');
  const [viewMode, setViewMode] = useState<'agenda' | 'grid'>('agenda');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Available academic years from academicPeriods
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(academicPeriods.map(p => p.academicYear)));
    if (years.length === 0) return [currentAcademicYear || '2026/2027'];
    return years;
  }, [academicPeriods, currentAcademicYear]);

  // Authenticated lecturer resolution
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

  // Lecturer schedules strictly filtered by lecturer ID, academic year, semester, and publishing status
  const lecturerSchedules = useMemo(() => {
    if (!currentLecturer) return [];
    const id = currentLecturer.lecturerId;
    const nameLower = currentLecturer.fullName.toLowerCase();

    return schedules.filter(s => {
      const match = s.lecturerId === id || (s.lecturerName && s.lecturerName.toLowerCase() === nameLower);
      if (!match) return false;

      // Match Year
      if (s.academicYear && s.academicYear !== selectedYear) return false;

      // Match Semester
      if (selectedSemester !== 'All' && s.semester !== selectedSemester) return false;

      // Check if period is published in system
      const period = academicPeriods.find(p => 
        p.academicYear === (s.academicYear || selectedYear) && 
        p.semester === s.semester
      );
      if (period && !period.isPublished) {
        return false;
      }

      return true;
    });
  }, [schedules, currentLecturer, selectedYear, selectedSemester, academicPeriods]);

  const activeAcademicPeriod = useMemo(() => {
    return academicPeriods.find(p => 
      p.academicYear === selectedYear && 
      (selectedSemester === 'All' || p.semester === selectedSemester)
    ) || academicPeriods[0];
  }, [academicPeriods, selectedYear, selectedSemester]);

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const map: Record<string, ScheduleAssignment[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    lecturerSchedules.forEach(s => {
      if (map[s.day]) {
        map[s.day].push(s);
      }
    });
    Object.keys(map).forEach(day => {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [lecturerSchedules]);

  // Standard time intervals for grid view
  const timeSlots = [
    '07:30 - 09:30',
    '09:30 - 11:30',
    '11:30 - 13:30',
    '13:30 - 15:30',
    '15:30 - 17:30',
    '17:30 - 19:30'
  ];

  const totalWeeklyTeachingHours = useMemo(() => {
    return lecturerSchedules.reduce((acc, s) => acc + (s.durationHours || 2), 0);
  }, [lecturerSchedules]);

  // If the account has no associated faculty profile, show a dedicated graceful state
  if (!currentLecturer) {
    return (
      <div className="space-y-6 pb-12 font-system">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Teaching Schedule
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Personal faculty course timetable
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 rounded-3xl liquid-glass border border-amber-500/30 dark:border-amber-500/20 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              No Faculty Profile Linked
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your user account ({user?.email}) is not currently associated with an academic faculty profile in the university registry. Your teaching allocations cannot be loaded until an academic administrator links your account.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-white/10">
              <Users className="w-3.5 h-3.5" />
              Contact: Academic Affairs / Timetable Office
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-system">
      
      {/* 1. Header & Segmented View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Teaching Schedule
            </h1>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ({lecturerSchedules.length} Sessions)
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {currentLecturer.fullName} ({currentLecturer.lecturerId}) • {totalWeeklyTeachingHours} weekly contact hours
          </p>
        </div>

        {/* View Mode Toggle & Export Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'agenda'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Agenda View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Weekly Grid
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              disabled={lecturerSchedules.length === 0}
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/80 dark:border-white/10 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-2xl liquid-glass border border-zinc-200/80 dark:border-white/10 p-1.5 shadow-xl z-30 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    exportGeneratedTimetablePDF(lecturerSchedules as any, {
                      semester: selectedSemester,
                      academicYear: selectedYear,
                      department: currentLecturer?.department || 'Department of Computer Science'
                    });
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportGeneratedTimetableExcel(lecturerSchedules as any, {
                      semester: selectedSemester,
                      academicYear: selectedYear,
                      department: currentLecturer?.department || 'Department of Computer Science'
                    });
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportGeneratedTimetableCSV(lecturerSchedules as any, {
                      semester: selectedSemester,
                      academicYear: selectedYear,
                      department: currentLecturer?.department || 'Department of Computer Science'
                    });
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span>Download CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar (Restricted exclusively to current lecturer's profile) */}
      <div className="p-4 sm:p-5 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Read-only Faculty Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 font-bold text-xs">
              {currentLecturer.fullName.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white">
                {currentLecturer.fullName}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {currentLecturer.department} • {currentLecturer.lecturerId}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />

          {/* Academic Year Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="glass-input px-3 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Academic Semester Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="glass-input px-3 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="All">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
        </div>

        {/* Teaching Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Total Classes: </span>
            <strong className="text-zinc-900 dark:text-white font-bold">{lecturerSchedules.length}</strong>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Weekly Contact: </span>
            <strong className="text-zinc-900 dark:text-white font-bold">{totalWeeklyTeachingHours} Hours</strong>
          </div>
        </div>
      </div>

      {/* 3. Schedule Content Display */}
      {activeAcademicPeriod && !activeAcademicPeriod.isPublished ? (
        <div className="p-10 rounded-3xl liquid-glass border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Official Timetable Unpublished
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              The official teaching timetable for {activeAcademicPeriod.academicYear} ({activeAcademicPeriod.semester}) has not yet been published by Academic Affairs. Please check back once released.
            </p>
          </div>
        </div>
      ) : lecturerSchedules.length === 0 ? (
        <div className="p-8 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 text-center space-y-2">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No scheduled teaching sessions found for this selection.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select &apos;All Semesters&apos; or inspect published courses.
          </p>
        </div>
      ) : viewMode === 'agenda' ? (
        /* AGENDA VIEW: Organized chronologically by day */
        <div className="space-y-4">
          {days.map(day => {
            const sessions = schedulesByDay[day] || [];
            return (
              <div 
                key={day}
                className="liquid-glass rounded-3xl border border-zinc-200/70 dark:border-white/10 overflow-hidden"
              >
                {/* Day Subhead */}
                <div className="px-5 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      {day}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                      {sessions.length} {sessions.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {sessions.reduce((acc, s) => acc + (s.durationHours || 2), 0)} hrs
                  </span>
                </div>

                {/* Day Sessions */}
                {sessions.length > 0 ? (
                  <div className="divide-y divide-zinc-200/50 dark:divide-white/5">
                    {sessions.map(session => (
                      <div 
                        key={session.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Time & Venue */}
                        <div className="space-y-1 sm:w-1/3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{session.startTime} – {session.endTime}</span>
                          </div>
                          <div className="text-xs text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            {session.hallName}
                          </div>
                        </div>

                        {/* Course & Level */}
                        <div className="space-y-1 sm:w-1/2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-900 dark:text-white">
                              {session.courseCode}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Level {session.level}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                              {session.sessionType}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-300">
                            {session.courseTitle}
                          </div>
                        </div>

                        {/* Enrollment & Semester */}
                        <div className="sm:text-right space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                          <div className="flex items-center gap-1 sm:justify-end">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{session.expectedEnrollment} Students</span>
                          </div>
                          <div className="font-semibold text-zinc-700 dark:text-zinc-300">{session.semester}</div>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-xs text-zinc-400 dark:text-zinc-600">
                    No teaching sessions on {day}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TIMETABLE GRID VIEW: Matrix table */
        <div className="liquid-glass rounded-3xl border border-zinc-200/70 dark:border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-zinc-200/60 dark:border-white/10 text-zinc-600 dark:text-zinc-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3 w-28 border-r border-zinc-200/60 dark:border-white/10 text-center">Time Slot</th>
                {days.map(d => (
                  <th key={d} className="py-3 px-3 text-center border-r last:border-r-0 border-zinc-200/60 dark:border-white/10">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
              {timeSlots.map(slot => {
                const [start, end] = slot.split('-').map(s => s.trim());
                return (
                  <tr key={slot} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.01]">
                    <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-black/[0.01] dark:bg-white/[0.01] border-r border-zinc-200/60 dark:border-white/10 text-center">
                      {slot}
                    </td>

                    {days.map(day => {
                      const match = lecturerSchedules.find(s => 
                        s.day === day && 
                        (s.startTime === start || (s.startTime <= start && s.endTime >= end))
                      );

                      return (
                        <td 
                          key={day} 
                          className="py-2 px-2 border-r last:border-r-0 border-zinc-200/60 dark:border-white/10 align-top h-20"
                        >
                          {match ? (
                            <div className="h-full p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-zinc-900 dark:text-white space-y-1 flex flex-col justify-between">
                              <div>
                                <span className="font-bold text-[11px] text-blue-700 dark:text-blue-300 block">
                                  {match.courseCode}
                                </span>
                                <span className="text-[10px] text-zinc-600 dark:text-zinc-300 line-clamp-1 leading-tight">
                                  {match.courseTitle}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-1 border-t border-blue-500/10">
                                <span className="font-medium truncate">{match.hallName}</span>
                                <span>L{match.level}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-[11px]">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

