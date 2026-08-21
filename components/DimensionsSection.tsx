'use client';

import React from 'react';
import { 
  BookOpen, 
  Building2, 
  Clock, 
  Sliders, 
  CheckCircle2
} from 'lucide-react';

export function DimensionsSection() {
  const dimensions = [
    {
      icon: BookOpen,
      title: 'Course Directory & Enrollments',
      description: 'Centralize course codes, academic departments, lecture credit hours, and exact student cohort enrollment counts.',
      badge: '01',
      highlights: ['Accurate student headcounts', 'Departmental categorization', 'Multi-section course handling']
    },
    {
      icon: Building2,
      title: 'Lecture Halls & Capacity Bounds',
      description: 'Define available lecture halls, auditoriums, and seminar rooms alongside their strict physical seating capacities.',
      badge: '02',
      highlights: ['Strict seat limits', 'Room equipment tags', 'Building & zone mapping']
    },
    {
      icon: Clock,
      title: 'Academic Days & Time Slots',
      description: 'Establish standard teaching days across the academic week and configure consistent lecture period intervals.',
      badge: '03',
      highlights: ['Monday–Friday matrix', 'Configurable period lengths', 'Designated campus break slots']
    },
    {
      icon: Sliders,
      title: 'Institutional Constraints',
      description: 'Set hard rules to prevent hall double-booking and soft rules to optimize campus flow and consecutive hours.',
      badge: '04',
      highlights: ['Zero room overlap guarantee', 'Capacity >= enrollment rule', 'Consecutive session limits']
    }
  ];

  return (
    <section id="overview" className="py-24 bg-[#F9F9F7] border-b border-[#E5E5E1] relative overflow-hidden">
      {/* Background architectural watermark */}
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none text-[180px] font-black text-[#1A1A1A]">
        02
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#E5E5E1] text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-4 shadow-2xs">
            <span>System Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
            The four core pillars of <span className="text-[#2563EB] italic font-serif font-light">academic</span> scheduling
          </h2>
          <p className="mt-3 text-base text-[#4B5563] leading-relaxed">
            Timetable generation requires balancing multiple distinct institutional dimensions. Schedula structures these inputs systematically to ensure realistic scheduling outcomes.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dimensions.map((dim) => {
            const Icon = dim.icon;
            return (
              <div 
                key={dim.title}
                className="group p-6 rounded-2xl bg-white border border-[#E5E5E1] hover:border-[#2563EB] hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Subtle top indicator bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-[#2563EB] transition-colors" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#2563EB] shadow-2xs group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#9CA3AF] px-2 py-0.5 rounded bg-[#F9F9F7] border border-[#E5E5E1]">
                      Pillar {dim.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1A1A1A] mb-2">
                    {dim.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-5">
                    {dim.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E5E1]">
                  <ul className="space-y-2">
                    {dim.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs font-medium text-[#4B5563]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
