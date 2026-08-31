'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import {
  saveCourseToFirestore,
  deleteCourseFromFirestore,
  bulkSaveCoursesToFirestore,
  bulkDeleteCoursesFromFirestore,
  saveFacilityToFirestore,
  deleteFacilityFromFirestore,
  bulkSaveFacilitiesToFirestore,
  bulkDeleteFacilitiesFromFirestore,
  saveLecturerToFirestore,
  deleteLecturerFromFirestore,
  bulkSaveLecturersToFirestore,
  bulkDeleteLecturersFromFirestore,
  saveTimeSlotToFirestore,
  deleteTimeSlotFromFirestore,
  bulkSaveTimeSlotsToFirestore,
  bulkDeleteTimeSlotsFromFirestore,
  saveScheduleEntryToFirestore,
  deleteScheduleEntryFromFirestore,
  bulkDeleteSchedulesFromFirestore,
  saveAllSchedulesToFirestore,
  clearAllSchedulesFromFirestore,
  saveActivityToFirestore,
  ensureFirestoreInitialized
} from '@/lib/firestoreService';

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
  isFirestoreSyncing?: boolean;
  firestoreStatus?: 'connected' | 'syncing' | 'offline' | 'error';
  
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
  const { user, isLoading } = useAuth();

  // Instant optimistic initialization from localStorage or dataset defaults
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COURSES;
  });

  const [facilities, setFacilities] = useState<LectureFacility[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FACILITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FACILITIES;
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LECTURERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_LECTURERS;
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMESLOTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TIME_SLOTS;
  });

  const [residentialHalls] = useState<ResidentialHall[]>(INITIAL_RESIDENTIAL_HALLS);
  
  const [schedules, setSchedules] = useState<TimetableEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
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
        if (Array.isArray(parsed) && parsed.length > 0) {
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
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('syncing');

  // Save to local storage as fallback cache
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

  // Firestore Real-Time Subscriptions & Initialization
  useEffect(() => {
    // Only proceed once authentication has finished loading and an authenticated user is present
    if (!db || isLoading || !user) return;

    let isMounted = true;
    const unsubscribes: (() => void)[] = [];

    async function initAndSubscribe() {
      try {
        setIsFirestoreSyncing(true);
        // Step 1: Ensure initial dataset exists in Firestore if collections are empty
        await ensureFirestoreInitialized();

        if (!isMounted) return;

        // Step 2: Subscribe to Courses
        const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
          if (!snapshot.empty) {
            const remoteCourses = snapshot.docs.map((docSnap) => docSnap.data() as Course);
            setCourses(remoteCourses);
          }
          setFirestoreStatus('connected');
        }, (err) => {
          console.warn('[Firestore] Courses sync notice:', err.message);
          setFirestoreStatus('offline');
        });
        unsubscribes.push(unsubCourses);

        // Step 3: Subscribe to Facilities
        const unsubFacilities = onSnapshot(collection(db, 'facilities'), (snapshot) => {
          if (!snapshot.empty) {
            const remoteFacilities = snapshot.docs.map((docSnap) => docSnap.data() as LectureFacility);
            setFacilities(remoteFacilities);
          }
        }, (err) => {
          console.warn('[Firestore] Facilities sync notice:', err.message);
        });
        unsubscribes.push(unsubFacilities);

        // Step 4: Subscribe to Lecturers
        const unsubLecturers = onSnapshot(collection(db, 'lecturers'), (snapshot) => {
          if (!snapshot.empty) {
            const remoteLecturers = snapshot.docs.map((docSnap) => docSnap.data() as Lecturer);
            setLecturers(remoteLecturers);
          }
        }, (err) => {
          console.warn('[Firestore] Lecturers sync notice:', err.message);
        });
        unsubscribes.push(unsubLecturers);

        // Step 5: Subscribe to TimeSlots
        const unsubTimeSlots = onSnapshot(collection(db, 'timeslots'), (snapshot) => {
          if (!snapshot.empty) {
            const remoteSlots = snapshot.docs.map((docSnap) => docSnap.data() as TimeSlot);
            setTimeSlots(remoteSlots);
          }
        }, (err) => {
          console.warn('[Firestore] TimeSlots sync notice:', err.message);
        });
        unsubscribes.push(unsubTimeSlots);

        // Step 6: Subscribe to Timetables
        const unsubTimetables = onSnapshot(collection(db, 'timetables'), (snapshot) => {
          if (!snapshot.empty) {
            const remoteSchedules = snapshot.docs.map((docSnap) => docSnap.data() as TimetableEntry);
            setSchedules(remoteSchedules);
          }
        }, (err) => {
          console.warn('[Firestore] Timetables sync notice:', err.message);
        });
        unsubscribes.push(unsubTimetables);

        // Step 7: Subscribe to Activities
        const qActivities = query(collection(db, 'activities'), limit(30));
        const unsubActivities = onSnapshot(qActivities, (snapshot) => {
          if (!snapshot.empty) {
            const remoteActs = snapshot.docs.map((docSnap) => docSnap.data() as SystemActivity);
            setSystemActivities(remoteActs);
          }
        }, (err) => {
          console.warn('[Firestore] Activities sync notice:', err.message);
        });
        unsubscribes.push(unsubActivities);

      } catch (error) {
        console.warn('[Firestore] Initialization sync notice:', error);
        setFirestoreStatus('offline');
      } finally {
        if (isMounted) {
          setIsFirestoreSyncing(false);
        }
      }
    }

    initAndSubscribe();

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user, isLoading]);

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
    saveActivityToFirestore(newAct);
  };

  // Course CRUD
  const addCourse = (course: Course, silent: boolean = false) => {
    setCourses(prev => [...prev.filter(c => c.courseCode !== course.courseCode), course]);
    saveCourseToFirestore(course);
    if (!silent) {
      addActivity('Course Created', `Added ${course.courseCode} - ${course.courseTitle} (${course.level} Level)`, 'create');
    }
  };

  const bulkAddCourses = (newCourses: Course[]) => {
    if (!newCourses.length) return;
    const newCodes = new Set(newCourses.map(c => c.courseCode));
    setCourses(prev => [...prev.filter(c => !newCodes.has(c.courseCode)), ...newCourses]);
    bulkSaveCoursesToFirestore(newCourses);
    addActivity('Bulk Courses Added', `Added ${newCourses.length} courses to departmental catalog`, 'create');
  };

  const updateCourse = (code: string, updated: Partial<Course>, silent: boolean = false) => {
    let updatedCourse: Course | null = null;
    setCourses(prev => prev.map(c => {
      if (c.courseCode === code) {
        updatedCourse = { ...c, ...updated };
        return updatedCourse;
      }
      return c;
    }));
    if (updatedCourse) {
      saveCourseToFirestore(updatedCourse);
    }
    if (!silent) {
      addActivity('Course Updated', `Updated course parameters for ${code}`, 'update');
    }
  };

  const deleteCourse = (code: string) => {
    setCourses(prev => prev.filter(c => c.courseCode !== code));
    setSchedules(prev => prev.filter(s => s.courseCode !== code));
    deleteCourseFromFirestore(code);
    addActivity('Course Removed', `Deleted ${code} from departmental course catalog`, 'conflict');
  };

  const bulkDeleteCourses = (codes: string[]) => {
    if (!codes.length) return;
    const codeSet = new Set(codes);
    setCourses(prev => prev.filter(c => !codeSet.has(c.courseCode)));
    setSchedules(prev => prev.filter(s => !codeSet.has(s.courseCode)));
    bulkDeleteCoursesFromFirestore(codes);
    addActivity('Bulk Delete Courses', `Removed ${codes.length} courses from catalog`, 'conflict');
  };

  // Facility CRUD
  const addFacility = (facility: LectureFacility, silent: boolean = false) => {
    setFacilities(prev => [...prev.filter(f => f.hallId !== facility.hallId), facility]);
    saveFacilityToFirestore(facility);
    if (!silent) {
      addActivity('Facility Added', `Registered ${facility.hallName} (${facility.capacity} seats)`, 'create');
    }
  };

  const bulkAddFacilities = (newFacilities: LectureFacility[]) => {
    if (!newFacilities.length) return;
    const newIds = new Set(newFacilities.map(f => f.hallId));
    setFacilities(prev => [...prev.filter(f => !newIds.has(f.hallId)), ...newFacilities]);
    bulkSaveFacilitiesToFirestore(newFacilities);
    addActivity('Bulk Facilities Added', `Registered ${newFacilities.length} lecture venues`, 'create');
  };

  const updateFacility = (id: string, updated: Partial<LectureFacility>, silent: boolean = false) => {
    let updatedFacility: LectureFacility | null = null;
    setFacilities(prev => prev.map(f => {
      if (f.hallId === id) {
        updatedFacility = { ...f, ...updated };
        return updatedFacility;
      }
      return f;
    }));
    if (updatedFacility) {
      saveFacilityToFirestore(updatedFacility);
    }
    setSchedules(prev => validateScheduleEntries(prev, facilities.map(f => f.hallId === id ? { ...f, ...updated } : f), lecturers));
    if (!silent) {
      addActivity('Lecture Facility Updated', `Updated venue details for ${id}`, 'update');
    }
  };

  const deleteFacility = (id: string) => {
    setFacilities(prev => prev.filter(f => f.hallId !== id));
    setSchedules(prev => prev.filter(s => s.hallId !== id));
    deleteFacilityFromFirestore(id);
    addActivity('Facility Removed', `Decommissioned hall ID ${id}`, 'update');
  };

  const bulkDeleteFacilities = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setFacilities(prev => prev.filter(f => !idSet.has(f.hallId)));
    setSchedules(prev => prev.filter(s => !idSet.has(s.hallId)));
    bulkDeleteFacilitiesFromFirestore(ids);
    addActivity('Bulk Delete Facilities', `Decommissioned ${ids.length} lecture facilities`, 'conflict');
  };

  // Lecturer CRUD
  const addLecturer = (lecturer: Lecturer, silent: boolean = false) => {
    setLecturers(prev => [...prev.filter(l => l.lecturerId !== lecturer.lecturerId), lecturer]);
    saveLecturerToFirestore(lecturer);
    if (!silent) {
      addActivity('Lecturer Added', `Added ${lecturer.fullName} (${lecturer.title})`, 'create');
    }
  };

  const bulkAddLecturers = (newLecturers: Lecturer[]) => {
    if (!newLecturers.length) return;
    const newIds = new Set(newLecturers.map(l => l.lecturerId));
    setLecturers(prev => [...prev.filter(l => !newIds.has(l.lecturerId)), ...newLecturers]);
    bulkSaveLecturersToFirestore(newLecturers);
    addActivity('Bulk Lecturers Added', `Added ${newLecturers.length} faculty member profiles`, 'create');
  };

  const updateLecturer = (id: string, updated: Partial<Lecturer>, silent: boolean = false) => {
    let updatedLecturer: Lecturer | null = null;
    setLecturers(prev => prev.map(l => {
      if (l.lecturerId === id) {
        updatedLecturer = { ...l, ...updated };
        return updatedLecturer;
      }
      return l;
    }));
    if (updatedLecturer) {
      saveLecturerToFirestore(updatedLecturer);
    }
    if (!silent) {
      addActivity('Lecturer Updated', `Modified profile for ${id}`, 'update');
    }
  };

  const deleteLecturer = (id: string) => {
    setLecturers(prev => prev.filter(l => l.lecturerId !== id));
    deleteLecturerFromFirestore(id);
    addActivity('Lecturer Removed', `Removed lecturer record ${id}`, 'update');
  };

  const bulkDeleteLecturers = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setLecturers(prev => prev.filter(l => !idSet.has(l.lecturerId)));
    bulkDeleteLecturersFromFirestore(ids);
    addActivity('Bulk Delete Lecturers', `Removed ${ids.length} lecturer profiles`, 'conflict');
  };

  // TimeSlot CRUD
  const addTimeSlot = (slot: TimeSlot, silent: boolean = false) => {
    setTimeSlots(prev => [...prev.filter(s => s.slotId !== slot.slotId), slot]);
    saveTimeSlotToFirestore(slot);
    if (!silent) {
      addActivity('Time Slot Added', `Added ${slot.day} slot ${slot.startTime}-${slot.endTime}`, 'create');
    }
  };

  const bulkAddTimeSlots = (newSlots: TimeSlot[]) => {
    if (!newSlots.length) return;
    const newIds = new Set(newSlots.map(s => s.slotId));
    setTimeSlots(prev => [...prev.filter(s => !newIds.has(s.slotId)), ...newSlots]);
    bulkSaveTimeSlotsToFirestore(newSlots);
    addActivity('Bulk Time Slots Added', `Configured ${newSlots.length} schedule periods`, 'create');
  };

  const updateTimeSlot = (id: string, updated: Partial<TimeSlot>, silent: boolean = false) => {
    let updatedSlot: TimeSlot | null = null;
    setTimeSlots(prev => prev.map(s => {
      if (s.slotId === id) {
        updatedSlot = { ...s, ...updated };
        return updatedSlot;
      }
      return s;
    }));
    if (updatedSlot) {
      saveTimeSlotToFirestore(updatedSlot);
    }
    if (!silent) {
      addActivity('Time Slot Updated', `Updated parameters for slot ${id}`, 'update');
    }
  };

  const deleteTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(s => s.slotId !== id));
    setSchedules(prev => prev.filter(s => s.slotId !== id));
    deleteTimeSlotFromFirestore(id);
    addActivity('Time Slot Removed', `Removed slot ${id}`, 'update');
  };

  const bulkDeleteTimeSlots = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setTimeSlots(prev => prev.filter(s => !idSet.has(s.slotId)));
    setSchedules(prev => prev.filter(s => !idSet.has(s.slotId)));
    bulkDeleteTimeSlotsFromFirestore(ids);
    addActivity('Bulk Delete Time Slots', `Removed ${ids.length} time slot periods`, 'conflict');
  };

  const bulkDeleteSchedules = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setSchedules(prev => prev.filter(s => !idSet.has(s.id)));
    bulkDeleteSchedulesFromFirestore(ids);
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
    saveAllSchedulesToFirestore(result.schedules);
    addActivity('Optimized Timetable Generated', `Generated ${result.schedules.length} allocations with ${result.conflictCount} conflicts`, 'generate');
    return result.schedules.length;
  };

  const runGeneration = async (options: GenerationOptions = {}): Promise<GenerationResult> => {
    setIsGenerating(true);
    addActivity('Timetable Generation Started', `Optimizing schedule for ${options.semester || selectedSemester} courses across ${facilities.length} venues`, 'generate');

    // Perform intelligent optimization computation
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

        saveAllSchedulesToFirestore(result.schedules);

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
    let updatedEntry: TimetableEntry | null = null;
    setSchedules(prev => {
      const updatedList = prev.map(s => {
        if (s.id === id) {
          updatedEntry = { ...s, ...updated };
          return updatedEntry;
        }
        return s;
      });
      return validateScheduleEntries(updatedList, facilities, lecturers);
    });
    if (updatedEntry) {
      saveScheduleEntryToFirestore(updatedEntry);
    }
    addActivity('Schedule Entry Adjusted', `Modified timetable allocation ${id}`, 'update');
  };

  const deleteScheduleEntry = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    deleteScheduleEntryFromFirestore(id);
    addActivity('Schedule Slot Cleared', `Unassigned slot ${id}`, 'update');
  };

  const clearSchedules = () => {
    setSchedules([]);
    setLastGeneratedResult(null);
    clearAllSchedulesFromFirestore();
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

    // Sync full default dataset to Firestore
    bulkSaveCoursesToFirestore(INITIAL_COURSES);
    bulkSaveFacilitiesToFirestore(INITIAL_FACILITIES);
    bulkSaveLecturersToFirestore(INITIAL_LECTURERS);
    bulkSaveTimeSlotsToFirestore(INITIAL_TIME_SLOTS);
    saveAllSchedulesToFirestore(initGen.schedules);

    addActivity('Dataset Restored', 'Restored master University of Ghana DCIT dataset from workbook', 'import');
  };

  const importDataset = (newCourses?: Course[], newFacilities?: LectureFacility[], newLecturers?: Lecturer[]) => {
    if (newCourses && newCourses.length > 0) {
      setCourses(newCourses);
      bulkSaveCoursesToFirestore(newCourses);
    }
    if (newFacilities && newFacilities.length > 0) {
      setFacilities(newFacilities);
      bulkSaveFacilitiesToFirestore(newFacilities);
    }
    if (newLecturers && newLecturers.length > 0) {
      setLecturers(newLecturers);
      bulkSaveLecturersToFirestore(newLecturers);
    }
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
        isFirestoreSyncing,
        firestoreStatus,
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
