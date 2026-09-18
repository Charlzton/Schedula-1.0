'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Users, 
  Clock, 
  GraduationCap, 
  Sparkles,
  ArrowUpDown,
  CheckCircle,
  Building2,
  UploadCloud,
  X
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { Course } from '@/lib/dataset';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

interface CoursesViewProps {
  onOpenAddCourse: () => void;
  onEditCourse: (course: Course) => void;
}

export function CoursesView({ onOpenAddCourse, onEditCourse }: CoursesViewProps) {
  const { courses, deleteCourse, bulkDeleteCourses, selectedSemester, setSelectedSemester } = useTimetable();

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | '100' | '200' | '300' | '400'>('All');
  const [sortField, setSortField] = useState<keyof Course>('courseCode');
  const [sortAsc, setSortAsc] = useState(true);

  // Selection & Bulk delete state
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Single Delete modal state
  const [deletingCourseCode, setDeletingCourseCode] = useState<string | null>(null);
  const [deletingCourseTitle, setDeletingCourseTitle] = useState<string>('');

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = 
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.assignedLecturerName && c.assignedLecturerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.department && c.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSemester = selectedSemester === 'All' || c.semester === selectedSemester;
      const matchesLevel = levelFilter === 'All' || c.level.toString() === levelFilter;

      return matchesSearch && matchesSemester && matchesLevel;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [courses, searchTerm, selectedSemester, levelFilter, sortField, sortAsc]);

  const handleSort = (field: keyof Course) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleSelectAll = () => {
    const allFilteredCodes = filteredCourses.map(c => c.courseCode);
    const isAllSelected = allFilteredCodes.length > 0 && allFilteredCodes.every(code => selectedCodes.includes(code));
    if (isAllSelected) {
      setSelectedCodes(prev => prev.filter(code => !allFilteredCodes.includes(code)));
    } else {
      setSelectedCodes(Array.from(new Set([...selectedCodes, ...allFilteredCodes])));
    }
  };

  const handleSelectOne = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleConfirmDelete = () => {
    if (deletingCourseCode) {
      deleteCourse(deletingCourseCode);
      setSelectedCodes(prev => prev.filter(c => c !== deletingCourseCode));
      setDeletingCourseCode(null);
      setDeletingCourseTitle('');
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedCodes.length > 0) {
      const count = selectedCodes.length;
      bulkDeleteCourses(selectedCodes);
      setSelectedCodes([]);
      setIsBulkDeleteModalOpen(false);
      setBulkSuccessMsg(`Successfully deleted ${count} selected course(s).`);
      setTimeout(() => setBulkSuccessMsg(null), 4000);
    }
  };

  const isAllFilteredSelected = filteredCourses.length > 0 && filteredCourses.every(c => selectedCodes.includes(c.courseCode));

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Courses
            </h2>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {filteredCourses.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Department of Computer Science
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-advanced-import'))}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
            title="Import Courses"
            aria-label="Import"
          >
            <UploadCloud className="w-4 h-4" />
          </button>
          <button
            id="add-new-course-btn"
            onClick={onOpenAddCourse}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
            title="Add Course"
            aria-label="Add Course"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left group: Semester & Level */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Semester Selector */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs overflow-x-auto custom-scrollbar">
              {(['Semester 1', 'Semester 2', 'All'] as const).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSemester === sem
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>

            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs overflow-x-auto custom-scrollbar">
              {(['All', '100', '200', '300', '400'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    levelFilter === lvl
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {lvl === 'All' ? 'All Levels' : `Level ${lvl}`}
                </button>
              ))}
            </div>
          </div>

          {/* Right group: Sort selector & Search box */}
          <div className="flex items-center gap-2">
            <select
              value={`${sortField}-${sortAsc ? 'asc' : 'desc'}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-');
                setSortField(field as keyof Course);
                setSortAsc(dir === 'asc');
              }}
              aria-label="Sort courses by"
              className="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="courseCode-asc">Code (A → Z)</option>
              <option value="courseCode-desc">Code (Z → A)</option>
              <option value="courseTitle-asc">Title (A → Z)</option>
              <option value="courseTitle-desc">Title (Z → A)</option>
              <option value="level-asc">Level (Low → High)</option>
              <option value="level-desc">Level (High → Low)</option>
              <option value="totalCredits-asc">Credits (Low → High)</option>
              <option value="totalCredits-desc">Credits (High → Low)</option>
              <option value="expectedEnrollment-desc">Size (Large → Small)</option>
              <option value="department-asc">Department (A → Z)</option>
            </select>

            <div className="relative w-full md:w-auto min-w-0 md:min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {bulkSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{bulkSuccessMsg}</span>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedCodes.length > 0 && (
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-black/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 dark:text-blue-700">
              {selectedCodes.length} {selectedCodes.length === 1 ? 'course' : 'courses'} selected
            </span>
            <button
              onClick={() => setSelectedCodes([])}
              className="text-xs font-medium underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedCodes.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Courses Data Table */}
      <div className="rounded-3xl glass-panel overflow-hidden border-white/60 dark:border-white/10">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 uppercase font-bold text-[11px]">
                <th className="p-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all courses"
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="p-3.5 text-left cursor-pointer select-none" onClick={() => handleSort('courseCode')}>
                  <div className="flex items-center gap-1.5">
                    <span>Course Code</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="p-3.5 text-left cursor-pointer select-none" onClick={() => handleSort('courseTitle')}>
                  <div className="flex items-center gap-1.5">
                    <span>Course Title</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="p-3.5 text-left cursor-pointer select-none" onClick={() => handleSort('level')}>
                  <div className="flex items-center gap-1.5">
                    <span>Level</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="p-3.5 text-left">Semester</th>
                <th className="p-3.5 text-left cursor-pointer select-none" onClick={() => handleSort('totalCredits')}>
                  <div className="flex items-center gap-1.5">
                    <span>Credits</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="p-3.5 text-left cursor-pointer select-none" onClick={() => handleSort('expectedEnrollment')}>
                  <div className="flex items-center gap-1.5">
                    <span>Class Size</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="p-3.5 text-left">Hours (L/P)</th>
                <th className="p-3.5 text-left">Assigned Lecturer</th>
                <th className="p-3.5 text-right actions-column">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    No courses match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const isSelected = selectedCodes.includes(course.courseCode);
                  return (
                    <tr 
                      key={course.courseCode} 
                      className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                        isSelected ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(course.courseCode)}
                          aria-label={`Select course ${course.courseCode}`}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-zinc-900 dark:text-white">
                        {course.courseCode}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-white">{course.courseTitle}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-xs">{course.department}</div>
                      </td>
                      <td className="p-3.5 font-medium text-zinc-700 dark:text-zinc-300">
                        L{course.level}
                      </td>
                      <td className="p-3.5 text-zinc-700 dark:text-zinc-300 font-medium">
                        {course.semester}
                      </td>
                      <td className="p-3.5 font-bold text-zinc-900 dark:text-white">
                        {course.totalCredits} Cr
                      </td>
                      <td className="p-3.5 font-medium text-zinc-700 dark:text-zinc-300">
                        {course.expectedEnrollment} students
                      </td>
                      <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                        {course.theoryHours}h Lec / {course.practicalHours}h Lab
                      </td>
                      <td className="p-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                        {course.assignedLecturerName || (
                          <span className="text-zinc-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right actions-column">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditCourse(course)}
                            className="px-2 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit course"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingCourseCode(course.courseCode);
                              setDeletingCourseTitle(`${course.courseCode} - ${course.courseTitle}`);
                            }}
                            className="px-2 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete course"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingCourseCode}
        onClose={() => setDeletingCourseCode(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Academic Course?"
        itemName={deletingCourseTitle}
        itemType="course"
        description="Are you sure you want to permanently delete this course? Any scheduled timetable sessions for this course will be unassigned."
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Courses?"
        itemName={`${selectedCodes.length} Selected Courses`}
        itemType="courses"
        description={`Are you sure you want to permanently delete these ${selectedCodes.length} selected courses? This action will remove all corresponding course catalog entries and scheduled timetable sessions.`}
      />
    </div>
  );
}
