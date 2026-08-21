'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  Download, 
  SlidersHorizontal
} from 'lucide-react';

export function SystemPreviewSection() {
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [selectedHallFilter, setSelectedHallFilter] = useState<string>('all');
  const [selectedCourseCard, setSelectedCourseCard] = useState<any | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

  const halls = [
    { id: 'hall-1', name: 'Science Auditorium A', capacity: 300, location: 'Block B, 1st Floor' },
    { id: 'hall-2', name: 'Engineering Hall 102', capacity: 180, location: 'Tech Quad, Ground' },
    { id: 'hall-3', name: 'Humanities Theater', capacity: 220, location: 'Arts Wing, 2nd Floor' },
    { id: 'hall-4', name: 'Business Grand Hall', capacity: 350, location: 'Commerce Tower, 3rd Floor' }
  ];

  // Schedule dataset for Monday to Friday
  const scheduleData: Record<string, Array<{
    id: string;
    courseCode: string;
    title: string;
    department: string;
    enrollment: number;
    hallId: string;
    hallName: string;
    hallCapacity: number;
    timeSlot: string;
    instructor: string;
    status: 'Verified' | 'Optimal';
    color: string;
  }>> = {
    Monday: [
      {
        id: 'cs101-mon',
        courseCode: 'CS-301',
        title: 'Algorithms & Data Structures',
        department: 'Computer Science',
        enrollment: 285,
        hallId: 'hall-1',
        hallName: 'Science Auditorium A',
        hallCapacity: 300,
        timeSlot: '08:00 - 10:00',
        instructor: 'Dr. Aris Thorne',
        status: 'Optimal',
        color: 'bg-indigo-50 border-indigo-200 text-indigo-900'
      },
      {
        id: 'eng201-mon',
        courseCode: 'ENG-204',
        title: 'Thermodynamics & Heat Transfer',
        department: 'Mechanical Engineering',
        enrollment: 170,
        hallId: 'hall-2',
        hallName: 'Engineering Hall 102',
        hallCapacity: 180,
        timeSlot: '10:15 - 12:15',
        instructor: 'Prof. Sarah Vance',
        status: 'Optimal',
        color: 'bg-blue-50 border-blue-200 text-blue-900'
      },
      {
        id: 'hum101-mon',
        courseCode: 'SOC-102',
        title: 'Modern Social Thought',
        department: 'Humanities',
        enrollment: 195,
        hallId: 'hall-3',
        hallName: 'Humanities Theater',
        hallCapacity: 220,
        timeSlot: '13:00 - 15:00',
        instructor: 'Dr. Evelyn Reed',
        status: 'Verified',
        color: 'bg-amber-50 border-amber-200 text-amber-900'
      },
      {
        id: 'bus301-mon',
        courseCode: 'BUS-405',
        title: 'Strategic Corporate Finance',
        department: 'Business School',
        enrollment: 320,
        hallId: 'hall-4',
        hallName: 'Business Grand Hall',
        hallCapacity: 350,
        timeSlot: '15:15 - 17:15',
        instructor: 'Prof. Marcus Sterling',
        status: 'Optimal',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-900'
      },
      {
        id: 'mat201-mon',
        courseCode: 'MAT-210',
        title: 'Linear Algebra & Calculus',
        department: 'Mathematics',
        enrollment: 260,
        hallId: 'hall-1',
        hallName: 'Science Auditorium A',
        hallCapacity: 300,
        timeSlot: '13:00 - 15:00',
        instructor: 'Dr. Neil Hoffman',
        status: 'Optimal',
        color: 'bg-purple-50 border-purple-200 text-purple-900'
      }
    ],
    Tuesday: [
      {
        id: 'bio201-tue',
        courseCode: 'BIO-201',
        title: 'Molecular Genetics',
        department: 'Biological Sciences',
        enrollment: 275,
        hallId: 'hall-1',
        hallName: 'Science Auditorium A',
        hallCapacity: 300,
        timeSlot: '10:15 - 12:15',
        instructor: 'Dr. Clara Higgins',
        status: 'Optimal',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-900'
      },
      {
        id: 'ee101-tue',
        courseCode: 'ECE-315',
        title: 'Microprocessor Systems',
        department: 'Electrical Engineering',
        enrollment: 165,
        hallId: 'hall-2',
        hallName: 'Engineering Hall 102',
        hallCapacity: 180,
        timeSlot: '08:00 - 10:00',
        instructor: 'Prof. David Lin',
        status: 'Verified',
        color: 'bg-blue-50 border-blue-200 text-blue-900'
      },
      {
        id: 'eco101-tue',
        courseCode: 'ECO-202',
        title: 'Macroeconomic Principles',
        department: 'Economics',
        enrollment: 340,
        hallId: 'hall-4',
        hallName: 'Business Grand Hall',
        hallCapacity: 350,
        timeSlot: '13:00 - 15:00',
        instructor: 'Dr. Julian Ross',
        status: 'Optimal',
        color: 'bg-teal-50 border-teal-200 text-teal-900'
      }
    ],
    Wednesday: [
      {
        id: 'cs401-wed',
        courseCode: 'CS-440',
        title: 'Distributed Cloud Systems',
        department: 'Computer Science',
        enrollment: 240,
        hallId: 'hall-1',
        hallName: 'Science Auditorium A',
        hallCapacity: 300,
        timeSlot: '08:00 - 10:00',
        instructor: 'Dr. Aris Thorne',
        status: 'Optimal',
        color: 'bg-indigo-50 border-indigo-200 text-indigo-900'
      },
      {
        id: 'law101-wed',
        courseCode: 'LAW-210',
        title: 'Contractual Law & Ethics',
        department: 'Law Faculty',
        enrollment: 210,
        hallId: 'hall-3',
        hallName: 'Humanities Theater',
        hallCapacity: 220,
        timeSlot: '10:15 - 12:15',
        instructor: 'Prof. Eleanor Hughes',
        status: 'Verified',
        color: 'bg-amber-50 border-amber-200 text-amber-900'
      }
    ],
    Thursday: [
      {
        id: 'chem101-thu',
        courseCode: 'CHM-105',
        title: 'Organic Chemistry Principles',
        department: 'Chemistry',
        enrollment: 290,
        hallId: 'hall-1',
        hallName: 'Science Auditorium A',
        hallCapacity: 300,
        timeSlot: '10:15 - 12:15',
        instructor: 'Dr. Robert Miller',
        status: 'Optimal',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-900'
      },
      {
        id: 'civ201-thu',
        courseCode: 'CE-302',
        title: 'Structural Mechanics',
        department: 'Civil Engineering',
        enrollment: 172,
        hallId: 'hall-2',
        hallName: 'Engineering Hall 102',
        hallCapacity: 180,
        timeSlot: '13:00 - 15:00',
        instructor: 'Prof. Alan Vance',
        status: 'Verified',
        color: 'bg-blue-50 border-blue-200 text-blue-900'
      }
    ],
    Friday: [
      {
        id: 'phy101-fri',
        courseCode: 'PHY-202',
        title: 'Electromagnetism & Waves',
        department: 'Physics',
        enrollment: 250,
        hallId: 'hall-1',
        hallName: 'Science Auditorium A',
        hallCapacity: 300,
        timeSlot: '08:00 - 10:00',
        instructor: 'Dr. Helen Ward',
        status: 'Optimal',
        color: 'bg-purple-50 border-purple-200 text-purple-900'
      },
      {
        id: 'mgt101-fri',
        courseCode: 'MGT-310',
        title: 'Operations Management',
        department: 'Business School',
        enrollment: 330,
        hallId: 'hall-4',
        hallName: 'Business Grand Hall',
        hallCapacity: 350,
        timeSlot: '10:15 - 12:15',
        instructor: 'Prof. Marcus Sterling',
        status: 'Optimal',
        color: 'bg-teal-50 border-teal-200 text-teal-900'
      }
    ]
  };

  const currentDaySlots = scheduleData[selectedDay] || [];
  const filteredSlots = selectedHallFilter === 'all' 
    ? currentDaySlots 
    : currentDaySlots.filter(s => s.hallId === selectedHallFilter);

  return (
    <section id="preview" className="py-24 bg-[#F9F9F7] border-b border-[#E5E5E1] relative overflow-hidden">
      {/* Background ghost watermark */}
      <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none text-[180px] font-black text-[#1A1A1A]">
        06
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#E5E5E1] text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-4 shadow-2xs">
              <span>Interactive Verification Matrix</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
              Interactive Master <span className="text-[#2563EB] italic font-serif font-light">Timetable</span> Matrix
            </h2>
            <p className="mt-2 text-base text-[#4B5563] max-w-2xl">
              Inspect generated course schedules by academic day and lecture hall. Verify capacity metrics, zero-overlap rules, and room assignments.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-white border border-[#E5E5E1] px-5 py-3 rounded-2xl shadow-2xs">
            <div className="text-right">
              <div className="text-xs font-bold text-[#6B7280]">Scheduled Courses</div>
              <div className="text-sm font-extrabold text-[#1A1A1A]">148 / 148 (100%)</div>
            </div>
            <div className="w-px h-8 bg-[#E5E5E1]" />
            <div className="text-right">
              <div className="text-xs font-bold text-[#6B7280]">Hall Overlaps</div>
              <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 Conflicts
              </div>
            </div>
          </div>
        </div>

        {/* The Master Timetable Interactive Container */}
        <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          
          {/* Top Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            
            {/* Day Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl overflow-x-auto max-w-full border border-slate-800">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedCourseCard(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDay === day 
                      ? 'bg-[#2563EB] text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Hall Filter & Export actions */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-xs text-slate-300 border border-slate-800">
                <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <select
                  value={selectedHallFilter}
                  onChange={(e) => setSelectedHallFilter(e.target.value)}
                  aria-label="Filter schedule by lecture hall"
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-[#1A1A1A] text-white">All Lecture Halls (4)</option>
                  {halls.map((h) => (
                    <option key={h.id} value={h.id} className="bg-[#1A1A1A] text-white">
                      {h.name} ({h.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => alert('The Master Timetable export feature will be fully active in the upcoming release. All allocations currently pass verification.')}
                className="px-4 py-2 rounded-xl bg-white text-[#1A1A1A] text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Timetable</span>
              </button>
            </div>
          </div>

          {/* Grid Layout of Time Slots & Scheduled Courses */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Schedule Grid Table */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1">
                <span>Active Day: {selectedDay}</span>
                <span>Showing {filteredSlots.length} allocated periods</span>
              </div>

              {filteredSlots.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-bold">No scheduled sessions for this lecture hall on {selectedDay}.</p>
                  <p className="text-xs text-slate-500 mt-1">Select &quot;All Lecture Halls&quot; to view all active day allocations.</p>
                </div>
              ) : (
                filteredSlots.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCourseCard(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedCourseCard?.id === item.id 
                        ? 'bg-slate-800 border-[#2563EB] ring-1 ring-[#2563EB]' 
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-[#1A1A1A] border border-slate-700 font-mono text-xs font-bold text-white">
                          {item.courseCode}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {item.department} • Instructor: {item.instructor}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {item.timeSlot}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {item.hallName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress indicator inside block */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>Enrollment: <strong className="text-white">{item.enrollment}</strong></span>
                        <span>Hall Capacity: <strong className="text-white">{item.hallCapacity} seats</strong></span>
                      </div>
                      <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Cap fit: {Math.round((item.enrollment / item.hallCapacity) * 100)}% load
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Inspector Panel */}
            <div className="lg:col-span-4 bg-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Slot Inspector
                  </span>
                  <span className="text-[11px] font-bold text-[#2563EB]">Live Audit</span>
                </div>

                {selectedCourseCard ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Course Identity</span>
                      <div className="text-base font-bold text-white mt-0.5">
                        {selectedCourseCard.courseCode} — {selectedCourseCard.title}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">{selectedCourseCard.department}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allocated Hall:</span>
                        <span className="font-bold text-white">{selectedCourseCard.hallName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time Interval:</span>
                        <span className="font-bold text-white">{selectedCourseCard.timeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Enrolled Students:</span>
                        <span className="font-bold text-white">{selectedCourseCard.enrollment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hall Capacity:</span>
                        <span className="font-bold text-emerald-400">{selectedCourseCard.hallCapacity} seats</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Zero room conflict at this time period</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Enrollment is safely within seating capacity</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <SlidersHorizontal className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-300">Click any scheduled course block</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Inspect its real-time capacity headroom, assigned hall, and clash validation.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span className="font-mono text-[11px]">System Status: Online</span>
                <span className="text-emerald-400 font-bold">100% Pass</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
