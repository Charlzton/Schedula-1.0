'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, CalendarDays, Check, AlertCircle } from 'lucide-react';
import { TimeSlot } from '@/lib/dataset';
import { useTimetable } from '@/context/TimetableContext';

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlot?: TimeSlot | null;
}

export function TimeSlotModal({ isOpen, onClose, initialSlot }: TimeSlotModalProps) {
  const { addTimeSlot, updateTimeSlot } = useTimetable();

  const [slotId, setSlotId] = useState('');
  const [day, setDay] = useState<TimeSlot['day']>('Monday');
  const [periodNumber, setPeriodNumber] = useState(1);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:30');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [sessionType, setSessionType] = useState<TimeSlot['sessionType']>('Theory');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSlot) {
      setSlotId(initialSlot.slotId);
      setDay(initialSlot.day || 'Monday');
      setPeriodNumber(initialSlot.periodNumber ?? 1);
      setStartTime(initialSlot.startTime || '07:30');
      setEndTime(initialSlot.endTime || '09:30');
      setDurationMinutes(initialSlot.durationMinutes ?? (initialSlot.durationHours ? initialSlot.durationHours * 60 : 120));
      setSessionType(initialSlot.sessionType || 'Theory');
    } else {
      setSlotId(`TS-${Math.floor(100 + Math.random() * 900)}`);
      setDay('Monday');
      setPeriodNumber(1);
      setStartTime('07:30');
      setEndTime('09:30');
      setDurationMinutes(120);
      setSessionType('Theory');
    }
    setValidationError(null);
  }, [initialSlot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!startTime || !endTime) {
      setValidationError('Start time and end time are required.');
      return;
    }

    const slotData: TimeSlot = {
      slotId: slotId.trim().toUpperCase(),
      day,
      periodNumber: Number(periodNumber),
      startTime,
      endTime,
      durationHours: Number(durationMinutes) / 60,
      durationMinutes: Number(durationMinutes),
      sessionType
    };

    if (initialSlot) {
      updateTimeSlot(initialSlot.slotId, slotData);
    } else {
      addTimeSlot(slotData);
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
        className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {initialSlot ? 'Edit Time Slot' : 'Create Custom Time Slot'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">University Schedule Period Grid</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Day of Week
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all cursor-pointer"
              >
                <option value="Monday" className="dark:bg-zinc-900">Monday</option>
                <option value="Tuesday" className="dark:bg-zinc-900">Tuesday</option>
                <option value="Wednesday" className="dark:bg-zinc-900">Wednesday</option>
                <option value="Thursday" className="dark:bg-zinc-900">Thursday</option>
                <option value="Friday" className="dark:bg-zinc-900">Friday</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all cursor-pointer"
              >
                <option value="Theory" className="dark:bg-zinc-900">Theory (2h block)</option>
                <option value="Lab / Practical" className="dark:bg-zinc-900">Lab / Practical (1-2h)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                End Time *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Period Sequence
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={30}
                max={360}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
              />
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialSlot ? 'Save Changes' : 'Create Time Slot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
