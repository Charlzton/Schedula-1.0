'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Course, 
  LectureFacility, 
  Lecturer, 
  TimeSlot, 
  ResidentialHall,
  TimetableEntry, 
  SystemActivity,
  INITIAL_COURSES,
  INITIAL_FACILITIES,
  INITIAL_LECTURERS,
  INITIAL_RESIDENTIAL_HALLS,
  INITIAL_TIME_SLOTS,
  INITIAL_SYSTEM_ACTIVITIES
} from '@/lib/dataset';
import { 
  generateIntelligentTimetable, 
  validateScheduleEntries, 
  calculateDashboardAnalytics,
  GenerationOptions,
  GenerationResult 
} from '@/lib/schedulerEngine';
import { useAuth } from '@/context/AuthContext';

export type DashboardViewType = 
  | 'dashboard'
  | 'courses'
  | 'facilities'
  | 'lecturers'
  | 'timeslots'
  | 'generate'
  | 'generated_timetables'
  | 'reports'
  | 'settings';

interface TimetableContextType {
  courses: Course[];
  facilities: LectureFacility[];
  lecturers: Lecturer[];
  timeSlots: TimeSlot[];
  residentialHalls: ResidentialHall[];
  schedules: TimetableEntry[];
  systemActivities: SystemActivity[];
  activeView: DashboardViewType;
  setActiveView: (view: DashboardViewType) => void;
  selectedSemester: 'All' | 'Semester 1' | 'Semester 2';
  setSelectedSemester: (sem: 'All' | 'Semester 1' | 'Semester 2') => void;
  selectedLevel: 'All' | 100 | 200 | 300 | 400;
  setSelectedLevel: (level: 'All' | 100 | 200 | 300 | 400) => void;
  isGenerating: boolean;
  lastGeneratedResult: GenerationResult | null;
  
  // CRUD actions
  addCourse: (course: Course, silent?: boolean) => void;
  bulkAddCourses: (courses: Course[]) => void;
  updateCourse: (code: string, updated: Partial<Course>, silent?: boolean) => void;
  deleteCourse: (code: string) => void;
  bulkDeleteCourses: (codes: string[]) => void;

  addFacility: (facility: LectureFacility, silent?: boolean) => void;
  bulkAddFacilities: (facilities: LectureFacility[]) => void;
  updateFacility: (id: string, updated: Partial<LectureFacility>, silent?: boolean) => void;
  deleteFacility: (id: string) => void;
  bulkDeleteFacilities: (ids: string[]) => void;

  addLecturer: (lecturer: Lecturer, silent?: boolean) => void;
  bulkAddLecturers: (lecturers: Lecturer[]) => void;
  updateLecturer: (id: string, updated: Partial<Lecturer>, silent?: boolean) => void;
  deleteLecturer: (id: string) => void;
  bulkDeleteLecturers: (ids: string[]) => void;

  addTimeSlot: (slot: TimeSlot, silent?: boolean) => void;
  bulkAddTimeSlots: (slots: TimeSlot[]) => void;
  updateTimeSlot: (id: string, updated: Partial<TimeSlot>, silent?: boolean) => void;
  deleteTimeSlot: (id: string) => void;
  bulkDeleteTimeSlots: (ids: string[]) => void;

