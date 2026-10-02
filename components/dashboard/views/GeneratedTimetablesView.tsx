'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CalendarDays, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Clock, 
  Building2, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  LayoutGrid,
  List,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Loader2,
  Globe,
  Calendar,
  X
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';
import { TimetableEntry } from '@/lib/dataset';
import { 
  exportGeneratedTimetablePDF, 
  exportGeneratedTimetableExcel, 
  exportGeneratedTimetableCSV, 
  printTimetable 
} from '@/lib/exportUtils';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

export function GeneratedTimetablesView() {
  const { 
    schedules, 
    courses, 
    facilities, 
    lecturers, 
    timeSlots,
    deleteScheduleEntry, 
    bulkDeleteSchedules,
    selectedSemester, 
    setSelectedSemester,
    academicPeriods,
    currentAcademicYear,
    setCurrentAcademicYear,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
    generateOptimizedTimetable
  } = useTimetable();

  const { user } = useAuth();
  const { showToast } = useToast();
  const canManageSchedules = user?.role === 'admin' || user?.role === 'super_admin';

  const [levelFilter, setLevelFilter] = useState<'All' | '100' | '200' | '300' | '400'>('All');
  const [hallFilter, setHallFilter] = useState<string>('All');
  const [lecturerFilter, setLecturerFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Export dropdown state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-generation loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  // Delete modal state
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [deleteEntryName, setDeleteEntryName] = useState<string>('');

  // Bulk selection & deletion state
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteSuccessMsg, setBulkDeleteSuccessMsg] = useState<string | null>(null);

  const targetSemester = selectedSemester === 'All' ? 'Semester 1' : selectedSemester;
  const currentPeriod = useMemo(() => {
    return academicPeriods.find(
      p => p.academicYear === currentAcademicYear && p.semester === targetSemester
    );
  }, [academicPeriods, currentAcademicYear, targetSemester]);

  const isCurrentPeriodPublished = useMemo(() => {
    if (currentPeriod) return currentPeriod.isPublished;
    return schedules.some(
      s => s.status === 'published' && 
           (!s.academicYear || s.academicYear === currentAcademicYear) && 
           (selectedSemester === 'All' || s.semester === selectedSemester)
    );
  }, [currentPeriod, schedules, currentAcademicYear, selectedSemester]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timePeriods = [
    { label: '07:30 - 09:30', periodNumber: 1, type: 'Theory' },
    { label: '09:30 - 11:30', periodNumber: 2, type: 'Theory' },
    { label: '11:30 - 13:30', periodNumber: 3, type: 'Theory' },
    { label: '13:30 - 15:30', periodNumber: 4, type: 'Theory' },
    { label: '15:30 - 17:30', periodNumber: 5, type: 'Lab / Practical' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchesYear = !s.academicYear || s.academicYear === currentAcademicYear;

      const matchesSearch = 
        s.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lecturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.hallName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSemester = selectedSemester === 'All' || s.semester === selectedSemester;
      const matchesLevel = levelFilter === 'All' || s.level.toString() === levelFilter;
      const matchesHall = hallFilter === 'All' || s.hallId === hallFilter;
      const matchesLecturer = lecturerFilter === 'All' || s.lecturerId === lecturerFilter;

      return matchesYear && matchesSearch && matchesSemester && matchesLevel && matchesHall && matchesLecturer;
    });
  }, [schedules, currentAcademicYear, searchTerm, selectedSemester, levelFilter, hallFilter, lecturerFilter]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateMessage(null);
    try {
      const count = generateOptimizedTimetable();
      showToast(`Generated ${count} timetable allocations for ${currentAcademicYear}.`);
    } catch (err: any) {
      showToast('Failed to generate timetable.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    setPublishMessage(null);
    try {
      if (isCurrentPeriodPublished) {
        await unpublishCurrentTimetable(currentAcademicYear, targetSemester);
        showToast(`Timetable for ${currentAcademicYear} ${targetSemester} reverted to Draft.`);
      } else {
        await publishCurrentTimetable(currentAcademicYear, targetSemester);
        showToast(`Timetable for ${currentAcademicYear} ${targetSemester} published.`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update publishing status.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteEntryId) {
      deleteScheduleEntry(deleteEntryId);
      setDeleteEntryId(null);
      setDeleteEntryName('');
      showToast('Session removed from timetable.');
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredSchedules.map(s => s.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedScheduleIds.includes(id));
    if (isAllSelected) {
      setSelectedScheduleIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedScheduleIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedScheduleIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    if (!selectedScheduleIds.length) return;
    setIsBulkDeleting(true);
    try {
      const count = selectedScheduleIds.length;
      bulkDeleteSchedules(selectedScheduleIds);
      setSelectedScheduleIds([]);
      setIsBulkDeleteModalOpen(false);
      showToast(`Deleted ${count} session${count > 1 ? 's' : ''}.`);
    } catch (err: any) {
      console.error('Failed bulk deleting schedules:', err);
      showToast('Failed to delete sessions.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print-Only Official Document Header */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-black">UNIVERSITY OF GHANA</h1>
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-700 mt-0.5">College of Basic and Applied Sciences • Department of Computer Science</h2>
            <h3 className="text-sm font-bold text-black mt-1">Master Academic Timetable Schedule</h3>
          </div>
          <div className="text-right text-xs text-black leading-tight">
            <p className="font-semibold">Academic Year: {currentAcademicYear}</p>
            <p className="font-semibold">Semester: {selectedSemester}</p>
            <p className="text-zinc-600 text-[10px] mt-1">Status: {isCurrentPeriodPublished ? 'Official Published' : 'Working Draft'}</p>
          </div>
        </div>
      </div>

      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Timetables
            </h2>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ({filteredSchedules.length} Sessions)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Department of Computer Science • {currentAcademicYear} {selectedSemester} • {isCurrentPeriodPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto no-print">
          {/* Publish / Unpublish Official Timetable Button */}
          <button
            id="publish-timetable-btn"
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center select-none ${
              isCurrentPeriodPublished
                ? 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
            title={isCurrentPeriodPublished ? 'Click to unpublish timetable back to draft' : 'Publish official timetable to lecturers and students'}
          >
            <LoadingButtonContent
              loading={isPublishing}
              loadingText="Updating"
              defaultText={isCurrentPeriodPublished ? 'Unpublish' : 'Publish'}
            />
          </button>

          {/* Auto-Generate AI Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer disabled:opacity-50"
            title="Generate"
            aria-label="Generate"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Dropdown Menu */}
          <div ref={exportDropdownRef} className="relative">
            <button
              onClick={() => setExportDropdownOpen(prev => !prev)}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
              title="Export"
              aria-label="Export"
            >
              <Download className="w-4 h-4" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <button
                  onClick={() => {
                    exportGeneratedTimetablePDF(filteredSchedules, { semester: selectedSemester, academicYear: currentAcademicYear });
                    setExportDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>PDF Document (.pdf)</span>
                </button>

                <button
                  onClick={() => {
                    exportGeneratedTimetableExcel(filteredSchedules, { semester: selectedSemester, academicYear: currentAcademicYear });
                    setExportDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Excel Workbook (.xlsx)</span>
                </button>

                <button
                  onClick={() => {
                    exportGeneratedTimetableCSV(filteredSchedules, { semester: selectedSemester, academicYear: currentAcademicYear });
                    setExportDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>CSV Dataset (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Print Button */}
          <button
            onClick={() => printTimetable(filteredSchedules, { semester: selectedSemester, academicYear: currentAcademicYear })}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
            title="Print"
            aria-label="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role / Bulk Delete Feedback */}
      {bulkDeleteSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in-50 no-print">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{bulkDeleteSuccessMsg}</span>
          </div>
          <button
            onClick={() => setBulkDeleteSuccessMsg(null)}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Generation & Publishing Alert Feedback */}
      {generateMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-50 no-print">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{generateMessage}</span>
        </div>
      )}

      {publishMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-50 no-print">
          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{publishMessage}</span>
        </div>
      )}

      {/* Filter Toolbar: Academic Year, Semester Selector, Level Filters, Search */}
      <div className="space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Academic Year Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <select
                id="academic-year-select"
                value={currentAcademicYear}
                onChange={(e) => setCurrentAcademicYear(e.target.value)}
                className="bg-transparent font-bold text-zinc-800 dark:text-zinc-200 outline-hidden cursor-pointer"
              >
                <option value="2026/2027" className="dark:bg-zinc-900">2026/2027</option>
                <option value="2025/2026" className="dark:bg-zinc-900">2025/2026</option>
                <option value="2027/2028" className="dark:bg-zinc-900">2027/2028</option>
              </select>
            </div>

            {/* Semester Selector on the Schedule View */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs self-start max-w-full overflow-x-auto custom-scrollbar">
              {(['Semester 1', 'Semester 2', 'All'] as const).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSemester === sem
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Level Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs overflow-x-auto custom-scrollbar max-w-full">
            {(['All', '100', '200', '300', '400'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  levelFilter === lvl
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {lvl === 'All' ? 'All Levels' : `Level ${lvl}`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-auto min-w-0 md:min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search course, lecturer, hall..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* Facility & Lecturer Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs outline-none cursor-pointer"
            >
              <option value="All" className="dark:bg-zinc-900">All Lecture Halls & Labs ({facilities.length})</option>
              {facilities.map(f => (
                <option key={f.hallId} value={f.hallId} className="dark:bg-zinc-900">
                  {f.hallName} ({f.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={lecturerFilter}
              onChange={(e) => setLecturerFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs outline-none cursor-pointer"
            >
              <option value="All" className="dark:bg-zinc-900">All Faculty Lecturers ({lecturers.length})</option>
              {lecturers.map(l => (
                <option key={l.lecturerId} value={l.lecturerId} className="dark:bg-zinc-900">
                  {l.fullName} ({l.title})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedScheduleIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 no-print">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white/20 dark:bg-black/10">
              {selectedScheduleIds.length} {selectedScheduleIds.length === 1 ? 'session' : 'sessions'} selected
            </span>
            <button
              onClick={() => setSelectedScheduleIds([])}
              className="text-xs underline text-zinc-300 dark:text-zinc-600 hover:text-white dark:hover:text-black cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="p-16 text-center rounded-3xl glass-panel space-y-4 border border-white/60 dark:border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">No timetable has been generated yet.</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Click the button below to run the automated UGCS scheduling optimization engine and allocate courses to venues and time slots.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-75 select-none"
          >
            <LoadingButtonContent
              loading={isGenerating}
              loadingText="Optimizing Schedule"
              defaultText="Generate Timetable"
              icon={<Sparkles className="w-4 h-4 shrink-0" />}
            />
          </button>
        </div>
      ) : (
        <div className="rounded-3xl glass-panel overflow-hidden border border-white/60 dark:border-white/10 shadow-xl print-container">
          <div className="p-4 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Official Master Timetable Schedule ({filteredSchedules.length} Sessions)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Department of Computer Science — UG
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 uppercase font-bold text-[11px]">
                  {canManageSchedules && (
                    <th className="p-3.5 w-10 text-center no-print">
                      <input
                        type="checkbox"
                        checked={filteredSchedules.length > 0 && filteredSchedules.every(s => selectedScheduleIds.includes(s.id))}
                        onChange={handleSelectAll}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Select All"
                      />
                    </th>
                  )}
                  <th className="p-3.5 text-left">Course Code & Title</th>
                  <th className="p-3.5 text-left">Level</th>
                  <th className="p-3.5 text-left">Semester</th>
                  <th className="p-3.5 text-left">Day & Time Period</th>
                  <th className="p-3.5 text-left">Lecture Facility</th>
                  <th className="p-3.5 text-left">Assigned Lecturer</th>
                  <th className="p-3.5 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={canManageSchedules ? 8 : 7} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      No schedule entries match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((session) => {
                    const isSelected = selectedScheduleIds.includes(session.id);
                    return (
                      <tr 
                        key={session.id} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                            : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        {canManageSchedules && (
                          <td className="p-3.5 text-center no-print">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(session.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-3.5">
                          <div className="font-bold text-zinc-900 dark:text-white">{session.courseCode}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{session.courseTitle}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Level {session.level}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-700 dark:text-zinc-300 font-medium">{session.semester}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-zinc-900 dark:text-white">{session.day}</div>
                          <div className="text-[11px] text-zinc-500">{session.timeSlotLabel} (P{session.periodNumber})</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-zinc-900 dark:text-white">{session.hallName}</div>
                          <div className="text-[11px] text-zinc-500">ID: {session.hallId}</div>
                        </td>
                        <td className="p-3.5 text-zinc-700 dark:text-zinc-300 font-medium">{session.lecturerName}</td>
                        <td className="p-3.5 text-right no-print">
                          <button
                            onClick={() => {
                              setDeleteEntryId(session.id);
                              setDeleteEntryName(`${session.courseCode} (${session.day} ${session.timeSlotLabel})`);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteEntryId}
        onClose={() => setDeleteEntryId(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Timetable Session?"
        itemName={deleteEntryName}
        itemType="scheduled class"
        description="Are you sure you want to unallocate this course session from the academic schedule grid?"
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Scheduled Sessions?"
        itemName={`${selectedScheduleIds.length} scheduled session${selectedScheduleIds.length > 1 ? 's' : ''}`}
        itemType="scheduled sessions"
        description={`This will permanently remove ${selectedScheduleIds.length} selected schedule allocations from the academic timetable across all venues.`}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
