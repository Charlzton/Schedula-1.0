'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  SlidersHorizontal, 
  RefreshCw, 
  CalendarDays, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Users, 
  BookOpen,
  Info
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { GenerationResult } from '@/lib/schedulerEngine';

export function GenerateTimetableView() {
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
    setSelectedSemester 
  } = useTimetable();

  const [targetLevel, setTargetLevel] = useState<number | 'All'>('All');
  const [separateDays, setSeparateDays] = useState(true);
  const [strictCapacity, setStrictCapacity] = useState(true);
  const [noLecturerClash, setNoLecturerClash] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(lastGeneratedResult);

  const handleGenerate = async () => {
    const res = await runGeneration({
      semester: selectedSemester,
      targetLevel: targetLevel,
      separateTheoryAndPracticalDays: separateDays,
      strictCapacityCheck: strictCapacity
    });
    setResult(res);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Intelligent Timetable Generation Console
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Automated heuristic constraint solver based on University of Ghana academic parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 glass-panel space-y-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                1. Scope & Academic Target
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose the semester and level cohort to optimize
              </p>
            </div>

            {/* Semester Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Target Academic Semester
              </label>
              <div className="flex sm:grid sm:grid-cols-3 gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {(['Semester 1', 'Semester 2', 'All'] as const).map(sem => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`flex-1 min-w-[100px] p-3 glass-pill text-xs font-bold transition-all text-center border-transparent whitespace-nowrap ${
                      selectedSemester === sem
                        ? 'bg-neutral-900/10 dark:bg-white/10 ring-2 ring-neutral-900 dark:ring-white shadow-xs'
                        : 'hover:bg-white/10 dark:hover:bg-white/5 opacity-70'
                    }`}
                  >
                    {sem === 'All' ? 'Both Semesters' : sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Academic Level Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Cohort Level Filter
              </label>
              <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                {(['All', 100, 200, 300, 400] as const).map(lvl => (
                  <button
                    key={lvl.toString()}
                    type="button"
                    onClick={() => setTargetLevel(lvl)}
                    className={`flex-1 min-w-[70px] p-2.5 glass-pill text-xs font-semibold transition-all text-center border-transparent whitespace-nowrap ${
                      targetLevel === lvl
                        ? 'bg-blue-600/20 ring-2 ring-blue-600 shadow-xs'
                        : 'hover:bg-white/10 dark:hover:bg-white/5 opacity-70'
                    }`}
                  >
                    {lvl === 'All' ? 'All' : `Level ${lvl}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Constraint Toggles */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">
                2. Hard & Soft Constraint Rules
              </h3>

              {/* Strict Capacity */}
              <div className="flex items-center justify-between p-3 glass-panel border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Strict Facility Capacity Limit
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Never assign a course to a venue with seat capacity smaller than expected enrollment.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={strictCapacity}
                  onChange={(e) => setStrictCapacity(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-transparent border-white/20"
                />
              </div>

              {/* Theory & Practical Separation */}
              <div className="flex items-center justify-between p-3 glass-panel border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Separate Theory & Practical Sessions Across Days
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Ensures 2-hour lecture and 1-hour lab session do not land on the same day for student balance.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={separateDays}
                  onChange={(e) => setSeparateDays(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-transparent border-white/20"
                />
              </div>

              {/* Lecturer Clash */}
              <div className="flex items-center justify-between p-3 glass-panel border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Zero Lecturer Double-Booking
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Prevents any academic faculty member from being scheduled in two simultaneous classes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={noLecturerClash}
                  onChange={(e) => setNoLecturerClash(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-transparent border-white/20"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                id="run-generation-algorithm-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 glass-pill font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Executing Heuristic Schedule Solver...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                    <span>Run Intelligent Schedule Optimization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Algorithm Summary & Live Status */}
        <div className="space-y-6">
          {/* Engine Parameters Summary Card */}
          <div className="p-5 glass-panel space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Optimization Engine Stats
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Active Course Pool:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{courses.length} courses</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Available Venues:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{facilities.length} halls/labs</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Available Weekly Slots:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{timeSlots.length} slots</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Faculty Pool:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{lecturers.length} lecturers</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <span>
                The scheduler prioritizes largest enrollment courses into higher capacity venues first (e.g. Great Hall, N-Block 1).
              </span>
            </div>
          </div>

          {/* Generation Result Outcome Box */}
          {result && (
            <div className="p-5 glass-panel space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Execution Results
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
                  <p className="text-[11px] text-neutral-400">Scheduled</p>
                  <p className="text-lg font-bold text-emerald-400">{result.successfullyScheduledCount}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
                  <p className="text-[11px] text-neutral-400">Warnings</p>
                  <p className={`text-lg font-bold ${result.conflictCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {result.conflictCount}
                  </p>
                </div>
              </div>

              {result.conflicts && result.conflicts.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar text-[11px] pr-1">
                  <p className="font-semibold text-amber-400">Attention Notes:</p>
                  {result.conflicts.map((c, i) => (
                    <div key={i} className="p-1.5 rounded bg-amber-950/40 border border-amber-900/60 text-amber-200">
                      <span className="font-bold">{c.courseCode}:</span> {c.reason}
                    </div>
                  ))}
                </div>
              )}

              <button
                id="view-generated-matrix-btn"
                onClick={() => setActiveView('generated_timetables')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>Open Timetable Matrix</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
