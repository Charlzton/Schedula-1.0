'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, BookOpen, Check, AlertCircle } from 'lucide-react';
import { generateLowestAvailableId } from '@/lib/idHelper';
import { useTimetable } from '@/context/TimetableContext';
import { Lecturer } from '@/lib/dataset';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';
import { stripLeadingTitle, cleanLecturerTitle, getLecturerDisplayName } from '@/lib/lecturerUtils';

interface LecturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLecturer?: Lecturer | null;
}

export function LecturerModal({ isOpen, onClose, initialLecturer }: LecturerModalProps) {
  const { addLecturer, updateLecturer, lecturers, courses } = useTimetable();

  const [lecturerId, setLecturerId] = useState('');
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Department of Computer Science');
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(12);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [accountStatus, setAccountStatus] = useState<'active' | 'unclaimed' | 'suspended'>('unclaimed');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLecturer) {
      setLecturerId(initialLecturer.lecturerId);
      setFullName(getLecturerDisplayName(initialLecturer));
      setTitle(initialLecturer.title || '');
      setEmail(initialLecturer.email || initialLecturer.officeEmail || '');
      setPhone(initialLecturer.phone || '');
      setDepartment(initialLecturer.department || 'Department of Computer Science');
      setMaxWeeklyHours(initialLecturer.maxWeeklyHours ?? 12);
      setSelectedCourses(initialLecturer.specializations || []);
      setAccountStatus(initialLecturer.accountStatus || (initialLecturer.authUid ? 'active' : 'unclaimed'));
    } else {
      setLecturerId(generateLowestAvailableId(lecturers.map(l => l.lecturerId), 'LEC'));
      setFullName('');
      setTitle('');
      setEmail('');
      setPhone('');
      setDepartment('Department of Computer Science');
      setMaxWeeklyHours(12);
      setSelectedCourses([]);
      setAccountStatus('unclaimed');
    }
    setValidationError(null);
  }, [initialLecturer, isOpen, lecturers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanName = stripLeadingTitle(fullName);
    const cleanTitle = cleanLecturerTitle(title);
    const cleanId = lecturerId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanId) {
      setValidationError('Lecturer ID is required.');
      return;
    }
    if (!cleanName) {
      setValidationError('Lecturer full name is required.');
      return;
    }
    if (!initialLecturer) {
      const idExists = lecturers.some(l => l.lecturerId.trim().toUpperCase() === cleanId);
      const emailExists = cleanEmail && lecturers.some(l => 
        (l.email?.trim().toLowerCase() === cleanEmail) || 
        (l.officeEmail?.trim().toLowerCase() === cleanEmail)
      );
      if (idExists) {
        setValidationError(`A lecturer with ID "${cleanId}" already exists.`);
        return;
      }
      if (emailExists) {
        setValidationError(`A lecturer with email "${cleanEmail}" already exists.`);
        return;
      }
    }

    const resolvedEmail = cleanEmail || `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@ug.edu.gh`;

    const lecturerData: Lecturer = {
      lecturerId: cleanId,
      fullName: cleanName,
      title: cleanTitle,
      email: resolvedEmail,
      officeEmail: resolvedEmail,
      phone: phone.trim() || '+233 24 000 0000',
      department: department.trim(),
      maxWeeklyHours: Number(maxWeeklyHours),
      specializations: selectedCourses,
      accountStatus: initialLecturer ? accountStatus : 'unclaimed',
      authUid: initialLecturer?.authUid,
      registeredAt: initialLecturer?.registeredAt
    };

    setIsSubmitting(true);
    setTimeout(() => {
      if (initialLecturer) {
        updateLecturer(initialLecturer.lecturerId, lecturerData);
      } else {
        addLecturer(lecturerData);
      }
      setIsSubmitting(false);
      onClose();
    }, 550);
  };

  const toggleCourse = (code: string) => {
    setSelectedCourses(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {initialLecturer ? 'Edit Faculty Lecturer' : 'Add New Lecturer'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Department of Computer Science Academic Staff</p>
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

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Academic Title (Optional)
              </label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="" className="dark:bg-zinc-900">None (Optional)</option>
                <option value="Prof." className="dark:bg-zinc-900">Prof.</option>
                <option value="Professor" className="dark:bg-zinc-900">Professor</option>
                <option value="Assoc. Prof." className="dark:bg-zinc-900">Assoc. Prof.</option>
                <option value="Associate Professor" className="dark:bg-zinc-900">Associate Professor</option>
                <option value="Senior Lecturer" className="dark:bg-zinc-900">Senior Lecturer</option>
                <option value="Lecturer" className="dark:bg-zinc-900">Lecturer</option>
                <option value="Assistant Lecturer" className="dark:bg-zinc-900">Assistant Lecturer</option>
                <option value="Dr." className="dark:bg-zinc-900">Dr.</option>
                <option value="Mr." className="dark:bg-zinc-900">Mr.</option>
                <option value="Mrs." className="dark:bg-zinc-900">Mrs.</option>
                <option value="Ms." className="dark:bg-zinc-900">Ms.</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kenneth Dadedzi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Staff Email Address
              </label>
              <input
                type="email"
                placeholder="staff@ug.edu.gh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Phone Contact
              </label>
              <input
                type="text"
                placeholder="+233 24 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Max Teaching Hours / Week
              </label>
              <input
                type="number"
                min={2}
                max={30}
                value={maxWeeklyHours}
                onChange={(e) => setMaxWeeklyHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Faculty Staff ID
              </label>
              <input
                type="text"
                readOnly
                value={lecturerId}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 text-xs font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {initialLecturer && (
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Account Status
              </label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value as 'active' | 'unclaimed' | 'suspended')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="active" className="dark:bg-zinc-900">Active (Linked & Authorized)</option>
                <option value="unclaimed" className="dark:bg-zinc-900">Unclaimed (Pending Faculty Sign-up)</option>
                <option value="suspended" className="dark:bg-zinc-900">Suspended (Access Disabled)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Teaching Allocations / Specializations
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 space-y-1.5 custom-scrollbar">
              {courses.map(course => (
                <label 
                  key={course.courseCode} 
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.courseCode)}
                    onChange={() => toggleCourse(course.courseCode)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-zinc-900 dark:text-white">{course.courseCode}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 truncate">{course.courseTitle}</span>
                </label>
              ))}
            </div>
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center select-none"
            >
              <LoadingButtonContent
                loading={isSubmitting}
                loadingText={initialLecturer ? 'Saving' : 'Registering'}
                defaultText={initialLecturer ? 'Save' : 'Register'}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
