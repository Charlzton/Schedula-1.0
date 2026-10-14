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
  AlertCircle,
  List,
  LayoutGrid
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Lecturer } from '@/lib/dataset';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';
import { getLecturerDisplayName } from '@/lib/lecturerUtils';

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

  // Display Mode state (Default to 'list' view as preferred per specification)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Load saved preference on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('schedula_lecturers_view_mode');
      if (saved === 'grid' || saved === 'list') {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('schedula_lecturers_view_mode', mode);
    } catch {}
  };

  const [searchTerm, setSearchTerm] = useState('');

  // Bulk selection state (preserved across view mode switching)
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

  const getEmail = (l: Lecturer) => l.email || l.officeEmail || `${getLecturerDisplayName(l).toLowerCase().replace(/[^a-z0-9]+/g, '.')}@ug.edu.gh`;
  
  const getCourses = (l: Lecturer): string[] => {
    if (Array.isArray(l.specializations)) return l.specializations;
    if (Array.isArray(l.assignedCourses)) return l.assignedCourses;
    if (typeof l.assignedCourses === 'string') return l.assignedCourses.split(',').map(s => s.trim()).filter(Boolean);
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
        const displayName = getLecturerDisplayName(lec);
        setRoleFeedback({
          type: 'success',
          message: `Role for ${displayName} updated to ${roleLabel}.`
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
    const query = searchTerm.toLowerCase().trim();
    if (!query) return lecturers;

    return lecturers.filter(l => {
      const email = getEmail(l).toLowerCase();
      const assigned = getCourses(l);
      const cleanName = getLecturerDisplayName(l).toLowerCase();
      const rawFullName = (l.fullName || '').toLowerCase();
      const title = (l.title || '').toLowerCase();
      const dept = (l.department || '').toLowerCase();
      const id = (l.lecturerId || '').toLowerCase();

      return (
        cleanName.includes(query) ||
        rawFullName.includes(query) ||
        id.includes(query) ||
        email.includes(query) ||
        title.includes(query) ||
        dept.includes(query) ||
        assigned.some(c => c.toLowerCase().includes(query))
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
    <div className="space-y-6 pb-12 font-system">
      {/* 1. Centered Bold Page Heading */}
      <div className="text-center py-2 shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center">
          Lecturers
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          Manage academic faculty members, departmental course workloads, and portal roles.
        </p>
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
            type="button"
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
          <button 
            type="button"
            onClick={() => setBulkSuccessMsg(null)} 
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search, Selection, View Toggle & Action Toolbar */}
      <div className="space-y-3 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="lecturer-search-input"
              type="text"
              placeholder="Search faculty by name, email, department, or course code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            {/* Compact List / Grid View Switcher */}
            <div 
              role="group" 
              aria-label="View mode toggle" 
              className="flex items-center gap-0.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 shrink-0"
            >
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="List view"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">List</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Grid view"
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
            </div>

            {/* Select All Button */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isAllFilteredSelected ? 'Deselect all' : 'Select all'}
            </button>

            {/* Add Lecturer button */}
            <button
              id="add-new-lecturer-btn"
              type="button"
              onClick={onOpenAddLecturer}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer shrink-0"
              title="Add Lecturer"
              aria-label="Add Lecturer"
            >
              <Plus className="w-4 h-4" />
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
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLecturers.length === 0 && (
        <div className="p-12 text-center glass-panel rounded-3xl space-y-3">
          <Users className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No faculty lecturers found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm 
              ? `No lecturers matching "${searchTerm}". Try a different name, email, or department.`
              : 'No faculty profiles have been added or imported yet.'}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LIST VIEW (Default Mode - Compact, Aligned Table)                       */}
      {/* ========================================================================= */}
      {viewMode === 'list' && filteredLecturers.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  {/* Dedicated Checkbox Selection Column */}
                  <th scope="col" className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all lecturers"
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                  </th>
                  <th scope="col" className="w-20 px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">ID</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">Lecturer Name</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">Email</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">Department</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">Title / Rank</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">Teaching Load</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400">Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                {filteredLecturers.map((lec) => {
                  const lecturerSchedules = schedules.filter(s => s.lecturerId === lec.lecturerId);
                  const assignedCourses = getCourses(lec);
                  const totalTeachingHours = lecturerSchedules.length * 2;
                  const isSelected = selectedIds.includes(lec.lecturerId);
                  const currentRole = getLecturerRole(lec);
                  const displayName = getLecturerDisplayName(lec);
                  const email = getEmail(lec);

                  return (
                    <tr
                      key={lec.lecturerId}
                      className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                        isSelected ? 'bg-blue-50/60 dark:bg-blue-900/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(lec.lecturerId)}
                          aria-label={`Select lecturer ${displayName}`}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>

                      {/* ID */}
                      <td className="w-20 px-3 py-2.5 font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {lec.lecturerId}
                      </td>

                      {/* Lecturer Name (Primary Information, without prepended titles) */}
                      <td className="px-3 py-2.5 font-semibold text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-[11px] shrink-0 border border-zinc-200/70 dark:border-white/10">
                            {displayName.charAt(0)}
                          </div>
                          <span className="truncate max-w-[200px]" title={displayName}>
                            {displayName}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        <a 
                          href={`mailto:${email}`} 
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                          title={email}
                        >
                          {email}
                        </a>
                      </td>

                      {/* Department */}
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 truncate max-w-[160px]" title={lec.department || 'Department of Computer Science'}>
                        {lec.department || 'Department of Computer Science'}
                      </td>

                      {/* Title / Academic Rank (Optional, clean display) */}
                      <td className="px-3 py-2.5 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                        {lec.title ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10">
                            {lec.title}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Teaching Load */}
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        <span className="font-medium text-zinc-900 dark:text-white">{assignedCourses.length}</span>
                        <span className="text-zinc-400 text-[11px]"> courses • </span>
                        <span className="font-medium text-zinc-900 dark:text-white">{totalTeachingHours}h</span>
                        <span className="text-zinc-400 text-[11px]">/{lec.maxWeeklyHours || 12}h</span>
                      </td>

                      {/* Account Status & Role */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {currentRole !== 'lecturer' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              {currentRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                          )}
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                            lec.accountStatus === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                              : lec.accountStatus === 'suspended'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {lec.accountStatus || 'unclaimed'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Super Admin Role Toggle */}
                          {isSuperAdmin && (
                            <div className="relative inline-block text-left" ref={openRolesDropdownId === lec.lecturerId ? rolesDropdownRef : undefined}>
                              <button
                                type="button"
                                onClick={() => setOpenRolesDropdownId(openRolesDropdownId === lec.lecturerId ? null : lec.lecturerId)}
                                disabled={isUpdatingRole === lec.lecturerId}
                                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                title="Manage Role"
                                aria-label="Manage Role"
                              >
                                {isUpdatingRole === lec.lecturerId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                ) : (
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                )}
                              </button>

                              {openRolesDropdownId === lec.lecturerId && (
                                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl glass-dropdown p-1.5 z-50 border border-zinc-200/80 dark:border-white/10 shadow-xl space-y-1">
                                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    Assign System Role
                                  </div>
                                  {[
                                    { id: 'lecturer', label: 'Faculty Lecturer' },
                                    { id: 'admin', label: 'Administrator' },
                                    { id: 'super_admin', label: 'Super Administrator' }
                                  ].map((r) => {
                                    const isCurrent = currentRole === r.id;
                                    return (
                                      <button
                                        key={r.id}
                                        type="button"
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
                            type="button"
                            onClick={() => onEditLecturer(lec)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit Lecturer"
                            aria-label="Edit Lecturer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {lec.accountStatus === 'suspended' ? (
                            <button
                              type="button"
                              onClick={() => reactivateLecturer(lec.lecturerId)}
                              title="Reactivate account"
                              aria-label="Reactivate account"
                              className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => suspendLecturer(lec.lecturerId)}
                              title="Suspend account"
                              aria-label="Suspend account"
                              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setDeletingLecturerId(lec.lecturerId);
                              setDeletingLecturerName(displayName);
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Lecturer"
                            aria-label="Delete Lecturer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GRID / CARD VIEW (Preserved Layout with Corrected Name Display)        */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && filteredLecturers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLecturers.map((lec) => {
            const lecturerSchedules = schedules.filter(s => s.lecturerId === lec.lecturerId);
            const assignedCourses = getCourses(lec);
            const totalTeachingHours = lecturerSchedules.length * 2;
            const isSelected = selectedIds.includes(lec.lecturerId);
            const currentRole = getLecturerRole(lec);
            const displayName = getLecturerDisplayName(lec);
            const email = getEmail(lec);

            return (
              <div
                key={lec.lecturerId}
                className={`p-5 rounded-3xl glass-panel space-y-3.5 hover:border-zinc-300 dark:hover:border-white/20 transition-all group relative ${
                  isSelected ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : ''
                }`}
              >
                {/* Top Details & Distinct Selection Checkbox */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Dedicated visual position for selection checkbox */}
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(lec.lecturerId)}
                        aria-label={`Select lecturer ${displayName}`}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-semibold text-xs shrink-0 border border-zinc-200 dark:border-zinc-700">
                      {displayName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Lecturer actual name displayed without prepended duplicate titles */}
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate" title={displayName}>
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-500 font-mono">ID: {lec.lecturerId}</span>
                        {lec.title && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/10 font-medium">
                            {lec.title}
                          </span>
                        )}
                      </div>
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
                      {lec.accountStatus || 'unclaimed'}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-1 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                  {lec.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{lec.phone}</span>
                    </div>
                  )}
                </div>

                {/* Workload Stats */}
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

                {/* Assigned Courses Chips */}
                {assignedCourses.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10">
                    <span className="text-[11px] text-zinc-500 mb-1.5 block">Course Portfolio</span>
                    <div className="flex flex-wrap gap-1">
                      {assignedCourses.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/10"
                        >
                          {c}
                        </span>
                      ))}
                      {assignedCourses.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] text-zinc-400">
                          +{assignedCourses.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/10 relative">
                  {/* Super Admin Manage Role Dropdown */}
                  {isSuperAdmin && (
                    <div className="relative" ref={openRolesDropdownId === lec.lecturerId ? rolesDropdownRef : undefined}>
                      <button
                        type="button"
                        onClick={() => setOpenRolesDropdownId(openRolesDropdownId === lec.lecturerId ? null : lec.lecturerId)}
                        disabled={isUpdatingRole === lec.lecturerId}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                        title="Manage system role"
                      >
                        {isUpdatingRole === lec.lecturerId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        <span>Role</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {openRolesDropdownId === lec.lecturerId && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-44 rounded-2xl glass-dropdown p-1.5 z-50 border border-zinc-200/80 dark:border-white/10 shadow-xl space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Assign System Role
                          </div>
                          {[
                            { id: 'lecturer', label: 'Faculty Lecturer' },
                            { id: 'admin', label: 'Administrator' },
                            { id: 'super_admin', label: 'Super Administrator' }
                          ].map((r) => {
                            const isCurrent = currentRole === r.id;
                            return (
                              <button
                                key={r.id}
                                type="button"
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
                    type="button"
                    onClick={() => onEditLecturer(lec)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>

                  {lec.accountStatus === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => reactivateLecturer(lec.lecturerId)}
                      title="Reactivate faculty account"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Reactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => suspendLecturer(lec.lecturerId)}
                      title="Suspend faculty account"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Suspend
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDeletingLecturerId(lec.lecturerId);
                      setDeletingLecturerName(displayName);
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
      )}

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
