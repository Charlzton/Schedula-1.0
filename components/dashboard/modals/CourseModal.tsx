'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Users, Clock, GraduationCap, Building2, Check, AlertCircle } from 'lucide-react';
import { Course } from '@/lib/dataset';
import { useTimetable } from '@/context/TimetableContext';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCourse?: Course | null;
}

export function CourseModal({ isOpen, onClose, initialCourse }: CourseModalProps) {
  const { addCourse, updateCourse, lecturers } = useTimetable();

  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [totalCredits, setTotalCredits] = useState(3);
  const [level, setLevel] = useState(100);
  const [semester, setSemester] = useState<'Semester 1' | 'Semester 2'>('Semester 1');
  const [expectedEnrollment, setExpectedEnrollment] = useState(250);
  const [theoryHours, setTheoryHours] = useState(2);
  const [practicalHours, setPracticalHours] = useState(1);
  const [department, setDepartment] = useState('Department of Computer Science');
  const [assignedLecturerId, setAssignedLecturerId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourse) {
      setCourseCode(initialCourse.courseCode);
      setCourseTitle(initialCourse.courseTitle);
      setTotalCredits(initialCourse.totalCredits ?? 3);
      setLevel(initialCourse.level ?? 100);
      setSemester(initialCourse.semester || 'Semester 1');
      setExpectedEnrollment(initialCourse.expectedEnrollment ?? 250);
      setTheoryHours(initialCourse.theoryHours ?? 2);
      setPracticalHours(initialCourse.practicalHours ?? 1);
      setDepartment(initialCourse.department || 'Department of Computer Science');
      setAssignedLecturerId(initialCourse.assignedLecturerId || '');
    } else {
      setCourseCode('');
      setCourseTitle('');
      setTotalCredits(3);
      setLevel(100);
      setSemester('Semester 1');
      setExpectedEnrollment(250);
      setTheoryHours(2);
      setPracticalHours(1);
      setDepartment('Department of Computer Science');
      setAssignedLecturerId('');
    }
    setValidationError(null);
  }, [initialCourse, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanCode = courseCode.trim().toUpperCase();
    const cleanTitle = courseTitle.trim().toUpperCase();

    if (!cleanCode) {
      setValidationError('Course code is required (e.g. DCIT301).');
      return;
    }
    if (!cleanTitle) {
      setValidationError('Course title is required.');
      return;
    }

    const lecturer = lecturers.find(l => l.lecturerId === assignedLecturerId);

    const courseData: Course = {
      courseCode: cleanCode,
      courseTitle: cleanTitle,
      totalCredits: Number(totalCredits),
      level: Number(level),
      semester,
      expectedEnrollment: Number(expectedEnrollment),
      theoryHours: Number(theoryHours),
      practicalHours: Number(practicalHours),
      department: department.trim(),
      assignedLecturerId: assignedLecturerId || undefined,
      assignedLecturerName: lecturer?.fullName
    };

    if (initialCourse) {
      updateCourse(initialCourse.courseCode, courseData);
    } else {
      addCourse(courseData);
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {initialCourse ? 'Edit Academic Course' : 'Add New Course'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Department of Computer Science UG</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DCIT301"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                disabled={!!initialCourse}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Total Credits
              </label>
              <select
                value={totalCredits}
                onChange={(e) => setTotalCredits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value={1} className="dark:bg-zinc-900">1 Credit</option>
                <option value={2} className="dark:bg-zinc-900">2 Credits</option>
                <option value={3} className="dark:bg-zinc-900">3 Credits</option>
                <option value={4} className="dark:bg-zinc-900">4 Credits</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OPERATING SYSTEMS"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value={100} className="dark:bg-zinc-900">Level 100 (First Year)</option>
                <option value={200} className="dark:bg-zinc-900">Level 200 (Second Year)</option>
                <option value={300} className="dark:bg-zinc-900">Level 300 (Third Year)</option>
                <option value={400} className="dark:bg-zinc-900">Level 400 (Final Year)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Academic Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="Semester 1" className="dark:bg-zinc-900">Semester 1</option>
                <option value="Semester 2" className="dark:bg-zinc-900">Semester 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Enrollment
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                value={expectedEnrollment}
                onChange={(e) => setExpectedEnrollment(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Theory (Hrs)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={theoryHours}
                onChange={(e) => setTheoryHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Lab (Hrs)
              </label>
              <input
                type="number"
                min={0}
                max={4}
                value={practicalHours}
                onChange={(e) => setPracticalHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Assigned Faculty Lecturer
            </label>
            <select
              value={assignedLecturerId}
              onChange={(e) => setAssignedLecturerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="" className="dark:bg-zinc-900">-- None / Unassigned --</option>
              {lecturers.map(lec => (
                <option key={lec.lecturerId} value={lec.lecturerId} className="dark:bg-zinc-900">
                  {lec.fullName} ({lec.title})
                </option>
              ))}
            </select>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialCourse ? 'Save Changes' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
