'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { LectureFacility, Course } from '@/lib/dataset';
import { RoomBookingRequest } from '@/lib/lecturerTypes';
import { useAuth } from '@/context/AuthContext';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';

interface RoomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: LectureFacility | null;
  defaultDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  defaultSlot: string;
  courses: Course[];
  onSubmit: (request: Omit<RoomBookingRequest, 'id' | 'submittedAt' | 'status'>) => Promise<void> | void;
}

export function RoomBookingModal({
  isOpen,
  onClose,
  facility,
  defaultDay,
  defaultSlot,
  courses,
  onSubmit
}: RoomBookingModalProps) {
  const { user, lecturerProfile } = useAuth();

  const [day, setDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(defaultDay);
  const [timeSlot, setTimeSlot] = useState<string>(defaultSlot);
  const [courseCode, setCourseCode] = useState<string>(courses[0]?.courseCode || 'DCIT 201');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(facility ? Math.min(60, facility.capacity) : 50);
  const [purpose, setPurpose] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (expectedAttendance <= 0) {
      setError('Please enter a valid student attendance count.');
      return;
    }

    if (expectedAttendance > facility.capacity) {
      setError(`Expected attendance (${expectedAttendance}) exceeds venue capacity (${facility.capacity}).`);
      return;
    }

    const selectedCourse = courses.find(c => c.courseCode === courseCode);
    const courseTitle = selectedCourse?.courseTitle || 'Academic Session';

    setIsSubmitting(true);
    try {
      await onSubmit({
        userId: user?.id,
        lecturerId: lecturerProfile?.lecturerId || user?.lecturerId || '',
        lecturerName: lecturerProfile?.fullName || user?.name || 'Faculty Member',
        lecturerEmail: user?.email || '',
        hallId: facility.hallId,
        hallName: facility.hallName,
        buildingLocation: facility.buildingLocation,
        day,
        timeSlot,
        courseCode,
        courseTitle,
        expectedAttendance,
        purpose: purpose.trim() || 'Academic lecture / review session'
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit room request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-system">
      <div 
        className="w-full max-w-lg rounded-3xl liquid-glass border border-zinc-200/80 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Request Room Reservation
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Submit an ad-hoc booking for {facility.hallName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {/* Selected Venue Summary */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-900 dark:text-white">
                {facility.hallName}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Capacity: <strong className="text-zinc-900 dark:text-white">{facility.capacity}</strong>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {facility.buildingLocation} • {facility.venueType}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Schedule Period Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Day of Week
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as any)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="07:30 - 09:30">07:30 - 09:30</option>
                <option value="09:30 - 11:30">09:30 - 11:30</option>
                <option value="11:30 - 13:30">11:30 - 13:30</option>
                <option value="13:30 - 15:30">13:30 - 15:30</option>
                <option value="15:30 - 17:30">15:30 - 17:30</option>
                <option value="17:30 - 19:30">17:30 - 19:30</option>
              </select>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Course
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {courses.map((c) => (
                <option key={c.courseCode} value={c.courseCode}>
                  {c.courseCode} — {c.courseTitle} (Level {c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Expected Attendance */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Expected Attendance (Max: {facility.capacity})
            </label>
            <input
              type="number"
              min={1}
              max={facility.capacity}
              value={expectedAttendance}
              onChange={(e) => setExpectedAttendance(parseInt(e.target.value) || 0)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Purpose / Justification */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Purpose / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Mid-semester make-up session, tutorial review, or laboratory practical"
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-75 select-none"
            >
              {isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Submitted</span>
                </>
              ) : (
                <LoadingButtonContent
                  loading={isSubmitting}
                  loadingText="Submitting"
                  defaultText="Submit Request"
                />
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
