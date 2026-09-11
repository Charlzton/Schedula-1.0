'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  Users, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Course } from '@/lib/dataset';

export function LecturerCoursesView() {
  const { user, lecturerProfile } = useAuth();
  const { courses, schedules, activeAcademicPeriod, currentAcademicYear } = useTimetable();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<'All' | 'Semester 1' | 'Semester 2'>('All');
  const [selectedLevel, setSelectedLevel] = useState<'All' | '100' | '200' | '300' | '400'>('All');

  // Authenticated lecturer label
  const facultyName = lecturerProfile?.fullName || user?.name || 'Faculty Member';
  const facultyId = lecturerProfile?.lecturerId || user?.lecturerId || '';

  // Filter courses by search, semester, and level
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = 
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSemester = selectedSemester === 'All' || c.semester === selectedSemester;
      const matchesLevel = selectedLevel === 'All' || c.level.toString() === selectedLevel;

      return matchesSearch && matchesSemester && matchesLevel;
    });
  }, [courses, searchTerm, selectedSemester, selectedLevel]);

  // Export scoped courses as CSV
  const handleExportCSV = () => {
    const headers = ['Course Code', 'Course Title', 'Level', 'Semester', 'Credits', 'Expected Enrollment', 'Department'];
    const rows = filteredCourses.map(c => [
      `"${c.courseCode}"`,
      `"${c.courseTitle}"`,
      c.level,
      `"${c.semester}"`,
      c.totalCredits || 3,
      c.expectedEnrollment,
      `"${c.department || 'Computer Science'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assigned_courses_${facultyId || 'faculty'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 font-system">
      {/* 1. Header & Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Assigned Courses
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Teaching catalog allocated to {facultyName} ({facultyId}) • {activeAcademicPeriod?.academicYear || currentAcademicYear}
          </p>
        </div>

        {/* Export button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredCourses.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/80 dark:border-white/10 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Export assigned courses list"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assigned course code or title..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Semester Selector */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs">
              {(['All', 'Semester 1', 'Semester 2'] as const).map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSemester === sem
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs">
              {(['All', '100', '200', '300', '400'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="p-10 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              No Assigned Courses Found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {searchTerm || selectedSemester !== 'All' || selectedLevel !== 'All'
                ? 'No assigned courses match the selected filters. Try clearing your search.'
                : 'You do not have any teaching courses assigned for this period. Contact the Academic Directorate to allocate curriculum courses.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => {
            // Find scheduled sessions for this course
            const courseSessions = schedules.filter(s => s.courseCode === course.courseCode);

            return (
              <div 
                key={course.courseCode}
                className="p-5 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        {course.courseCode}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      Level {course.level} • {course.semester}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.courseTitle}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {course.department || 'Department of Computer Science'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Users className="w-3.5 h-3.5" />
                      Class Enrollment
                    </span>
                    <strong className="font-semibold text-zinc-900 dark:text-white">
                      {course.expectedEnrollment} students
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      Credit Units
                    </span>
                    <strong className="font-semibold text-zinc-900 dark:text-white">
                      {course.totalCredits || 3} Credits
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Layers className="w-3.5 h-3.5" />
                      Scheduled Sessions
                    </span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      courseSessions.length > 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {courseSessions.length > 0 ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{courseSessions.length} active</span>
                        </>
                      ) : (
                        <span>Not scheduled</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
