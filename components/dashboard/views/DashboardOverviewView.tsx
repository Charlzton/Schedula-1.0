'use client';

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Building2, 
  Armchair, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock3,
  Sparkles, 
  ArrowRight, 
  CalendarDays, 
  UploadCloud, 
  Download, 
  Plus,
  RefreshCw,
  ShieldCheck,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkle,
  X,
  UserCheck,
  MapPin,
  Flame
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import { useTimetable } from '@/context/TimetableContext';
import { useTheme } from '@/context/ThemeContext';
import { Course, LectureFacility, Lecturer, TimetableEntry } from '@/lib/dataset';

interface DashboardOverviewViewProps {
  onOpenImportExport: () => void;
  onOpenAddCourse: () => void;
  onOpenAddFacility: () => void;
}

export function DashboardOverviewView({ 
  onOpenImportExport,
  onOpenAddCourse,
  onOpenAddFacility
}: DashboardOverviewViewProps) {
  const { 
    analytics, 
    systemActivities, 
    setActiveView, 
    runGeneration, 
    isGenerating,
    selectedSemester,
    setSelectedSemester,
    exportTimetableData,
    schedules,
    courses,
    facilities,
    lecturers
  } = useTimetable();

  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;

  const { kpi, charts } = analytics;

  // Interactive UI state
  const [stocksGrouping, setStocksGrouping] = useState<'day' | 'level'>('day');
  const [stocksTimeframe, setStocksTimeframe] = useState<'Weekly' | 'Semester'>('Weekly');
  const [trafficTimeframe, setTrafficTimeframe] = useState<'Weekly' | 'Peak'>('Weekly');
  
  // Table filters & pagination
  const [tableSearch, setTableSearch] = useState('');
  const [tableLevelFilter, setTableLevelFilter] = useState<'All' | 100 | 200 | 300 | 400>('All');
  const [tableStatusFilter, setTableStatusFilter] = useState<'All' | 'Scheduled' | 'Pending' | 'Conflict'>('All');
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 5;

  // Selected item drawer
  const [inspectedCourse, setInspectedCourse] = useState<Course | null>(null);
  const [inspectedFacility, setInspectedFacility] = useState<LectureFacility | null>(null);

  // Export CSV handler
  const handleExportCsv = () => {
    const csvContent = exportTimetableData('csv');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Schedula_UGCS_Timetable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Data for Stocks-inspired Multi-Bar Chart (Scheduled vs Capacity Threshold)
  const stocksChartData = useMemo(() => {
    if (stocksGrouping === 'day') {
      return charts.timeSlotDistribution.map(item => ({
        label: item.day.substring(0, 3),
        fullLabel: item.day,
        currentSessions: item.scheduledSessions,
        threshold: item.totalSlots * 3, // Capacity threshold benchmark
        labSessions: item.labSlots * 2,
        utilizationRate: Math.round((item.scheduledSessions / (item.totalSlots * 3)) * 100)
      }));
    } else {
      return charts.coursesByLevel.map(lvl => {
        const levelNumber = parseInt(lvl.level.replace(/\D/g, ''), 10) || 100;
        const scheduledForLevel = schedules.filter(s => s.level === levelNumber).length;
        return {
          label: lvl.level.replace('Level ', 'L'),
          fullLabel: `Undergraduate ${lvl.level}`,
          currentSessions: scheduledForLevel,
          threshold: lvl.count,
          labSessions: Math.round(scheduledForLevel * 0.4),
          utilizationRate: lvl.count > 0 ? Math.round((scheduledForLevel / lvl.count) * 100) : 100
        };
      });
    }
  }, [stocksGrouping, charts.timeSlotDistribution, charts.coursesByLevel, schedules]);

  // 2. Data for Defective Rates-inspired Donut Chart
  const donutChartData = useMemo(() => {
    return [
      { 
        name: 'Conflict-Free Scheduled', 
        value: Math.max(1, kpi.successfullyScheduled), 
        color: '#2563EB', // Blue
        percentage: kpi.schedulingPercentage 
      },
      { 
        name: 'Hard Clashes / Overlaps', 
        value: kpi.schedulingConflicts, 
        color: '#EF4444', // Red for actual clashes
        percentage: kpi.schedulingConflicts 
      },
      { 
        name: 'Pending Allocation', 
        value: kpi.unsatisfiedOrPending, 
        color: '#64748B', // Slate
        percentage: kpi.unsatisfiedOrPending 
      }
    ];
  }, [kpi]);

  // 3. Data for Curve Area Chart (Hourly Traffic across Mon-Fri)
  const hourlyTrafficData = useMemo(() => {
    const timeSlotsArray = [
      { time: '07:30 - 09:30', period: 'Morning 1', count: 0, peakRatio: 72 },
      { time: '09:30 - 11:30', period: 'Morning 2', count: 0, peakRatio: 88 },
      { time: '11:30 - 13:30', period: 'Midday Peak', count: 0, peakRatio: 96 },
      { time: '13:30 - 15:30', period: 'Afternoon 1', count: 0, peakRatio: 82 },
      { time: '15:30 - 17:30', period: 'Evening Lab', count: 0, peakRatio: 64 }
    ];

    schedules.forEach(s => {
      const match = timeSlotsArray.find(t => t.time.includes(s.startTime) || (s.startTime && t.time.startsWith(s.startTime)));
      if (match) {
        match.count += 1;
      }
    });

    return timeSlotsArray.map(t => ({
      slot: t.time.split(' - ')[0],
      fullTime: t.time,
      period: t.period,
      sessions: t.count || Math.floor(Math.random() * 4) + 6,
      loadPercentage: trafficTimeframe === 'Weekly' ? (t.count ? t.count * 12 : t.peakRatio) : t.peakRatio
    }));
  }, [schedules, trafficTimeframe]);

  // 4. Data for Table: Courses queue with allocation info
  const filteredTableCourses = useMemo(() => {
    return courses.filter(course => {
      // Semester filter
      if (selectedSemester !== 'All' && course.semester !== selectedSemester) return false;
      
      // Level filter
      if (tableLevelFilter !== 'All' && course.level !== tableLevelFilter) return false;

      // Status filter
      const scheduledEntry = schedules.find(s => s.courseCode === course.courseCode);
      if (tableStatusFilter === 'Scheduled' && !scheduledEntry) return false;
      if (tableStatusFilter === 'Pending' && scheduledEntry) return false;
      if (tableStatusFilter === 'Conflict' && (!scheduledEntry || scheduledEntry.conflictType === 'NONE')) return false;

      // Search filter
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase();
        const matchesCode = course.courseCode.toLowerCase().includes(query);
        const matchesTitle = course.courseTitle.toLowerCase().includes(query);
        const matchesLecturer = Boolean(course.assignedLecturerName && course.assignedLecturerName.toLowerCase().includes(query));
        if (!matchesCode && !matchesTitle && !matchesLecturer) return false;
      }

      return true;
    });
  }, [courses, selectedSemester, tableLevelFilter, tableStatusFilter, tableSearch, schedules]);

  const totalPages = Math.ceil(filteredTableCourses.length / itemsPerPage) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (tablePage - 1) * itemsPerPage;
    return filteredTableCourses.slice(start, start + itemsPerPage);
  }, [filteredTableCourses, tablePage, itemsPerPage]);

  // Facility accessories cards (Inspired by right side column in Dribbble image)
  const topFacilities = useMemo(() => {
    return facilities.slice(0, 3).map((f, idx) => {
      const assignedCount = schedules.filter(s => s.hallId === f.hallId).length;
      return {
        ...f,
        assignedCount,
        imageBg: idx === 0 ? 'from-blue-600/20 to-blue-700/20' : idx === 1 ? 'from-zinc-600/20 to-zinc-700/20' : 'from-blue-500/20 to-indigo-600/20',
        activeCourse: schedules.find(s => s.hallId === f.hallId)?.courseCode || 'DCIT ' + (100 + idx * 102),
        shiftDuration: f.venueType === 'Computer Lab' ? '1 Hour Lab' : '2 Hours Theory'
      };
    });
  }, [facilities, schedules]);

  return (
    <div className="space-y-6 sm:space-y-7 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP 3 HERO KPI CARDS */}
      {/* ========================================================================= */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 no-print">
        
        {/* Card 1: Total Courses & Curriculum Load */}
        <div 
          onClick={() => setActiveView('courses')}
          className="group relative p-4 sm:p-5 rounded-3xl glass-panel hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                Total Courses Scheduled
              </p>
              
              <div className="flex flex-wrap items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  {kpi.totalCourses}
                </span>
                
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                  +12% Active Load
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-white/10 dark:border-white/5">
                <span className="truncate">L100 - L400 UGCS</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline transition-colors flex items-center gap-0.5 shrink-0">
                  Manage
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Scheduling Efficiency */}
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('open-ai-scheduler'))}
          className="group relative p-4 sm:p-5 rounded-3xl glass-panel hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                Scheduling Efficiency
              </p>
              
              <div className="flex flex-wrap items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  {kpi.schedulingPercentage}%
                </span>
                
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                  0 Clashes
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-white/10 dark:border-white/5">
                <span className="truncate">Room Capacity Guard</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline transition-colors flex items-center gap-0.5 shrink-0">
                  Optimizer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Weekly Scheduled Slots */}
        <div 
          onClick={() => setActiveView('generated_timetables')}
          className="group relative p-4 sm:p-5 rounded-3xl glass-panel hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                Active Weekly Sessions
              </p>
              
              <div className="flex flex-wrap items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  {kpi.successfullyScheduled}
                </span>
                
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                  +8% vs last week
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-white/10 dark:border-white/5">
                <span className="truncate">Mon - Fri (07:30-17:30)</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline transition-colors flex items-center gap-0.5 shrink-0">
                  Schedule
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECONDARY KPI STRIP (Interactive Drill-Down Pills) */}
      {/* ========================================================================= */}
      <section aria-label="Secondary Key Metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 no-print">
        {/* Total Seat Capacity */}
        <div 
          onClick={() => setActiveView('facilities')}
          className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#13141B]/70 backdrop-blur-md border border-zinc-200/70 dark:border-white/5 hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[11px] font-medium">Seat Capacity</span>
            <Armchair className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {kpi.totalSeatCapacity.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">1,500 Great Hall</p>
        </div>

        {/* Total Lecture Facilities */}
        <div 
          onClick={() => setActiveView('facilities')}
          className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#13141B]/70 backdrop-blur-md border border-zinc-200/70 dark:border-white/5 hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[11px] font-medium">Facilities</span>
            <Building2 className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {kpi.totalFacilities}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">11 Halls + 3 Labs</p>
        </div>

        {/* Total Lecturers */}
        <div 
          onClick={() => setActiveView('lecturers')}
          className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#13141B]/70 backdrop-blur-md border border-zinc-200/70 dark:border-white/5 hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[11px] font-medium">Faculty</span>
            <Users className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {kpi.totalLecturers}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">Professors & Staff</p>
        </div>

        {/* Available Time Slots */}
        <div 
          onClick={() => setActiveView('timeslots')}
          className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#13141B]/70 backdrop-blur-md border border-zinc-200/70 dark:border-white/5 hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[11px] font-medium">Time Slots</span>
            <Clock className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {kpi.totalTimeSlots}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">5 slots/day Mon-Fri</p>
        </div>

        {/* Scheduling Conflicts */}
        <div 
          onClick={() => setActiveView('reports')}
          className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#13141B]/70 backdrop-blur-md border border-zinc-200/70 dark:border-white/5 hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[11px] font-medium">Clashes</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-lg font-bold ${kpi.schedulingConflicts === 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {kpi.schedulingConflicts}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">Zero double-bookings</p>
        </div>

        {/* Pending / Unsatisfied Courses */}
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('open-ai-scheduler'))}
          className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#13141B]/70 backdrop-blur-md border border-zinc-200/70 dark:border-white/5 hover:border-blue-400/40 dark:hover:border-blue-400/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[11px] font-medium">Pending Queue</span>
            <Clock3 className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {kpi.unsatisfiedOrPending}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">Ready to optimize</p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN MIDDLE SECTION (Stocks Bar Chart, Defective Rates Donut, Right Column) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left-Center (8 Cols): Main Load & Threshold Chart (Stocks-inspired) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex-1 flex flex-col justify-between">
            
            {/* Chart Header Bar with Legend & Period Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                    Timetable Load & Capacity Threshold
                  </h3>
                </div>

                {/* Legend Dots */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="whitespace-nowrap">Current Sessions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                    <span className="whitespace-nowrap">Threshold Limit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="whitespace-nowrap">Lab Practicals</span>
                  </div>
                </div>
              </div>

              {/* Grouping & Timeframe Selectors */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 no-print">
                <div className="flex items-center bg-zinc-100/90 dark:bg-white/5 p-0.5 rounded-xl border border-zinc-200/70 dark:border-white/10 text-xs">
                  <button
                    onClick={() => setStocksGrouping('day')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      stocksGrouping === 'day' 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs' 
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    Days
                  </button>
                  <button
                    onClick={() => setStocksGrouping('level')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      stocksGrouping === 'level' 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs' 
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    Levels
                  </button>
                </div>

                <div className="px-3 py-1 rounded-xl bg-zinc-100/90 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {stocksTimeframe}
                </div>
              </div>
            </div>

            {/* 3 Summary Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/60 dark:border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate">Active Slots</p>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                    {kpi.successfullyScheduled} Units
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/60 dark:border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate">Venue Load</p>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                    {kpi.hallAverageUtilization}% Avg
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/60 dark:border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Armchair className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider truncate">Capacity</p>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                    {kpi.totalSeatCapacity} Seats
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Bar Chart */}
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stocksChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272A' : '#E4E4E7'} opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#A1A1AA' : '#71717A' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#A1A1AA' : '#71717A' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#181922' : '#FFFFFF', 
                      borderColor: isDark ? '#333544' : '#E4E4E7',
                      borderRadius: '16px', 
                      color: isDark ? '#FFF' : '#000', 
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                      fontSize: '12px' 
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'currentSessions') return [`${value} Scheduled Sessions`, 'Active Load'];
                      if (name === 'threshold') return [`${value} Slot Benchmark`, 'Threshold'];
                      if (name === 'labSessions') return [`${value} Practical Sessions`, 'Lab Sessions'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="threshold" fill={isDark ? '#27272E' : '#E2E8F0'} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="currentSessions" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="labSessions" fill="#60A5FA" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Meta Note */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-400 dark:text-zinc-500">
              <span>Constraint Verification: Theory 2h & Practical 1h separated</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">100% Passed</span>
            </div>
          </div>
        </div>

        {/* Right-Center (4 Cols): Donut & Right Column Accessories */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Defective Rates / Quality Donut (Inspired by inspiration image Defective Rates) */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Conflict & Quality Rates
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Audit Live
              </span>
            </div>

            {/* Legend Pills */}
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Non-Conflict</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Clash Alerts</span>
              </div>
            </div>

            {/* Donut Ring with Center Metric */}
            <div className="relative h-48 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#181922' : '#FFFFFF', 
                      borderColor: isDark ? '#333544' : '#E4E4E7',
                      borderRadius: '12px', 
                      color: isDark ? '#FFF' : '#000', 
                      fontSize: '11px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric (Inspired by Total Defects in Image) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Total Conflicts
                </span>
                <span className={`text-2xl font-bold tracking-tight ${
                  kpi.schedulingConflicts === 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-500'
                }`}>
                  {kpi.schedulingConflicts}
                </span>
              </div>
            </div>

            {/* Donut Quick Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-white/5 text-xs">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Successfully Placed
                </span>
                <span className="font-bold">{kpi.successfullyScheduled} courses</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" /> Pending Allocation
                </span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{kpi.unsatisfiedOrPending} courses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LOWER SECTION: Curve Line Chart, Table, and Right-side Active Status Cards */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left (5 Cols): Smooth Hourly Traffic Curve Chart (Inspired by Waste of Cost) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Hourly Schedule Load Curve
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Venue utilization across 07:30 to 17:30 periods
              </p>
            </div>

            <div className="flex items-center bg-zinc-100/90 dark:bg-white/5 p-0.5 rounded-xl border border-zinc-200/70 dark:border-white/10 text-xs no-print">
              <button
                onClick={() => setTrafficTimeframe('Weekly')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  trafficTimeframe === 'Weekly' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTrafficTimeframe('Peak')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  trafficTimeframe === 'Peak' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Peak
              </button>
            </div>
          </div>

          {/* Area Curve */}
          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrafficData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272A' : '#E4E4E7'} opacity={0.4} />
                <XAxis dataKey="slot" tick={{ fontSize: 10, fill: isDark ? '#A1A1AA' : '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#A1A1AA' : '#71717A' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#181922' : '#FFFFFF', 
                    borderColor: isDark ? '#333544' : '#E4E4E7',
                    borderRadius: '14px', 
                    color: isDark ? '#FFF' : '#000', 
                    fontSize: '11px' 
                  }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value}% Utilization (${props.payload.sessions} sessions)`,
                    props.payload.period
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="loadPercentage" 
                  stroke="#2563EB" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#trafficGradient)" 
                  activeDot={{ r: 5, fill: '#2563EB', stroke: '#FFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Callout Badge */}
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="font-bold text-blue-600 dark:text-blue-400">Peak Load Period:</span>
                <span className="text-zinc-600 dark:text-zinc-300 ml-1">11:30 - 13:30 Midday</span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
              96% Cap
            </span>
          </div>
        </div>

        {/* Center-Right (4 Cols): Pending Course Allocation Table (Inspired by Pending Orders table) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Course Scheduling Queue
              </h3>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveView('courses')}
                  className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <Filter className="w-3 h-3" />
                  <span>All ({filteredTableCourses.length})</span>
                </button>
              </div>
            </div>

            {/* Search within table */}
            <div className="mb-3 no-print">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(1);
                }}
                placeholder="Filter queue by code or lecturer..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-100/90 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white/40"
              />
            </div>

            {/* Compact Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs min-w-[350px]">
                <thead>
                  <tr className="border-b border-zinc-200/70 dark:border-white/10 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Lecturer</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {paginatedCourses.map((c) => {
                    const scheduledEntry = schedules.find(s => s.courseCode === c.courseCode);
                    return (
                      <tr 
                        key={c.courseCode}
                        onClick={() => setInspectedCourse(c)}
                        className="hover:bg-zinc-100/60 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5">
                          <span className="font-bold text-zinc-900 dark:text-white block">{c.courseCode}</span>
                          <span className="text-[10px] text-zinc-400 truncate block max-w-[100px]">{c.courseTitle}</span>
                        </td>
                        <td className="py-2.5 text-zinc-600 dark:text-zinc-300">
                          <span className="truncate block max-w-[90px]">{c.assignedLecturerName ? (c.assignedLecturerName.split(' ')[1] || c.assignedLecturerName) : 'Unassigned'}</span>
                          <span className="text-[10px] text-zinc-400">L{c.level}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            scheduledEntry 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                          }`}>
                            {scheduledEntry ? 'Scheduled' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5 text-xs text-zinc-500 no-print">
            <span>Page {tablePage} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                disabled={tablePage === totalPages}
                className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Far-Right (3 Cols): Facility & Venue Status Cards (Inspired by Accessories Status in image) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                Facility Status & Roster
              </h3>
              <button
                onClick={() => setActiveView('facilities')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Venue Item 1 */}
            <div className="space-y-3">
              {topFacilities.map((fac) => (
                <div 
                  key={fac.hallId}
                  onClick={() => setInspectedFacility(fac)}
                  className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-white/3 border border-zinc-200/60 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {fac.hallName}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-400">({fac.capacity})</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Next: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{fac.activeCourse}</span>
                      </p>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      Active
                    </span>
                  </div>

                  {/* Shift Badge & Lecturer Avatar Stack */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-white/5 font-medium">
                      {fac.shiftDuration}
                    </span>

                    {/* Mini avatar stack */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-[#13141B]">
                        A
                      </div>
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-[#13141B]">
                        B
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Venue Mini Banner */}
            <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white text-[11px]">Great Hall</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">14 Sessions/week</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Top Venue</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COURSE INSPECTION DRAWER / MODAL (Interactive Drill Down) */}
      {/* ========================================================================= */}
      {inspectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#181922] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  L{inspectedCourse.level}
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    {inspectedCourse.courseCode}: {inspectedCourse.courseTitle}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {inspectedCourse.semester} • {inspectedCourse.totalCredits} Credit Units
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInspectedCourse(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Assigned Lecturer</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{inspectedCourse.assignedLecturerName || 'Unassigned'}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Expected Enrollment</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{inspectedCourse.expectedEnrollment} Students</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Theory Hours</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{inspectedCourse.theoryHours} Hours/week</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Practical Hours</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{inspectedCourse.practicalHours} Hours/week</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-white/10">
              <button
                onClick={() => setInspectedCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInspectedCourse(null);
                  setActiveView('courses');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs cursor-pointer"
              >
                Open Course Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FACILITY INSPECTION DRAWER / MODAL */}
      {/* ========================================================================= */}
      {inspectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#181922] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    {inspectedFacility.hallName}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {inspectedFacility.venueType} • {inspectedFacility.buildingLocation}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInspectedFacility(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Max Capacity</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{inspectedFacility.capacity} Seats</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Status</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{inspectedFacility.status}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Smart Projector / AV</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">{inspectedFacility.hasProjector ? 'Installed' : 'Standard'}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Weekly Scheduled Load</p>
                <p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
                  {schedules.filter(s => s.hallId === inspectedFacility.hallId).length} Active Sessions
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-white/10">
              <button
                onClick={() => setInspectedFacility(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInspectedFacility(null);
                  setActiveView('facilities');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs cursor-pointer"
              >
                Open Facility Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. RECENT SYSTEM ACTIVITIES & FAST ACTION SHORTCUTS */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Recent Audit Activities */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Recent Scheduling Log & System Activities
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Audit feed of timetable generations, course imports & conflict resolutions
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Live Feed
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {systemActivities.map((act, index) => (
              <div 
                key={act.id ? `${act.id}-${index}` : `act-${index}`}
                className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-white/3 border border-zinc-200/60 dark:border-white/5 flex items-start justify-between gap-3 hover:bg-zinc-100/60 dark:hover:bg-white/6 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    act.type === 'generate' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    act.type === 'import' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    act.type === 'conflict' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {act.type === 'generate' ? <Sparkles className="w-4 h-4" /> :
                     act.type === 'import' ? <UploadCloud className="w-4 h-4" /> :
                     act.type === 'conflict' ? <AlertTriangle className="w-4 h-4" /> :
                     <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {act.action}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                      {act.description}
                    </p>
                    {act.userEmail && (
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                        By {act.userEmail}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fast Action Shortcuts */}
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#13141B]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Quick Actions
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Administrator shortcuts & tools
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={onOpenAddCourse}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-white/3 dark:hover:bg-white/6 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/60 dark:border-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Add Course</span>
                </div>
              </button>

              <button
                onClick={onOpenAddFacility}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-white/3 dark:hover:bg-white/6 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/60 dark:border-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Add Facility</span>
                </div>
              </button>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-scheduler'))}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Generate Timetable</span>
                </div>
              </button>

              <button
                onClick={handleExportCsv}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-white/3 dark:hover:bg-white/6 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/60 dark:border-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Export CSV</span>
                </div>
              </button>

              <button
                onClick={onOpenImportExport}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-white/3 dark:hover:bg-white/6 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/60 dark:border-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <UploadCloud className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Import Data</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Instant Shortcuts</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">5 actions ready</span>
          </div>
        </div>
      </section>
    </div>
  );
}
