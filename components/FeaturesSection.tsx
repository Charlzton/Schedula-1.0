'use client';

import React from 'react';
import { 
  BookOpen, 
  Building2, 
  Clock, 
  SlidersHorizontal, 
  Cpu, 
  HelpCircle, 
  Calendar, 
  Download,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Manage academic courses, course codes, departments, credit units, and precise student enrollment numbers required for accurate room matching.',
      category: 'Core Data'
    },
    {
      icon: Building2,
      title: 'Lecture Hall Management',
      description: 'Register lecture halls, auditoriums, and seminar rooms with their physical seating capacities and special equipment attributes.',
      category: 'Resource Inventory'
    },
    {
      icon: Clock,
      title: 'Time Slot Management',
      description: 'Define customizable teaching days across the academic week (Monday–Friday) and configure standard lecture time periods and intervals.',
      category: 'Time Matrix'
    },
    {
      icon: SlidersHorizontal,
      title: 'Scheduling Constraints',
      description: 'Configure strict institutional conditions: enforce enrollment ≤ hall capacity, eliminate simultaneous hall bookings, and limit consecutive hours.',
      category: 'Rule Engine'
    },
    {
      icon: Cpu,
      title: 'Timetable Generation',
      description: 'Run automated allocation algorithms that intelligently assign courses into suitable lecture halls and time periods according to your rules.',
      category: 'Optimization'
    },
    {
      icon: ShieldCheck,
      title: 'Conflict Detection',
      description: 'Instantly identify and flag potential scheduling clashes, overlapping hall reservations, or capacity violations before finalization.',
      category: 'Quality Assurance'
    },
    {
      icon: HelpCircle,
      title: 'Unscheduled Course Diagnostics',
      description: 'Provide clear diagnostic feedback for any course that could not be scheduled, detailing the exact constraint or capacity bottleneck.',
      category: 'Diagnostics'
    },
    {
      icon: Calendar,
      title: 'Master Timetable View',
      description: 'Inspect the generated schedule through an interactive matrix viewable by lecture hall, academic day, or departmental cohort.',
      category: 'Visualization'
    },
    {
      icon: Download,
      title: 'Timetable Export & Distribution',
      description: 'Export finalized, conflict-free timetables in standard document formats (PDF, Excel, CSV) ready for campus noticeboards and faculty sharing.',
      category: 'Distribution'
    }
  ];

  return (
    <section id="features" className="py-24 bg-[#F9F9F7] border-b border-[#E5E5E1] relative overflow-hidden">
      {/* Background ghost watermark */}
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none text-[180px] font-black text-[#1A1A1A]">
        04
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#E5E5E1] text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-4 shadow-2xs">
            <span>System Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
            Comprehensive tools built specifically for <span className="text-[#2563EB] italic font-serif font-light">academic</span> scheduling
          </h2>
          <p className="mt-3 text-base text-[#4B5563] leading-relaxed">
            Every feature in Schedula is intentionally engineered to address the real logistical challenges of university course and lecture hall administration.
          </p>
        </div>

        {/* Features 3x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group p-6 rounded-2xl bg-white border border-[#E5E5E1] hover:border-[#2563EB] hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top subtle hover line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-[#2563EB] transition-colors" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2563EB] shadow-2xs group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF] px-2 py-0.5 rounded bg-[#F9F9F7] border border-[#E5E5E1]">
                      {feat.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1A1A1A] mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E5E5E1] flex items-center justify-between text-[11px] font-bold text-[#4B5563]">
                  <span className="flex items-center gap-1.5 text-[#1A1A1A]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    Administrative Tool
                  </span>
                  <span className="font-mono text-[#9CA3AF]">Integrated</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
