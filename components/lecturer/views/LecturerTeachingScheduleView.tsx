'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { ScheduleAssignment } from '@/lib/dataset';
import { Clock, MapPin, Users } from 'lucide-react';

export function LecturerTeachingScheduleView() {
  const { user, lecturerProfile } = useAuth();
  const { schedules, lecturers } = useTimetable();

  // Active lecturer resolution
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>(
    lecturerProfile?.lecturerId || user?.lecturerId || 'L308'
  );

  const [selectedSemester, setSelectedSemester] = useState<'All' | 'Semester 1' | 'Semester 2'>('All');
  const [viewMode, setViewMode] = useState<'agenda' | 'grid'>('agenda');

  // Find active lecturer object
  const currentLecturer = useMemo(() => {
    return lecturers.find(l => l.lecturerId === selectedLecturerId) || 
           lecturers.find(l => l.lecturerId === 'L308') || 
           lecturers[0];
  }, [lecturers, selectedLecturerId]);

  // Lecturer schedules
  const lecturerSchedules = useMemo(() => {
    if (!currentLecturer) return [];
    const id = currentLecturer.lecturerId;
    const nameLower = currentLecturer.fullName.toLowerCase();

    return schedules.filter(s => {
      const match = s.lecturerId === id || (s.lecturerName && s.lecturerName.toLowerCase() === nameLower);
      if (!match) return false;
      if (selectedSemester !== 'All' && s.semester !== selectedSemester) return false;
      return true;
    });
  }, [schedules, currentLecturer, selectedSemester]);

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

  return (
    <div className="space-y-6 pb-12 font-system">
      
      {/* 1. Header & Segmented View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Teaching Schedule
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {lecturerSchedules.length} Sessions
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {currentLecturer?.fullName} • {totalWeeklyTeachingHours} weekly contact hours
          </p>
        </div>

        {/* View Mode Toggle (Admin Style) */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs self-start sm:self-auto">
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
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Instructor Selector */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Instructor
            </label>
            <select
              value={selectedLecturerId}
              onChange={(e) => setSelectedLecturerId(e.target.value)}
              className="glass-input px-3 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {lecturers.map(l => (
                <option key={l.lecturerId} value={l.lecturerId}>
                  {l.fullName} ({l.lecturerId})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Semester Filter */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="glass-input px-3 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
      {lecturerSchedules.length === 0 ? (
        <div className="p-8 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 text-center space-y-2">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No scheduled teaching sessions found for this selection.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select &apos;All Semesters&apos; or inspect course allocations.
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
