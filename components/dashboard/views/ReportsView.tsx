'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Building2, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen,
  PieChart as PieIcon,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { 
  exportReportPDF, 
  exportReportExcel, 
  exportReportCSV, 
  printReport 
} from '@/lib/exportUtils';

export function ReportsView() {
  const { analytics, courses, facilities, lecturers, schedules, timeSlots, selectedSemester } = useTimetable();
  const { kpi } = analytics;

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCourses = (coursesVal?: string | string[]) => {
    if (!coursesVal) return [];
    if (Array.isArray(coursesVal)) return coursesVal;
    if (typeof coursesVal === 'string') return coursesVal ? coursesVal.split(',').map(s => s.trim()).filter(Boolean) : [];
    return [];
  };

  const totalSeats = facilities.reduce((sum, f) => sum + f.capacity, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Print-Only Official Document Header */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-black">UNIVERSITY OF GHANA</h1>
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-700 mt-0.5">College of Basic and Applied Sciences • Department of Computer Science</h2>
            <h3 className="text-sm font-bold text-black mt-1">Academic Compliance & Resource Audit Report</h3>
          </div>
          <div className="text-right text-xs text-black leading-tight">
            <p className="font-semibold">Academic Year: 2026/2027</p>
            <p className="font-semibold">Semester: {selectedSemester}</p>
            <p className="text-zinc-600 text-[10px] mt-1">Status: Official Audit Summary</p>
          </div>
        </div>
      </div>

      {/* 1. Centered Bold Page Heading (Requirement 12, 13, 14) */}
      <div className="text-center py-2 shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center">
          Reports
        </h1>
      </div>

      {/* Controls and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Faculty workload and room utilization audit
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto no-print">
          {/* Export Dropdown */}
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
                    exportReportPDF(analytics, { semester: selectedSemester, academicYear: '2026/2027' });
                    setExportDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>PDF Document</span>
                </button>

                <button
                  onClick={() => {
                    exportReportExcel(analytics, { semester: selectedSemester, academicYear: '2026/2027' });
                    setExportDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Excel Workbook</span>
                </button>

                <button
                  onClick={() => {
                    exportReportCSV(analytics, { semester: selectedSemester, academicYear: '2026/2027' });
                    setExportDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>CSV Dataset</span>
                </button>
              </div>
            )}
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => printReport(analytics, { semester: selectedSemester, academicYear: '2026/2027' })}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
            title="Print"
            aria-label="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-panel space-y-2">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Curriculum Coverage</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpi.schedulingPercentage}%</span>
            <span className="text-xs text-zinc-500">({kpi.successfullyScheduled}/{kpi.totalCourses} courses)</span>
          </div>
          <p className="text-[11px] text-zinc-400">Target: 100% full academic coverage</p>
        </div>

        <div className="p-5 rounded-3xl glass-panel space-y-2">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Clash Audit Status</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpi.schedulingConflicts === 0 ? 'Passed (0)' : `${kpi.schedulingConflicts} Warnings`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">Zero simultaneous room conflicts</p>
        </div>

        <div className="p-5 rounded-3xl glass-panel space-y-2">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Seat Capacity Efficiency</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{totalSeats.toLocaleString()}</span>
            <span className="text-xs text-zinc-500">max seats</span>
          </div>
          <p className="text-[11px] text-zinc-400">{facilities.length} lecture facilities & labs</p>
        </div>

        <div className="p-5 rounded-3xl glass-panel space-y-2">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Faculty Workload Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{lecturers.length}</span>
            <span className="text-xs text-zinc-500">instructors</span>
          </div>
          <p className="text-[11px] text-zinc-400">Balanced contact hours allocation</p>
        </div>
      </div>

      {/* Section 1: Lecturer Workload Contact Hours Table */}
      <div className="rounded-3xl glass-panel overflow-hidden border-white/60 dark:border-white/10">
        <div className="p-4 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              Faculty Teaching Workload & Contact Hours Audit
            </h3>
            <p className="text-xs text-zinc-500">Weekly teaching load breakdown per lecturer</p>
          </div>
          <span className="text-xs font-bold text-zinc-500">{lecturers.length} Faculty Members</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-full lg:min-w-[650px]">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <th className="py-3 px-4">Lecturer Name</th>
                <th className="py-3 px-4 hidden lg:table-cell">Title / Rank</th>
                <th className="py-3 px-4 hidden lg:table-cell">Assigned Courses</th>
                <th className="py-3 px-3 text-center">Sessions Scheduled</th>
                <th className="py-3 px-3 text-center">Weekly Contact Hours</th>
                <th className="py-3 px-4 text-center">Workload Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
              {lecturers.map(lec => {
                const lecSessions = schedules.filter(s => s.lecturerId === lec.lecturerId);
                const totalHours = lecSessions.reduce((sum, s) => sum + s.durationHours, 0);

                return (
                  <tr key={lec.lecturerId} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white whitespace-normal break-words">
                      {lec.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 hidden lg:table-cell">
                      {lec.title}
                    </td>
                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {getCourses(lec.specializations || lec.assignedCourses).map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold">
                      {lecSessions.length}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {totalHours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        totalHours > 12 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20' :
                        totalHours > 6 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                      }`}>
                        {totalHours > 12 ? 'Heavy Load' : totalHours > 6 ? 'Optimal Load' : 'Light Load'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Facility Room Utilization Table */}
      <div className="rounded-3xl glass-panel overflow-hidden border-white/60 dark:border-white/10">
        <div className="p-4 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              Lecture Venue & Laboratory Utilization Audit
            </h3>
            <p className="text-xs text-zinc-500">Weekly occupancy rate per venue across standard periods</p>
          </div>
          <span className="text-xs font-bold text-zinc-500">{facilities.length} Venues</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-full lg:min-w-[650px]">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <th className="py-3 px-4">Venue Name</th>
                <th className="py-3 px-4 hidden lg:table-cell">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-3 text-center">Allocated Sessions</th>
                <th className="py-3 px-3 text-center">Weekly Hours</th>
                <th className="py-3 px-4 text-center">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
              {facilities.map(fac => {
                const facSessions = schedules.filter(s => s.hallId === fac.hallId);
                const totalHours = facSessions.reduce((sum, s) => sum + s.durationHours, 0);
                const utilizationPct = Math.min(100, Math.round((totalHours / 50) * 100));

                return (
                  <tr key={fac.hallId} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white whitespace-normal break-words">
                      {fac.hallName}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 hidden lg:table-cell">
                      {fac.venueType}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {fac.capacity} seats
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold">
                      {facSessions.length}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {totalHours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${utilizationPct}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300">{utilizationPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
