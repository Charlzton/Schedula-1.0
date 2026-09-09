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
  X,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { Lecturer } from '@/lib/dataset';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

interface LecturersViewProps {
  onOpenAddLecturer: () => void;
  onEditLecturer: (lecturer: Lecturer) => void;
}

export function LecturersView({ onOpenAddLecturer, onEditLecturer }: LecturersViewProps) {
  const { 
    lecturers, 
    deleteLecturer, 
    suspendLecturer,
    reactivateLecturer,
    bulkDeleteLecturers, 
    schedules, 
    courses 
  } = useTimetable();

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
              Academic Faculty
            </h2>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {lecturers.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Department of Computer Science • Faculty directory
          </p>
        </div>

        <button
          id="add-new-lecturer-btn"
          onClick={onOpenAddLecturer}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add lecturer</span>
        </button>
      </div>

      {/* Success Notification */}
      {bulkSuccessMsg && (
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{bulkSuccessMsg}</span>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Bulk Select Toolbar */}
      <div className="space-y-3 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="lecturer-search-input"
              type="text"
              placeholder="Search faculty by name, email, or course code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isAllFilteredSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 shadow-xl border border-white/20 dark:border-black/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-300 dark:text-zinc-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'lecturer' : 'lecturers'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
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
              className={`p-5 rounded-3xl glass-panel space-y-3.5 hover:border-zinc-300 dark:hover:border-white/20 transition-all group relative ${
                isSelected ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : ''
              }`}
            >
              {/* Top Details */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(lec.lecturerId)}
                    aria-label={`Select lecturer ${lec.fullName}`}
                    className="w-4 h-4 mt-1 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-semibold text-xs shrink-0 border border-zinc-200 dark:border-zinc-700">
                    {lec.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {lec.title} {lec.fullName}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">ID: {lec.lecturerId}</p>
                  </div>
                </div>

                {/* Account Status */}
                <div className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize">
                  {lec.accountStatus}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-1 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{getEmail(lec)}</span>
                </div>
                {lec.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{lec.phone}</span>
                  </div>
                )}
              </div>

              {/* Workload Stats (Flattened - no nested cards) */}
              <div className="grid grid-cols-2 gap-4 py-2 border-t border-zinc-200/60 dark:border-white/10 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Weekly Teaching</span>
                  <span className="font-semibold text-zinc-900 dark:text-white mt-0.5 block">
                    {totalTeachingHours}h / {lec.maxWeeklyHours || 12}h
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 block">Assigned Courses</span>
                  <span className="font-semibold text-zinc-900 dark:text-white mt-0.5 block">
                    {assignedCourses.length} courses
                  </span>
                </div>
              </div>

              {/* Assigned Courses */}
              {assignedCourses.length > 0 && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10">
                  <div className="flex flex-wrap gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="text-[11px] text-zinc-400">Courses:</span>
                    {assignedCourses.slice(0, 4).map(code => (
                      <span
                        key={code}
                        className="font-medium text-zinc-800 dark:text-zinc-200 font-mono text-[11px]"
                      >
                        {code}
                      </span>
                    ))}
                    {assignedCourses.length > 4 && (
                      <span className="text-[11px] text-zinc-400">
                        +{assignedCourses.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2.5 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-2 no-print">
                <button
                  onClick={() => onEditLecturer(lec)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Edit
                </button>

                {lec.accountStatus === 'suspended' ? (
                  <button
                    onClick={() => reactivateLecturer(lec.lecturerId)}
                    title="Reactivate faculty account"
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Reactivate
                  </button>
                ) : (
                  <button
                    onClick={() => suspendLecturer(lec.lecturerId)}
                    title="Suspend faculty account"
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Suspend
                  </button>
                )}

                <button
                  onClick={() => {
                    setDeletingLecturerId(lec.lecturerId);
                    setDeletingLecturerName(`${lec.title} ${lec.fullName}`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Delete
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
