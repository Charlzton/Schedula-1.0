'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  BookOpen, 
  GraduationCap, 
  Edit3, 
  Trash2,
  Clock,
  Briefcase,
  Phone,
  X
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { Lecturer } from '@/lib/dataset';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

interface LecturersViewProps {
  onOpenAddLecturer: () => void;
  onEditLecturer: (lecturer: Lecturer) => void;
}

export function LecturersView({ onOpenAddLecturer, onEditLecturer }: LecturersViewProps) {
  const { lecturers, deleteLecturer, bulkDeleteLecturers, schedules, courses } = useTimetable();

  const [searchTerm, setSearchTerm] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Single Delete modal state
  const [deletingLecturerId, setDeletingLecturerId] = useState<string | null>(null);
  const [deletingLecturerName, setDeletingLecturerName] = useState<string>('');

  const getEmail = (l: Lecturer) => l.email || `${l.fullName.toLowerCase().replace(/\s+/g, '.')}@ug.edu.gh`;
  const getCourses = (l: Lecturer): string[] => {
    if (Array.isArray(l.specializations)) return l.specializations;
    if (Array.isArray(l.assignedCourses)) return l.assignedCourses;
    return [];
  };

  const filteredLecturers = useMemo(() => {
    return lecturers.filter(l => {
      const email = getEmail(l);
      const assigned = getCourses(l);
      return (
        l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.department && l.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        assigned.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [lecturers, searchTerm]);

  const handleSelectAll = () => {
    const allFilteredIds = filteredLecturers.map(l => l.lecturerId);
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
    if (deletingLecturerId) {
      deleteLecturer(deletingLecturerId);
      setSelectedIds(prev => prev.filter(id => id !== deletingLecturerId));
      setDeletingLecturerId(null);
      setDeletingLecturerName('');
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      const count = selectedIds.length;
      bulkDeleteLecturers(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      setBulkSuccessMsg(`Successfully deleted ${count} selected lecturer profile(s).`);
      setTimeout(() => setBulkSuccessMsg(null), 4000);
    }
  };

  const isAllFilteredSelected = filteredLecturers.length > 0 && filteredLecturers.every(l => selectedIds.includes(l.lecturerId));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Academic Faculty & Lecturers
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {lecturers.length} Instructors
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Department of Computer Science • Faculty Instructors & Course Convenors
          </p>
        </div>

        <button
          id="add-new-lecturer-btn"
          onClick={onOpenAddLecturer}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lecturer</span>
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

      {/* Search & Bulk Select Toolbar */}
      <div className="p-4 rounded-3xl glass-panel space-y-3 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="lecturer-search-input"
              type="text"
              placeholder="Search faculty by name, email, or course code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/30 outline-none min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-black/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 dark:text-indigo-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'lecturer' : 'lecturers'} selected
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

      {/* Lecturers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLecturers.map((lec) => {
          const lecturerSchedules = schedules.filter(s => s.lecturerId === lec.lecturerId);
          const assignedCourses = getCourses(lec);
          const totalTeachingHours = lecturerSchedules.length * 2;
          const isSelected = selectedIds.includes(lec.lecturerId);

          return (
            <div
              key={lec.lecturerId}
              className={`p-5 rounded-3xl glass-panel space-y-4 hover:border-indigo-500/50 transition-all group relative ${
                isSelected ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10' : ''
              }`}
            >
              {/* Top Details */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(lec.lecturerId)}
                    aria-label={`Select lecturer ${lec.fullName}`}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {lec.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {lec.title} {lec.fullName}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">ID: {lec.lecturerId}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 truncate">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{getEmail(lec)}</span>
                </div>
                {lec.phone && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{lec.phone}</span>
                  </div>
                )}
              </div>

              {/* Workload Stats */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Weekly Scheduled</span>
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    {totalTeachingHours}h / {lec.maxWeeklyHours || 12}h
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Active Courses</span>
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    {assignedCourses.length} courses
                  </span>
                </div>
              </div>

              {/* Specializations Badges */}
              {assignedCourses.length > 0 && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10">
                  <div className="flex flex-wrap gap-1.5">
                    {assignedCourses.slice(0, 4).map(code => (
                      <span
                        key={code}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      >
                        {code}
                      </span>
                    ))}
                    {assignedCourses.length > 4 && (
                      <span className="text-[10px] text-zinc-400 px-1.5 py-0.5">
                        +{assignedCourses.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-2 no-print">
                <button
                  onClick={() => onEditLecturer(lec)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    setDeletingLecturerId(lec.lecturerId);
                    setDeletingLecturerName(`${lec.title} ${lec.fullName}`);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingLecturerId}
        onClose={() => setDeletingLecturerId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Faculty Lecturer?"
        itemName={deletingLecturerName}
        itemType="lecturer"
        description="Are you sure you want to remove this faculty instructor? Any scheduled sessions assigned to this lecturer will become unassigned."
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Lecturers?"
        itemName={`${selectedIds.length} Selected Lecturers`}
        itemType="lecturers"
        description={`Are you sure you want to permanently delete these ${selectedIds.length} selected lecturer profiles? All corresponding course teaching assignments will become unassigned.`}
      />
    </div>
  );
}
