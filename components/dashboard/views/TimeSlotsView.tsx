'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  CalendarDays, 
  Layers, 
  Edit3, 
  Trash2, 
  CheckCircle,
  Sparkles,
  X
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { TimeSlot } from '@/lib/dataset';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

interface TimeSlotsViewProps {
  onOpenAddTimeSlot: () => void;
  onEditTimeSlot: (slot: TimeSlot) => void;
}

export function TimeSlotsView({ onOpenAddTimeSlot, onEditTimeSlot }: TimeSlotsViewProps) {
  const { timeSlots, deleteTimeSlot, bulkDeleteTimeSlots, schedules } = useTimetable();
  const [dayFilter, setDayFilter] = useState<string>('All');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Delete modal state
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [deletingSlotName, setDeletingSlotName] = useState<string>('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const filteredSlots = timeSlots.filter(s => {
    return dayFilter === 'All' || s.day === dayFilter;
  });

  const handleSelectAll = () => {
    const allFilteredIds = filteredSlots.map(s => s.slotId);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...allFilteredIds])));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = () => {
    if (deletingSlotId) {
      deleteTimeSlot(deletingSlotId);
      setSelectedIds(prev => prev.filter(id => id !== deletingSlotId));
      setDeletingSlotId(null);
      setDeletingSlotName('');
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      const count = selectedIds.length;
      bulkDeleteTimeSlots(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      setBulkSuccessMsg(`Successfully deleted ${count} selected time slot period(s).`);
      setTimeout(() => setBulkSuccessMsg(null), 4000);
    }
  };

  const isAllFilteredSelected = filteredSlots.length > 0 && filteredSlots.every(s => selectedIds.includes(s.slotId));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Academic Time Slots & Period Matrix
            </h2>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ({timeSlots.length} Period Blocks)
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Standardized lecture & practical period blocks • Monday through Friday (07:30 AM - 05:30 PM)
          </p>
        </div>

        <button
          id="add-new-timeslot-btn"
          onClick={onOpenAddTimeSlot}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          Add
        </button>
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

      {/* Day Filter Tabs and Select All */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 max-w-full">
          <button
            onClick={() => setDayFilter('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              dayFilter === 'All'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            All Days ({timeSlots.length})
          </button>
          {daysOfWeek.map(day => {
            const count = timeSlots.filter(s => s.day === day).length;
            return (
              <button
                key={day}
                onClick={() => setDayFilter(day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  dayFilter === day
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {day} ({count})
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSelectAll}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}
        </button>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-black/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 dark:text-amber-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'time slot' : 'time slots'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
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
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Daily Grouping Grid */}
      <div className="space-y-6">
        {(dayFilter === 'All' ? daysOfWeek : [dayFilter]).map(day => {
          const daySlots = timeSlots.filter(s => s.day === day).sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));

          return (
            <div 
              key={day}
              className="p-5 rounded-3xl glass-panel space-y-4"
            >
              <div className="flex items-center justify-center border-b border-zinc-200/60 dark:border-white/10 pb-3 text-center">
                <div className="flex items-center justify-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">{day}</h3>
                  <span className="text-[11px] text-zinc-400 font-medium">({daySlots.length} periods)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {daySlots.map(slot => {
                  const activeSessions = schedules.filter(
                    s => s.day === slot.day && s.periodNumber === slot.periodNumber
                  ).length;
                  const isSelected = selectedIds.includes(slot.slotId);

                  return (
                    <div
                      key={slot.slotId}
                      className={`p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:border-amber-500/40 transition-all space-y-2 group relative ${
                        isSelected ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(slot.slotId)}
                            aria-label={`Select slot ${slot.day} Period ${slot.periodNumber}`}
                            className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                          />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            Period {slot.periodNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                          <button
                            onClick={() => onEditTimeSlot(slot)}
                            className="p-1 text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit slot"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingSlotId(slot.slotId);
                              setDeletingSlotName(`${slot.day} Period ${slot.periodNumber} (${slot.startTime} - ${slot.endTime})`);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="font-bold text-sm text-zinc-900 dark:text-white">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {slot.sessionType} • {slot.durationMinutes || (slot.durationHours ? slot.durationHours * 60 : 120)} mins
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Active scheduled:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{activeSessions} classes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingSlotId}
        onClose={() => setDeletingSlotId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Time Slot?"
        itemName={deletingSlotName}
        itemType="time slot"
        description="Are you sure you want to delete this period block? Any scheduled classes in this slot will become unassigned."
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Time Slots?"
        itemName={`${selectedIds.length} Selected Time Slots`}
        itemType="time slots"
        description={`Are you sure you want to permanently delete these ${selectedIds.length} selected time slot periods? All scheduled sessions assigned to these slots will be unassigned.`}
      />
    </div>
  );
}