  // Generator & schedule actions
  runGeneration: (options?: GenerationOptions) => Promise<GenerationResult>;
  generateOptimizedTimetable: () => number;
  updateScheduleEntry: (id: string, updated: Partial<TimetableEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
  bulkDeleteSchedules: (ids: string[]) => void;
  clearSchedules: () => void;
  resetToDefaultDataset: () => void;

  // Import / Export & Logs
  importDataset: (newCourses?: Course[], newFacilities?: LectureFacility[], newLecturers?: Lecturer[]) => void;
  exportTimetableData: (format: 'csv' | 'json') => string;
  addActivity: (action: string, description: string, type: SystemActivity['type']) => void;

  // Computed dynamic stats & charts
  analytics: ReturnType<typeof calculateDashboardAnalytics>;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

const STORAGE_KEY_COURSES = 'schedula_courses_v1';
const STORAGE_KEY_FACILITIES = 'schedula_facilities_v1';
const STORAGE_KEY_LECTURERS = 'schedula_lecturers_v1';
const STORAGE_KEY_TIMESLOTS = 'schedula_timeslots_v1';
const STORAGE_KEY_SCHEDULES = 'schedula_schedules_v1';
const STORAGE_KEY_ACTIVITIES = 'schedula_activities_v1';

export function TimetableProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_COURSES;
  });

  const [facilities, setFacilities] = useState<LectureFacility[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FACILITIES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FACILITIES;
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LECTURERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LECTURERS;
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMESLOTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TIME_SLOTS;
  });

  const [residentialHalls] = useState<ResidentialHall[]>(INITIAL_RESIDENTIAL_HALLS);
  
  // Initial generated schedule pre-populated for instant realistic experience
  const [schedules, setSchedules] = useState<TimetableEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Generate an initial schedule for Semester 1 by default
    const initGen = generateIntelligentTimetable(INITIAL_COURSES, INITIAL_FACILITIES, INITIAL_LECTURERS, INITIAL_TIME_SLOTS, {
      semester: 'Semester 1',
      separateTheoryAndPracticalDays: true,
      strictCapacityCheck: true
    });
    return initGen.schedules;
  });

  const [systemActivities, setSystemActivities] = useState<SystemActivity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (saved) {
        const parsed: SystemActivity[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.map((act, index) => {
            let id = act.id || `ACT-${Date.now()}-${index}`;
            if (seen.has(id)) {
              id = `ACT-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seen.add(id);
            return { ...act, id };
          });
        }
      }
    } catch {}
    return INITIAL_SYSTEM_ACTIVITIES;
  });
  const [activeView, setActiveView] = useState<DashboardViewType>('dashboard');
  const [selectedSemester, setSelectedSemester] = useState<'All' | 'Semester 1' | 'Semester 2'>('Semester 1');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 100 | 200 | 300 | 400>('All');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastGeneratedResult, setLastGeneratedResult] = useState<GenerationResult | null>(null);

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
      localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(facilities));
      localStorage.setItem(STORAGE_KEY_LECTURERS, JSON.stringify(lecturers));
      localStorage.setItem(STORAGE_KEY_TIMESLOTS, JSON.stringify(timeSlots));
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(systemActivities));
    } catch {}
  }, [courses, facilities, lecturers, timeSlots, schedules, systemActivities]);

  const addActivity = (action: string, description: string, type: SystemActivity['type']) => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newAct: SystemActivity = {
      id: `ACT-${Date.now()}-${randomSuffix}`,
      action,
      description,
      timestamp: 'Just now',
      type,
      badgeColor: type === 'generate' ? 'blue' : type === 'conflict' ? 'rose' : type === 'create' ? 'emerald' : 'purple',
      userEmail: user?.email || 'admin@ug.edu.gh'
    };
    setSystemActivities(prev => [newAct, ...prev.slice(0, 25)]);
  };

  // Course CRUD
  const addCourse = (course: Course, silent: boolean = false) => {
    setCourses(prev => [...prev, course]);
    if (!silent) {
      addActivity('Course Created', `Added ${course.courseCode} - ${course.courseTitle} (${course.level} Level)`, 'create');
    }
  };

  const bulkAddCourses = (newCourses: Course[]) => {
    if (!newCourses.length) return;
    setCourses(prev => [...prev, ...newCourses]);
    addActivity('Bulk Courses Added', `Added ${newCourses.length} courses to departmental catalog`, 'create');
  };

  const updateCourse = (code: string, updated: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.courseCode === code ? { ...c, ...updated } : c));
    addActivity('Course Updated', `Updated course parameters for ${code}`, 'update');
  };

  const deleteCourse = (code: string) => {
    setCourses(prev => prev.filter(c => c.courseCode !== code));
    setSchedules(prev => prev.filter(s => s.courseCode !== code));
    addActivity('Course Removed', `Deleted ${code} from departmental course catalog`, 'conflict');
  };

  const bulkDeleteCourses = (codes: string[]) => {
    if (!codes.length) return;
    const codeSet = new Set(codes);
    setCourses(prev => prev.filter(c => !codeSet.has(c.courseCode)));
    setSchedules(prev => prev.filter(s => !codeSet.has(s.courseCode)));
    addActivity('Bulk Delete Courses', `Removed ${codes.length} courses from catalog`, 'conflict');
  };

  // Facility CRUD
  const addFacility = (facility: LectureFacility, silent: boolean = false) => {
    setFacilities(prev => [...prev, facility]);
    if (!silent) {
      addActivity('Facility Added', `Registered ${facility.hallName} (${facility.capacity} seats)`, 'create');
    }
  };

  const bulkAddFacilities = (newFacilities: LectureFacility[]) => {
    if (!newFacilities.length) return;
    setFacilities(prev => [...prev, ...newFacilities]);
    addActivity('Bulk Facilities Added', `Registered ${newFacilities.length} lecture venues`, 'create');
  };

  const updateFacility = (id: string, updated: Partial<LectureFacility>, silent: boolean = false) => {
    setFacilities(prev => prev.map(f => f.hallId === id ? { ...f, ...updated } : f));
    setSchedules(prev => validateScheduleEntries(prev, facilities.map(f => f.hallId === id ? { ...f, ...updated } : f), lecturers));
    if (!silent) {
      addActivity('Lecture Facility Updated', `Updated venue details for ${id}`, 'update');
    }
  };

  const deleteFacility = (id: string) => {
    setFacilities(prev => prev.filter(f => f.hallId !== id));
    setSchedules(prev => prev.filter(s => s.hallId !== id));
    addActivity('Facility Removed', `Decommissioned hall ID ${id}`, 'update');
  };

  const bulkDeleteFacilities = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setFacilities(prev => prev.filter(f => !idSet.has(f.hallId)));
    setSchedules(prev => prev.filter(s => !idSet.has(s.hallId)));
    addActivity('Bulk Delete Facilities', `Decommissioned ${ids.length} lecture facilities`, 'conflict');
  };

  // Lecturer CRUD
  const addLecturer = (lecturer: Lecturer, silent: boolean = false) => {
    setLecturers(prev => [...prev, lecturer]);
    if (!silent) {
      addActivity('Lecturer Added', `Added ${lecturer.fullName} (${lecturer.title})`, 'create');
    }
  };

  const bulkAddLecturers = (newLecturers: Lecturer[]) => {
    if (!newLecturers.length) return;
    setLecturers(prev => [...prev, ...newLecturers]);
    addActivity('Bulk Lecturers Added', `Added ${newLecturers.length} faculty member profiles`, 'create');
  };

  const updateLecturer = (id: string, updated: Partial<Lecturer>, silent: boolean = false) => {
    setLecturers(prev => prev.map(l => l.lecturerId === id ? { ...l, ...updated } : l));
    if (!silent) {
      addActivity('Lecturer Updated', `Modified profile for ${id}`, 'update');
    }
  };

  const deleteLecturer = (id: string) => {
    setLecturers(prev => prev.filter(l => l.lecturerId !== id));
    addActivity('Lecturer Removed', `Removed lecturer record ${id}`, 'update');
  };

  const bulkDeleteLecturers = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setLecturers(prev => prev.filter(l => !idSet.has(l.lecturerId)));
    addActivity('Bulk Delete Lecturers', `Removed ${ids.length} lecturer profiles`, 'conflict');
  };

  // TimeSlot CRUD
  const addTimeSlot = (slot: TimeSlot, silent: boolean = false) => {
    setTimeSlots(prev => [...prev, slot]);
    if (!silent) {
      addActivity('Time Slot Added', `Added ${slot.day} slot ${slot.startTime}-${slot.endTime}`, 'create');
    }
  };

  const bulkAddTimeSlots = (newSlots: TimeSlot[]) => {
    if (!newSlots.length) return;
    setTimeSlots(prev => [...prev, ...newSlots]);
    addActivity('Bulk Time Slots Added', `Configured ${newSlots.length} schedule periods`, 'create');
  };

  const updateTimeSlot = (id: string, updated: Partial<TimeSlot>, silent: boolean = false) => {
    setTimeSlots(prev => prev.map(s => s.slotId === id ? { ...s, ...updated } : s));
    if (!silent) {
      addActivity('Time Slot Updated', `Updated parameters for slot ${id}`, 'update');
    }
  };

  const deleteTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(s => s.slotId !== id));
    setSchedules(prev => prev.filter(s => s.slotId !== id));
    addActivity('Time Slot Removed', `Removed slot ${id}`, 'update');
  };

  const bulkDeleteTimeSlots = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setTimeSlots(prev => prev.filter(s => !idSet.has(s.slotId)));
    setSchedules(prev => prev.filter(s => !idSet.has(s.slotId)));
    addActivity('Bulk Delete Time Slots', `Removed ${ids.length} time slot periods`, 'conflict');
  };

  const bulkDeleteSchedules = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setSchedules(prev => prev.filter(s => !idSet.has(s.id)));
    addActivity('Bulk Delete Schedules', `Removed ${ids.length} schedule allocations`, 'conflict');
  };

  // Intelligent Timetable Generator
  const generateOptimizedTimetable = (): number => {
    const result = generateIntelligentTimetable(
      courses,
      facilities,
      lecturers,
      timeSlots,
      {
        semester: selectedSemester === 'All' ? 'Semester 1' : selectedSemester,
        separateTheoryAndPracticalDays: true,
        strictCapacityCheck: true
      }
    );
    setSchedules(result.schedules);
    setLastGeneratedResult(result);
    addActivity('Optimized Timetable Generated', `Generated ${result.schedules.length} allocations with ${result.conflictCount} conflicts`, 'generate');
    return result.schedules.length;
  };

  const runGeneration = async (options: GenerationOptions = {}): Promise<GenerationResult> => {
    setIsGenerating(true);
    addActivity('Timetable Generation Started', `Optimizing schedule for ${options.semester || selectedSemester} courses across ${facilities.length} venues`, 'generate');

    // Simulate intelligent optimization computation
    return new Promise<GenerationResult>((resolve) => {
      setTimeout(() => {
        const result = generateIntelligentTimetable(
          courses,
          facilities,
          lecturers,
          timeSlots,
          {
            semester: options.semester || selectedSemester,
            targetLevel: options.targetLevel || selectedLevel,
            separateTheoryAndPracticalDays: options.separateTheoryAndPracticalDays ?? true,
            strictCapacityCheck: options.strictCapacityCheck ?? true
          }
        );

        setSchedules(result.schedules);
        setLastGeneratedResult(result);
        setIsGenerating(false);

        if (result.conflictCount === 0) {
          addActivity('Timetable Generated Successfully', `Scheduled ${result.successfullyScheduledCount} courses with 0 conflicts across Monday-Friday`, 'generate');
        } else {
          addActivity('Conflict Detected and Resolved', `Generated timetable with ${result.conflictCount} capacity/slot warnings flagged for administrator review`, 'conflict');
        }

        resolve(result);
      }, 750);
    });
  };

  const updateScheduleEntry = (id: string, updated: Partial<TimetableEntry>) => {
    setSchedules(prev => {
      const updatedList = prev.map(s => s.id === id ? { ...s, ...updated } : s);
      return validateScheduleEntries(updatedList, facilities, lecturers);
    });
    addActivity('Schedule Entry Adjusted', `Modified timetable allocation ${id}`, 'update');
  };

  const deleteScheduleEntry = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    addActivity('Schedule Slot Cleared', `Unassigned slot ${id}`, 'update');
  };

  const clearSchedules = () => {
    setSchedules([]);
    setLastGeneratedResult(null);
    addActivity('Timetable Cleared', 'Reset all course allocations and empty schedule grid', 'update');
  };

  const resetToDefaultDataset = () => {
    setCourses(INITIAL_COURSES);
    setFacilities(INITIAL_FACILITIES);
    setLecturers(INITIAL_LECTURERS);
    setTimeSlots(INITIAL_TIME_SLOTS);
    
    const initGen = generateIntelligentTimetable(INITIAL_COURSES, INITIAL_FACILITIES, INITIAL_LECTURERS, INITIAL_TIME_SLOTS, {
      semester: 'Semester 1',
      separateTheoryAndPracticalDays: true,
      strictCapacityCheck: true
    });
    setSchedules(initGen.schedules);
    setSystemActivities(INITIAL_SYSTEM_ACTIVITIES);
    addActivity('Dataset Restored', 'Restored master University of Ghana DCIT dataset from workbook', 'import');
  };

  const importDataset = (newCourses?: Course[], newFacilities?: LectureFacility[], newLecturers?: Lecturer[]) => {
    if (newCourses && newCourses.length > 0) setCourses(newCourses);
    if (newFacilities && newFacilities.length > 0) setFacilities(newFacilities);
    if (newLecturers && newLecturers.length > 0) setLecturers(newLecturers);
    addActivity('Excel Dataset Imported', `Loaded ${newCourses?.length || 0} courses, ${newFacilities?.length || 0} facilities, ${newLecturers?.length || 0} lecturers`, 'import');
  };

  const exportTimetableData = (format: 'csv' | 'json'): string => {
    addActivity('Timetable Exported', `Exported full schedule in ${format.toUpperCase()} format`, 'export');
    if (format === 'json') {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        institution: 'University of Ghana - Department of Computer Science',
        schedules,
        courses,
        facilities,
        lecturers,
        timeSlots
      }, null, 2);
    }

    // CSV format
    const headers = [
      'Schedule ID',
      'Course Code',
      'Course Title',
      'Level',
      'Semester',
      'Day',
      'Start Time',
      'End Time',
      'Session Type',
      'Hall ID',
      'Hall Name',
      'Lecturer',
      'Enrollment',
      'Hall Capacity',
      'Status'
    ];

    const rows = schedules.map(s => [
      `"${s.id}"`,
      `"${s.courseCode}"`,
      `"${s.courseTitle}"`,
      s.level,
      `"${s.semester}"`,
      `"${s.day}"`,
      `"${s.startTime}"`,
      `"${s.endTime}"`,
      `"${s.sessionType}"`,
      `"${s.hallId}"`,
      `"${s.hallName}"`,
      `"${s.lecturerName}"`,
      s.expectedEnrollment,
      s.hallCapacity,
      s.hasConflict ? `"Conflict: ${s.conflictReason || 'Warning'}"` : '"Scheduled OK"'
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // Dynamically compute all dashboard metrics and analytics whenever state updates
  const analytics = useMemo(() => {
    return calculateDashboardAnalytics(courses, facilities, lecturers, timeSlots, schedules);
  }, [courses, facilities, lecturers, timeSlots, schedules]);

  return (
    <TimetableContext.Provider
      value={{
        courses,
        facilities,
        lecturers,
        timeSlots,
        residentialHalls,
        schedules,
        systemActivities,
        activeView,
        setActiveView,
        selectedSemester,
        setSelectedSemester,
        selectedLevel,
        setSelectedLevel,
        isGenerating,
        lastGeneratedResult,
        addCourse,
        bulkAddCourses,
        updateCourse,
        deleteCourse,
        bulkDeleteCourses,
        addFacility,
        bulkAddFacilities,
        updateFacility,
        deleteFacility,
        bulkDeleteFacilities,
        addLecturer,
        bulkAddLecturers,
        updateLecturer,
        deleteLecturer,
        bulkDeleteLecturers,
        addTimeSlot,
        bulkAddTimeSlots,
        updateTimeSlot,
        deleteTimeSlot,
        bulkDeleteTimeSlots,
        runGeneration,
        generateOptimizedTimetable,
        updateScheduleEntry,
        deleteScheduleEntry,
        bulkDeleteSchedules,
        clearSchedules,
        resetToDefaultDataset,
        importDataset,
        exportTimetableData,
        addActivity,
        analytics
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}
