'use client';

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck
} from 'lucide-react';

export function ProblemValueSection() {
  const frictionPoints = [
    'Assigning a 240-student course into a 120-seat lecture hall, causing severe room overcrowding.',
    'Double-booking two different departments into the same lecture theater at the same time period.',
    'Spending days manually cross-referencing paper spreadsheets and resolving student enrollment clashes.',
    'Difficulty identifying why certain courses remain unscheduled when physical room slots run out.',
    'Struggling to regenerate entire department schedules when a single hall becomes unavailable.'
  ];

  const schedulaSolutions = [
    'Strict capacity enforcement guarantees that class enrollments never exceed physical seat limits.',
    'Hard constraint validation makes lecture hall overlap and double-booking mathematically impossible.',
    'Automated allocation algorithms match hundreds of courses across days and slots in seconds.',
    'Clear diagnostic summaries highlight bottleneck halls, capacity deficits, and resolution steps.',
    'Instant re-allocation allows quick adjustments when room availability or cohort sizes change.'
  ];

  return (
    <section id="problem-value" className="py-24 bg-[#F9F9F7] border-b border-[#E5E5E1] relative overflow-hidden">
      {/* Background ghost watermark */}
      <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none select-none text-[180px] font-black text-[#1A1A1A]">
        05
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#E5E5E1] shadow-2xs text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-4">
            <span>Institutional Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
            Solving the logistical complexity of <span className="text-[#2563EB] italic font-serif font-light">academic</span> scheduling
          </h2>
          <p className="mt-4 text-base text-[#4B5563] leading-relaxed">
            When academic departments, fluctuating class sizes, and limited lecture halls collide, manual scheduling becomes error-prone. Schedula brings structure and certainty to the administrative process.
          </p>
        </div>

        {/* Side-by-side comparison cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Manual Scheduling Pain Points */}
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-[#E5E5E1] hover:border-[#EF4444]/40 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#EF4444]" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E1] mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#EF4444]">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Manual Spreadsheet Scheduling
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Fragile, time-intensive, and prone to room clashes
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                  Unreliable
                </span>
              </div>

              <ul className="space-y-4">
                {frictionPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                    <XCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5E5E1] flex items-center justify-between text-xs text-red-700 font-bold">
              <span>Risk: Student disruptions & room congestion</span>
            </div>
          </div>

          {/* Schedula Systematic Solution */}
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-[#E5E5E1] hover:border-[#2563EB] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E1] mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">
                      Schedula Systematic Engine
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Automated, capacity-verified, and clash-free
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200">
                  Verified
                </span>
              </div>

              <ul className="space-y-4">
                {schedulaSolutions.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-xs sm:text-sm text-[#1A1A1A] font-medium leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5E5E1] flex items-center justify-between text-xs text-[#2563EB] font-bold">
              <span>Outcome: 100% capacity adherence & zero hall overlaps</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
