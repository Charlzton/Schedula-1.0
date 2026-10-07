'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Building2, 
  Users, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useToast } from '@/context/ToastContext';
import { GenerationResult } from '@/lib/schedulerEngine';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';

interface AiSchedulingMiniPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSchedulingMiniPanel({ isOpen, onClose }: AiSchedulingMiniPanelProps) {
  const { 
    courses, 
    facilities, 
    lecturers, 
    timeSlots, 
    runGeneration, 
    isGenerating, 
    lastGeneratedResult, 
    setActiveView,
    selectedSemester,
    setSelectedSemester,
    activeAcademicPeriod,
    schedules,
    clearSchedules
  } = useTimetable();

  const { showToast } = useToast();

  // Configuration options
  const [targetLevel, setTargetLevel] = useState<number | 'All'>('All');
  const [separateDays, setSeparateDays] = useState(true);
  const [strictCapacity, setStrictCapacity] = useState(true);
  const [noLecturerClash, setNoLecturerClash] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(lastGeneratedResult);
  const [showConflictsList, setShowConflictsList] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Sync result if external changes occur
  useEffect(() => {
    if (lastGeneratedResult) {
      setResult(lastGeneratedResult);
    }
  }, [lastGeneratedResult]);

  // Keyboard accessibility: Escape key closes the mini-panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    try {
      const res = await runGeneration({
        semester: selectedSemester,
        targetLevel: targetLevel,
        separateTheoryAndPracticalDays: separateDays,
        strictCapacityCheck: strictCapacity,
        preventLecturerClash: noLecturerClash
      });
      setResult(res);
      showToast('Timetable successfully generated.');
    } catch (err: any) {
      showToast('Generation encountered an issue.');
    }
  };

  const handleViewSchedule = () => {
    setActiveView('generated_timetables');
    onClose();
  };

  const handleResetSchedule = () => {
    clearSchedules();
    setResult(null);
    showToast('Schedule cleared.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="ai-scheduler-panel-title"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="fixed bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-[375px] max-w-[calc(100vw-1.5rem)] max-h-[min(560px,calc(100vh-4.5rem))] flex flex-col rounded-3xl glass-modal border border-zinc-200/90 dark:border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden font-system select-none"
      >
        {/* ========================================================================= */}
        {/* HEADER: Title, Active Context & Accessible Close Button                   */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 sm:py-3.5 border-b border-zinc-200/70 dark:border-white/10 flex items-center justify-between gap-3 bg-zinc-50/60 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 dark:from-cyan-400/20 dark:to-purple-400/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="ai-scheduler-panel-title" className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate flex items-center gap-1.5">
                <span>AI Scheduler</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/20">
                  {activeAcademicPeriod?.name ? activeAcademicPeriod.name.split(' ')[0] : 'Auto'}
                </span>
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                Heuristic optimization utility
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Scheduling Panel"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE BODY: Controls & Constraints                                   */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-3.5 text-xs">
          
          {/* Catalog Metrics Context Strip */}
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 text-center">
            <div className="p-1">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Courses</p>
              <p className="font-bold text-zinc-900 dark:text-white">{courses.length}</p>
            </div>
            <div className="p-1 border-x border-zinc-200/60 dark:border-white/5">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Venues</p>
              <p className="font-bold text-zinc-900 dark:text-white">{facilities.length}</p>
            </div>
            <div className="p-1">
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Faculty</p>
              <p className="font-bold text-zinc-900 dark:text-white">{lecturers.length}</p>
            </div>
          </div>

          {/* Scope Control 1: Semester */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
              Semester
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
              {(['Semester 1', 'Semester 2', 'All'] as const).map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center truncate ${
                    selectedSemester === sem
                      ? 'bg-white dark:bg-[#1C202B] text-zinc-900 dark:text-white shadow-xs border border-black/5 dark:border-white/10 font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {sem === 'All' ? 'Both' : sem === 'Semester 1' ? 'Sem 1' : 'Sem 2'}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Control 2: Academic Level */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
              Academic Level
            </label>
            <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
              {(['All', 100, 200, 300, 400] as const).map((lvl) => (
                <button
                  key={lvl.toString()}
                  type="button"
                  onClick={() => setTargetLevel(lvl)}
                  className={`py-1 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center truncate ${
                    targetLevel === lvl
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {lvl === 'All' ? 'All' : `${lvl}`}
                </button>
              ))}
            </div>
          </div>

          {/* Constraint Rules */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Optimization Constraints
            </p>

            {/* Rule 1: Capacity Check */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 transition-all cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Strict Venue Capacity
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Enforce hall capacity &ge; student count
                </p>
              </div>
              <input
                type="checkbox"
                checked={strictCapacity}
                onChange={(e) => setStrictCapacity(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-transparent border-zinc-300 dark:border-zinc-700 cursor-pointer"
              />
            </label>

            {/* Rule 2: Theory & Practical Separation */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 transition-all cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Separate Theory & Practical
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Spread lectures and lab sessions
                </p>
              </div>
              <input
                type="checkbox"
                checked={separateDays}
                onChange={(e) => setSeparateDays(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-transparent border-zinc-300 dark:border-zinc-700 cursor-pointer"
              />
            </label>

            {/* Rule 3: Lecturer Clashes */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 transition-all cursor-pointer">
              <div className="space-y-0.5 pr-2">
                <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Prevent Faculty Clashes
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  No double-booking instructors
                </p>
              </div>
              <input
                type="checkbox"
                checked={noLecturerClash}
                onChange={(e) => setNoLecturerClash(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-transparent border-zinc-300 dark:border-zinc-700 cursor-pointer"
              />
            </label>
          </div>

          {/* Outcome & Result Summary */}
          {result && (
            <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Optimization Summary</span>
                </div>
                <button
                  type="button"
                  onClick={handleViewSchedule}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View Matrix</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-center">
                <div className="p-1.5 rounded-xl bg-white/70 dark:bg-black/30 border border-blue-500/15">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Scheduled</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {result.successfullyScheduledCount}
                  </p>
                </div>
                <div className="p-1.5 rounded-xl bg-white/70 dark:bg-black/30 border border-blue-500/15">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Warnings</p>
                  <p className={`text-sm font-bold ${result.conflictCount === 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                    {result.conflictCount}
                  </p>
                </div>
              </div>

              {result.conflicts && result.conflicts.length > 0 && (
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConflictsList(!showConflictsList)}
                    className="w-full flex items-center justify-between text-[10px] font-semibold text-rose-700 dark:text-rose-300 hover:underline"
                  >
                    <span>{result.conflicts.length} Constraint Notes</span>
                    <span>{showConflictsList ? 'Hide' : 'Show'}</span>
                  </button>
                  {showConflictsList && (
                    <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 pr-1 text-[10px]">
                      {result.conflicts.map((c, idx) => (
                        <div key={idx} className="p-1 rounded-lg bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/20">
                          <span className="font-bold">{c.courseCode}:</span> {c.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ANCHORED FOOTER: Primary Run Action & Reset                               */}
        {/* ========================================================================= */}
        <div className="p-3.5 border-t border-zinc-200/70 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] flex items-center gap-2 shrink-0">
          {schedules.length > 0 && (
            <button
              type="button"
              onClick={handleResetSchedule}
              disabled={isGenerating}
              title="Reset current schedule allocation"
              className="p-2.5 rounded-xl bg-zinc-200/70 hover:bg-zinc-300 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              aria-label="Clear schedule"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="run-ai-generation-mini-btn"
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center select-none"
          >
            <LoadingButtonContent
              loading={isGenerating}
              loadingText="Optimizing Schedule"
              defaultText={
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-600 shrink-0" />
                  <span>Generate Schedule</span>
                </span>
              }
            />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
