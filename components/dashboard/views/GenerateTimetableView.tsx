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
          Generate Timetable
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Automated heuristic scheduling solver
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 glass-panel space-y-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                Scope
              </h3>
            </div>

            {/* Semester Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Semester
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
                Academic Level
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
                Scheduling Constraints
              </h3>

              {/* Strict Capacity */}
              <div className="flex items-center justify-between p-3 glass-panel border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Strict Capacity
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Never assign courses to venues smaller than enrollment.
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
                    Separate Theory & Practical
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Spread lecture and lab sessions across different days.
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
                    Prevent Lecturer Conflicts
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Prevent double-booking faculty members in simultaneous classes.
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
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Generating Timetable...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Generate Timetable</span>
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
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              System Parameters
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Courses:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{courses.length}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Venues:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{facilities.length}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Weekly Slots:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{timeSlots.length}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Faculty:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{lecturers.length}</span>
              </div>
            </div>
          </div>

          {/* Generation Result Outcome Box */}
          {result && (
            <div className="p-5 glass-panel space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Results
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Scheduled</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{result.successfullyScheduledCount}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Warnings</p>
                  <p className={`text-lg font-bold ${result.conflictCount === 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                    {result.conflictCount}
                  </p>
                </div>
              </div>

              {result.conflicts && result.conflicts.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar text-[11px] pr-1">
                  <p className="font-semibold text-rose-600 dark:text-rose-400">Attention Notes:</p>
                  {result.conflicts.map((c, i) => (
                    <div key={i} className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                      <span className="font-bold">{c.courseCode}:</span> {c.reason}
                    </div>
                  ))}
                </div>
              )}

              <button
                id="view-generated-matrix-btn"
                onClick={() => setActiveView('generated_timetables')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <span>View Timetable</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
