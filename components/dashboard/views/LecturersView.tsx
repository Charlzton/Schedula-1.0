'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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

  const { user, updateAdminRole } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [searchTerm, setSearchTerm] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Single Delete modal state
  const [deletingLecturerId, setDeletingLecturerId] = useState<string | null>(null);
  const [deletingLecturerName, setDeletingLecturerName] = useState<string>('');

  // Super Admin Role Management state
  const [openRolesDropdownId, setOpenRolesDropdownId] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, 'lecturer' | 'admin' | 'super_admin'>>({});
  const rolesDropdownRef = useRef<HTMLDivElement>(null);

  // Listen to authoritative users collection for real-time role state when user is admin
  useEffect(() => {
    if (!db || !user || (user.role !== 'super_admin' && user.role !== 'admin')) return;
    
    let isMounted = true;
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!isMounted) return;
        const map: Record<string, 'lecturer' | 'admin' | 'super_admin'> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const r = data.role as 'lecturer' | 'admin' | 'super_admin';
          if (r) {
            map[docSnap.id] = r;
            if (data.email) map[data.email.toLowerCase()] = r;
            if (data.lecturerId) map[data.lecturerId] = r;
          }
        });
        setUserRolesMap(map);
      }, () => {});
    } catch {
      // Graceful fallback to cached state
    }

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [user]);

  // Close roles dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(e.target as Node)) {
        setOpenRolesDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getEmail = (l: Lecturer) => l.email || l.officeEmail || `${l.fullName.toLowerCase().replace(/\s+/g, '.')}@ug.edu.gh`;
  
  const getCourses = (l: Lecturer): string[] => {
    if (Array.isArray(l.specializations)) return l.specializations;
    if (Array.isArray(l.assignedCourses)) return l.assignedCourses;
    return [];
  };

  const getLecturerRole = (l: Lecturer): 'lecturer' | 'admin' | 'super_admin' => {
    const email = getEmail(l).toLowerCase();
    return (
      (l.lecturerId && userRolesMap[l.lecturerId]) ||
      (email && userRolesMap[email]) ||
      (l.authUid && userRolesMap[l.authUid]) ||
      l.role ||
      'lecturer'
    );
  };

  const handleRoleChange = async (lec: Lecturer, newRole: 'lecturer' | 'admin' | 'super_admin') => {
    setOpenRolesDropdownId(null);
    setIsUpdatingRole(lec.lecturerId);
    try {
      const email = getEmail(lec);
      const targetUserId = lec.authUid || '';
      const res = await updateAdminRole(targetUserId, newRole, {
        lecturerId: lec.lecturerId,
        email: email
      });

      if (res.success) {
        // Optimistically update role map for instant UI responsiveness
        setUserRolesMap(prev => ({
          ...prev,
          [lec.lecturerId]: newRole,
          [email.toLowerCase()]: newRole,
          ...(lec.authUid ? { [lec.authUid]: newRole } : {})
        }));
        const roleLabel = newRole === 'super_admin' ? 'Super Admin' : newRole === 'admin' ? 'Admin' : 'Lecturer';
        setRoleFeedback({
          type: 'success',
          message: `Role for ${lec.title} ${lec.fullName} updated to ${roleLabel}.`
        });
        setTimeout(() => setRoleFeedback(null), 4000);
      } else {
        setRoleFeedback({
          type: 'error',
          message: res.error || 'Failed to update system role.'
        });
        setTimeout(() => setRoleFeedback(null), 5000);
      }
    } catch (err: any) {
      setRoleFeedback({
        type: 'error',
        message: err?.message || 'Failed to update system role.'
      });
      setTimeout(() => setRoleFeedback(null), 5000);
    } finally {
      setIsUpdatingRole(null);
    }
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
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer self-start sm:self-auto"
          title="Add Lecturer"
          aria-label="Add Lecturer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Role Change Feedback */}
      {roleFeedback && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in-50 ${
          roleFeedback.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {roleFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{roleFeedback.message}</span>
          </div>
          <button 
            onClick={() => setRoleFeedback(null)} 
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
          const currentRole = getLecturerRole(lec);

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

                {/* Role & Account Status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentRole !== 'lecturer' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      {currentRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize">
                    {lec.accountStatus}
                  </span>
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
              <div className="pt-2.5 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-2 no-print relative">
                {/* Roles Dropdown (Super Admin Only) */}
                {isSuperAdmin && (
                  <div 
                    className="relative" 
                    ref={openRolesDropdownId === lec.lecturerId ? rolesDropdownRef : null}
                  >
                    <button
                      onClick={() => setOpenRolesDropdownId(openRolesDropdownId === lec.lecturerId ? null : lec.lecturerId)}
                      disabled={isUpdatingRole === lec.lecturerId}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
                      title="Manage system role"
                    >
                      {isUpdatingRole === lec.lecturerId ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      ) : null}
                      <span>Roles</span>
                      <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${openRolesDropdownId === lec.lecturerId ? 'rotate-180' : ''}`} />
                    </button>

                    {openRolesDropdownId === lec.lecturerId && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-40 p-1.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/60 dark:border-white/10 mb-1">
                          System Role
                        </div>
                        {[
                          { id: 'lecturer', label: 'Lecturer' },
                          { id: 'admin', label: 'Admin' },
                          { id: 'super_admin', label: 'Super Admin' }
                        ].map((r) => {
                          const isCurrent = currentRole === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => handleRoleChange(lec, r.id as 'lecturer' | 'admin' | 'super_admin')}
                              disabled={isCurrent || isUpdatingRole === lec.lecturerId}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
                              }`}
                            >
                              <span>{r.label}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

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
