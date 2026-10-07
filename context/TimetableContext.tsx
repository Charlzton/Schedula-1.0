'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  limit,
  where
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
  AcademicPeriod,
  INITIAL_COURSES,
  INITIAL_FACILITIES,
  INITIAL_LECTURERS,
  INITIAL_RESIDENTIAL_HALLS,
  INITIAL_TIME_SLOTS,
  INITIAL_SYSTEM_ACTIVITIES,
  INITIAL_BOOKING_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACADEMIC_PERIODS,
  isCourseAllocatedToLecturer
} from '@/lib/dataset';
import { RoomBookingRequest, NotificationItem } from '@/lib/lecturerTypes';
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
  savePeriodSchedulesToFirestore,
  publishPeriodTimetableInFirestore,
  unpublishPeriodTimetableInFirestore,
  setActivePeriodInFirestore,
  clearAllSchedulesFromFirestore,
  saveActivityToFirestore,
  saveBookingRequestToFirestore,
  updateBookingStatusInFirestore,
  deleteBookingRequestFromFirestore,
  createNotificationInFirestore,
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore,
  deleteNotificationFromFirestore,
  ensureFirestoreInitialized
} from '@/lib/firestoreService';

export type DashboardViewType = 
  | 'dashboard'
  | 'courses'
  | 'facilities'
  | 'lecturers'
  | 'timeslots'
  | 'booking_requests'
  | 'generate'
  | 'generated_timetables'
  | 'reports'
  | 'settings'
  | 'admin_management';

interface TimetableContextType {
  courses: Course[];
  facilities: LectureFacility[];
  lecturers: Lecturer[];
  timeSlots: TimeSlot[];
  residentialHalls: ResidentialHall[];
  schedules: TimetableEntry[];
  academicPeriods: AcademicPeriod[];
  activeAcademicPeriod: AcademicPeriod | null;
  currentAcademicYear: string;
  setCurrentAcademicYear: (year: string) => void;
  systemActivities: SystemActivity[];
  bookingRequests: RoomBookingRequest[];
  notifications: NotificationItem[];
  // Navigation & View state
  activeView: DashboardViewType;
  setActiveView: (view: DashboardViewType) => void;
  highlightedBookingId: string | null;
  setHighlightedBookingId: (id: string | null) => void;
  selectedSemester: 'All' | 'Semester 1' | 'Semester 2';
  setSelectedSemester: (sem: 'All' | 'Semester 1' | 'Semester 2') => void;
  selectedLevel: 'All' | 100 | 200 | 300 | 400;
  setSelectedLevel: (level: 'All' | 100 | 200 | 300 | 400) => void;
  isGenerating: boolean;
  lastGeneratedResult: GenerationResult | null;
  isFirestoreSyncing?: boolean;
  firestoreStatus?: 'connected' | 'syncing' | 'offline' | 'error';
  
  // Timetable Period & Publishing actions
  setActiveAcademicPeriod: (periodId: string) => Promise<void>;
  publishCurrentTimetable: (academicYear?: string, semester?: 'Semester 1' | 'Semester 2') => Promise<void>;
  unpublishCurrentTimetable: (academicYear?: string, semester?: 'Semester 1' | 'Semester 2') => Promise<void>;
  
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
  suspendLecturer: (id: string) => void;
  reactivateLecturer: (id: string) => void;
  bulkDeleteLecturers: (ids: string[]) => void;

  addTimeSlot: (slot: TimeSlot, silent?: boolean) => void;
  bulkAddTimeSlots: (slots: TimeSlot[]) => void;
  updateTimeSlot: (id: string, updated: Partial<TimeSlot>, silent?: boolean) => void;
  deleteTimeSlot: (id: string) => void;
  bulkDeleteTimeSlots: (ids: string[]) => void;

  // Booking & Notifications actions
  submitBookingRequest: (request: Omit<RoomBookingRequest, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  approveBookingRequest: (bookingId: string, feedback?: string) => Promise<void>;
  rejectBookingRequest: (bookingId: string, feedback?: string) => Promise<void>;
  withdrawBookingRequest: (bookingId: string) => Promise<void>;
  cancelBookingRequest: (bookingId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

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
  addActivity: (action: string, description: string, type: SystemActivity['type'], userMeta?: { userEmail?: string; userName?: string }) => void;

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
const STORAGE_KEY_BOOKINGS = 'schedula_bookings_v1';
const STORAGE_KEY_NOTIFICATIONS = 'schedula_notifications_v1';
const STORAGE_KEY_PERIODS = 'schedula_periods_v1';

export function TimetableProvider({ children }: { children: ReactNode }) {
  const { user, lecturerProfile, isLoading } = useAuth();

  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERIODS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_ACADEMIC_PERIODS;
  });

  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('2026/2027');

  const activeAcademicPeriod = useMemo(() => {
    return academicPeriods.find(p => p.isCurrent || p.isActive) || academicPeriods[0] || null;
  }, [academicPeriods]);

  // Instant optimistic initialization from localStorage or empty collection default
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [facilities, setFacilities] = useState<LectureFacility[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FACILITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LECTURERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMESLOTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [residentialHalls] = useState<ResidentialHall[]>(INITIAL_RESIDENTIAL_HALLS);
  
  const [schedules, setSchedules] = useState<TimetableEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [systemActivities, setSystemActivities] = useState<SystemActivity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (saved) {
        const parsed: SystemActivity[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const nonLegacy = parsed.filter(a => !['ACT-001', 'ACT-002', 'ACT-003', 'ACT-004', 'ACT-005'].includes(a.id));
          const seen = new Set<string>();
          return nonLegacy.map((act, index) => {
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
    return [];
  });

  const [bookingRequests, setBookingRequests] = useState<RoomBookingRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [activeView, setActiveView] = useState<DashboardViewType>('dashboard');
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
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
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookingRequests));
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [courses, facilities, lecturers, timeSlots, schedules, systemActivities, bookingRequests, notifications]);

  // Firestore Real-Time Subscriptions & Initialization
  // 1. Stable, non-profile dependent global feeds
  useEffect(() => {
    if (!db || isLoading || !user) return;

    let isMounted = true;
    const unsubscribes: (() => void)[] = [];

    setIsFirestoreSyncing(true);

    try {
      // Subscribe to Facilities
      const unsubFacilities = onSnapshot(collection(db, 'facilities'), (snapshot) => {
        if (!isMounted) return;
        const remoteFacilities = snapshot.docs.map((docSnap) => docSnap.data() as LectureFacility);
        if (remoteFacilities.length > 0 || snapshot.empty) {
          setFacilities(remoteFacilities);
        }
        setFirestoreStatus('connected');
      }, () => {
        if (isMounted) setFirestoreStatus('offline');
      });
      unsubscribes.push(unsubFacilities);

      // Subscribe to Lecturers
      const unsubLecturers = onSnapshot(collection(db, 'lecturers'), (snapshot) => {
        if (!isMounted) return;
        const remoteLecturers = snapshot.docs.map((docSnap) => docSnap.data() as Lecturer);
        if (remoteLecturers.length > 0 || snapshot.empty) {
          setLecturers(remoteLecturers);
        }
      }, () => {});
      unsubscribes.push(unsubLecturers);

      // Subscribe to TimeSlots
      const unsubTimeSlots = onSnapshot(collection(db, 'timeslots'), (snapshot) => {
        if (!isMounted) return;
        const remoteSlots = snapshot.docs.map((docSnap) => docSnap.data() as TimeSlot);
        if (remoteSlots.length > 0 || snapshot.empty) {
          setTimeSlots(remoteSlots);
        }
      }, () => {});
      unsubscribes.push(unsubTimeSlots);

      // Subscribe to Academic Periods
      const unsubAcademicPeriods = onSnapshot(collection(db, 'academic_periods'), (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const remotePeriods = snapshot.docs.map((docSnap) => docSnap.data() as AcademicPeriod);
          setAcademicPeriods(remotePeriods);
          try {
            localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(remotePeriods));
          } catch {}
        }
      }, () => {});
      unsubscribes.push(unsubAcademicPeriods);

      // Subscribe to Activities
      const unsubActivities = onSnapshot(collection(db, 'activities'), (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const remoteActs = snapshot.docs.map((docSnap) => docSnap.data() as SystemActivity);
          remoteActs.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setSystemActivities(remoteActs.slice(0, 50));
        }
      }, () => {});
      unsubscribes.push(unsubActivities);

      // Subscribe to Bookings
      const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        if (!isMounted) return;
        const remoteBookings = snapshot.docs.map((docSnap) => docSnap.data() as RoomBookingRequest);
        remoteBookings.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setBookingRequests(remoteBookings);
      }, () => {});
      unsubscribes.push(unsubBookings);

      // Subscribe to Notifications
      const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
        if (!isMounted) return;
        const remoteNotifs = snapshot.docs.map((docSnap) => docSnap.data() as NotificationItem);
        // Sort by creation time newest first
        remoteNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(remoteNotifs);
      }, () => {});
      unsubscribes.push(unsubNotifications);

    } catch (err) {
      console.warn('Feeds subscription exception:', err);
      if (isMounted) setFirestoreStatus('offline');
    } finally {
      if (isMounted) {
        setIsFirestoreSyncing(false);
      }
    }

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user, isLoading]);

  // 2. Profile-dependent custom feeds (Courses and Schedules)
  useEffect(() => {
    if (!db || isLoading || !user) return;

    let isMounted = true;
    const unsubscribes: (() => void)[] = [];

    // Courses subscription: Always subscribe to all courses in Firestore so real-time updates from Admin are immediately available
    const coursesQuery = query(collection(db, 'courses'));
    const unsubCourses = onSnapshot(coursesQuery, (snapshot) => {
      if (!isMounted) return;
      const remoteCourses = snapshot.docs.map((docSnap) => docSnap.data() as Course);
      setCourses(remoteCourses);
    }, (err) => {
      console.warn('Courses listener error:', err);
    });
    unsubscribes.push(unsubCourses);

    // Timetables subscription: For lecturers, subscribe to all published timetables so campus-wide room availability calculations work accurately
    let timetablesQuery = null;
    if (user?.role === 'lecturer') {
      timetablesQuery = query(
        collection(db, 'timetables'),
        where('status', '==', 'published')
      );
    } else {
      timetablesQuery = query(collection(db, 'timetables'));
    }

    const unsubTimetables = onSnapshot(timetablesQuery, (snapshot) => {
      if (!isMounted) return;
      if (!snapshot.empty) {
        const remoteSchedules = snapshot.docs.map((docSnap) => docSnap.data() as TimetableEntry);
        setSchedules(remoteSchedules);
      } else {
        setSchedules([]);
      }
    }, (err) => {
      console.warn('Timetables listener error:', err);
    });
    unsubscribes.push(unsubTimetables);

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user, isLoading]);

  const addActivity = (
    action: string, 
    description: string, 
    type: SystemActivity['type'], 
    userMeta?: { userEmail?: string; userName?: string }
  ) => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const now = new Date();
    const newAct: SystemActivity = {
      id: `ACT-${now.getTime()}-${randomSuffix}`,
      action,
      description,
      timestamp: 'Just now',
      createdAt: now.toISOString(),
      type,
      badgeColor: type === 'generate' ? 'blue' : 
                  type === 'conflict' ? 'rose' : 
                  type === 'create' ? 'emerald' : 
                  type === 'delete' ? 'rose' : 
                  type === 'booking' ? 'purple' : 'blue',
      userEmail: userMeta?.userEmail || user?.email || 'admin@ug.edu.gh',
      userName: userMeta?.userName || user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator')
    };
    setSystemActivities(prev => [newAct, ...prev.filter(a => a.id !== newAct.id)].slice(0, 50));
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
    const enrichedLecturer: Lecturer = {
      ...lecturer,
      accountStatus: lecturer.accountStatus || 'unclaimed'
    };
    setLecturers(prev => [...prev.filter(l => l.lecturerId !== enrichedLecturer.lecturerId), enrichedLecturer]);
    saveLecturerToFirestore(enrichedLecturer);
    if (!silent) {
      addActivity('Lecturer Added', `Added ${enrichedLecturer.fullName} (${enrichedLecturer.title})`, 'create');
    }
  };

  const bulkAddLecturers = (newLecturers: Lecturer[]) => {
    if (!newLecturers.length) return;
    const enriched = newLecturers.map(l => ({
      ...l,
      accountStatus: l.accountStatus || 'unclaimed'
    }));
    const newIds = new Set(enriched.map(l => l.lecturerId));
    setLecturers(prev => [...prev.filter(l => !newIds.has(l.lecturerId)), ...enriched]);
    bulkSaveLecturersToFirestore(enriched);
    addActivity('Bulk Lecturers Added', `Added ${enriched.length} faculty member profiles`, 'create');
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

  const suspendLecturer = (id: string) => {
    updateLecturer(id, { accountStatus: 'suspended' });
    addActivity('Lecturer Suspended', `Suspended faculty profile for ${id}`, 'conflict');
  };

  const reactivateLecturer = (id: string) => {
    const current = lecturers.find(l => l.lecturerId === id);
    const newStatus = current?.authUid ? 'active' : 'unclaimed';
    updateLecturer(id, { accountStatus: newStatus });
    addActivity('Lecturer Reactivated', `Reactivated faculty profile for ${id} (${newStatus})`, 'create');
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
    const targetSem = selectedSemester === 'All' ? 'Semester 1' : selectedSemester;
    const targetYear = currentAcademicYear || '2026/2027';
    const periodId = `PERIOD-${targetYear.replace('/', '-')}-${targetSem === 'Semester 1' ? 'S1' : 'S2'}`;

    const result = generateIntelligentTimetable(
      courses,
      facilities,
      lecturers,
      timeSlots,
      {
        semester: targetSem,
        separateTheoryAndPracticalDays: true,
        strictCapacityCheck: true
      }
    );

    const periodSchedules: TimetableEntry[] = result.schedules.map(s => ({
      ...s,
      academicYear: targetYear,
      semester: targetSem,
      periodId: periodId,
      status: 'draft' as const
    }));

    setSchedules(prev => {
      const otherPeriods = prev.filter(s => !(s.academicYear === targetYear && s.semester === targetSem));
      return [...otherPeriods, ...periodSchedules];
    });
    setLastGeneratedResult({ ...result, schedules: periodSchedules });
    savePeriodSchedulesToFirestore(targetYear, targetSem, periodSchedules);
    addActivity('Optimized Timetable Generated', `Generated ${periodSchedules.length} allocations for ${targetYear} (${targetSem}) with ${result.conflictCount} conflicts`, 'generate');
    return periodSchedules.length;
  };

  const runGeneration = async (options: GenerationOptions = {}): Promise<GenerationResult> => {
    setIsGenerating(true);
    const targetSem: 'Semester 1' | 'Semester 2' = (options.semester && options.semester !== 'All') 
      ? options.semester 
      : (selectedSemester === 'All' ? 'Semester 1' : selectedSemester);
    const targetYear = currentAcademicYear || '2026/2027';
    const periodId = `PERIOD-${targetYear.replace('/', '-')}-${targetSem === 'Semester 1' ? 'S1' : 'S2'}`;

    addActivity('Timetable Generation Started', `Optimizing schedule for ${targetYear} ${targetSem} courses across ${facilities.length} venues`, 'generate');

    return new Promise<GenerationResult>((resolve) => {
      setTimeout(() => {
        const result = generateIntelligentTimetable(
          courses,
          facilities,
          lecturers,
          timeSlots,
          {
            semester: targetSem,
            targetLevel: options.targetLevel || selectedLevel,
            separateTheoryAndPracticalDays: options.separateTheoryAndPracticalDays ?? true,
            strictCapacityCheck: options.strictCapacityCheck ?? true
          }
        );

        const periodSchedules: TimetableEntry[] = result.schedules.map(s => ({
          ...s,
          academicYear: targetYear,
          semester: targetSem,
          periodId: periodId,
          status: 'draft' as const
        }));

        setSchedules(prev => {
          const otherPeriods = prev.filter(s => !(s.academicYear === targetYear && s.semester === targetSem));
          return [...otherPeriods, ...periodSchedules];
        });
        const finalResult = { ...result, schedules: periodSchedules };
        setLastGeneratedResult(finalResult);
        setIsGenerating(false);

        savePeriodSchedulesToFirestore(targetYear, targetSem, periodSchedules);

        if (result.conflictCount === 0) {
          addActivity('Timetable Generated Successfully', `Scheduled ${result.successfullyScheduledCount} courses for ${targetYear} ${targetSem} with 0 conflicts across Monday-Friday`, 'generate');
        } else {
          addActivity('Conflict Detected and Resolved', `Generated timetable for ${targetYear} ${targetSem} with ${result.conflictCount} capacity/slot warnings flagged for administrator review`, 'conflict');
        }

        resolve(finalResult);
      }, 750);
    });
  };

  const publishCurrentTimetable = async (academicYear?: string, semester?: 'Semester 1' | 'Semester 2'): Promise<void> => {
    const targetYear = academicYear || currentAcademicYear || '2026/2027';
    const targetSem = semester || (selectedSemester === 'All' ? 'Semester 1' : selectedSemester);
    const publisher = user?.name || user?.email || 'Academic Administrator';

    setSchedules(prev => prev.map(s => {
      if (s.academicYear === targetYear && s.semester === targetSem) {
        return {
          ...s,
          status: 'published',
          publishedAt: new Date().toISOString(),
          publishedBy: publisher
        };
      }
      return s;
    }));

    setAcademicPeriods(prev => prev.map(p => {
      if (p.academicYear === targetYear && p.semester === targetSem) {
        return {
          ...p,
          isPublished: true,
          publishedAt: new Date().toISOString(),
          publishedBy: publisher
        };
      }
      return p;
    }));

    await publishPeriodTimetableInFirestore(targetYear, targetSem, publisher);
    addActivity('Timetable Published', `Official academic timetable for ${targetYear} ${targetSem} published for university faculty and students`, 'update');
  };

  const unpublishCurrentTimetable = async (academicYear?: string, semester?: 'Semester 1' | 'Semester 2'): Promise<void> => {
    const targetYear = academicYear || currentAcademicYear || '2026/2027';
    const targetSem = semester || (selectedSemester === 'All' ? 'Semester 1' : selectedSemester);

    setSchedules(prev => prev.map(s => {
      if (s.academicYear === targetYear && s.semester === targetSem) {
        return {
          ...s,
          status: 'draft'
        };
      }
      return s;
    }));

    setAcademicPeriods(prev => prev.map(p => {
      if (p.academicYear === targetYear && p.semester === targetSem) {
        return {
          ...p,
          isPublished: false
        };
      }
      return p;
    }));

    await unpublishPeriodTimetableInFirestore(targetYear, targetSem);
    addActivity('Timetable Unpublished', `Timetable for ${targetYear} ${targetSem} returned to draft status`, 'update');
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

  const setActiveAcademicPeriod = async (periodId: string): Promise<void> => {
    setAcademicPeriods(prev => prev.map(p => ({
      ...p,
      isCurrent: p.id === periodId,
      isActive: p.id === periodId
    })));
    const target = academicPeriods.find(p => p.id === periodId);
    if (target) {
      setCurrentAcademicYear(target.academicYear);
      if (target.semester === 'Semester 1' || target.semester === 'Semester 2') {
        setSelectedSemester(target.semester);
      }
    }
    await setActivePeriodInFirestore(periodId);
    addActivity('Active Period Changed', `Switched active academic period to ${target?.academicYear || ''} ${target?.semester || ''}`, 'update');
  };

  const exportTimetableData = (
    format: 'csv' | 'json',
    exportOptions?: { academicYear?: string; semester?: string; lecturerId?: string; publishedOnly?: boolean }
  ): string => {
    let sourceSchedules = [...schedules];

    if (exportOptions?.academicYear) {
      sourceSchedules = sourceSchedules.filter(s => (s.academicYear || '2026/2027') === exportOptions.academicYear);
    }
    if (exportOptions?.semester && exportOptions.semester !== 'All') {
      sourceSchedules = sourceSchedules.filter(s => s.semester === exportOptions.semester);
    }
    if (exportOptions?.lecturerId) {
      sourceSchedules = sourceSchedules.filter(s => s.lecturerId === exportOptions.lecturerId);
    }
    if (exportOptions?.publishedOnly) {
      sourceSchedules = sourceSchedules.filter(s => s.status === 'published');
    }

    addActivity('Timetable Exported', `Exported ${sourceSchedules.length} schedules in ${format.toUpperCase()} format`, 'export');
    if (format === 'json') {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        institution: 'University of Ghana - Department of Computer Science',
        academicYear: exportOptions?.academicYear || currentAcademicYear,
        semester: exportOptions?.semester || selectedSemester,
        schedules: sourceSchedules,
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
      'Academic Year',
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

    const rows = sourceSchedules.map(s => [
      `"${s.id}"`,
      `"${s.courseCode}"`,
      `"${s.courseTitle}"`,
      s.level,
      `"${s.semester}"`,
      `"${s.academicYear || '2026/2027'}"`,
      `"${s.day}"`,
      `"${s.startTime}"`,
      `"${s.endTime}"`,
      `"${s.sessionType}"`,
      `"${s.hallId}"`,
      `"${s.hallName}"`,
      `"${s.lecturerName}"`,
      s.expectedEnrollment,
      s.hallCapacity,
      s.hasConflict ? `"Conflict: ${s.conflictReason || 'Warning'}"` : `"${s.status || 'draft'}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // ---------------- BOOKING & NOTIFICATION ACTIONS ---------------- //

  const submitBookingRequest = async (request: Omit<RoomBookingRequest, 'id' | 'submittedAt' | 'status'>): Promise<void> => {
    const bookingId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const nowIso = new Date().toISOString();
    const newBooking: RoomBookingRequest = {
      ...request,
      id: bookingId,
      status: 'Pending',
      submittedAt: nowIso
    };

    // Admin Notification payload
    const adminNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientRole: 'admin',
      title: 'New Room Request',
      message: `${newBooking.lecturerName} requested ${newBooking.hallName} for ${newBooking.day} ${newBooking.timeSlot} (${newBooking.courseCode})`,
      type: 'booking_request',
      referenceId: bookingId,
      createdAt: nowIso,
      isRead: false
    };

    // Optimistic updates for bookings and notifications
    setBookingRequests(prev => [newBooking, ...prev.filter(b => b.id !== bookingId)]);
    setNotifications(prev => [adminNotif, ...prev.filter(n => n.id !== adminNotif.id)]);

    try {
      await saveBookingRequestToFirestore(newBooking);
      await createNotificationInFirestore(adminNotif);

      addActivity(
        'Room Request Submitted', 
        `Room request submitted by ${newBooking.lecturerName} for ${newBooking.hallName}`, 
        'booking',
        { userEmail: newBooking.lecturerEmail, userName: newBooking.lecturerName }
      );
    } catch (err) {
      console.warn('[Context] submitBookingRequest error:', err);
      throw err;
    }
  };

  const approveBookingRequest = async (bookingId: string, feedback?: string): Promise<void> => {
    const targetBooking = bookingRequests.find(b => b.id === bookingId);
    const reviewerName = user?.name || user?.email || 'Administrator';
    const nowIso = new Date().toISOString();

    // Optimistic booking update
    setBookingRequests(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'Approved',
          reviewedAt: nowIso,
          reviewedBy: reviewerName,
          adminFeedback: feedback || b.adminFeedback
        };
      }
      return b;
    }));

    if (targetBooking) {
      // Create Lecturer Notification
      const lecturerNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientRole: 'lecturer',
        recipientId: targetBooking.lecturerId,
        recipientEmail: targetBooking.lecturerEmail,
        title: 'Room Request Approved',
        message: `Your request for ${targetBooking.hallName} on ${targetBooking.day} ${targetBooking.timeSlot} has been approved.${feedback ? ` Note: ${feedback}` : ''}`,
        type: 'booking_approved',
        referenceId: bookingId,
        createdAt: nowIso,
        isRead: false
      };
      setNotifications(prev => [lecturerNotif, ...prev.filter(n => n.id !== lecturerNotif.id)]);

      try {
        await updateBookingStatusInFirestore(bookingId, 'Approved', {
          reviewedBy: reviewerName,
          reviewedAt: nowIso,
          adminFeedback: feedback
        });
        await createNotificationInFirestore(lecturerNotif);

        addActivity(
          'Room Request Approved', 
          `Room request approved for ${targetBooking.lecturerName} — ${targetBooking.hallName}`, 
          'booking',
          { userEmail: user?.email, userName: reviewerName }
        );
      } catch (err) {
        console.warn('[Context] approveBookingRequest error:', err);
        throw err;
      }
    }
  };

  const rejectBookingRequest = async (bookingId: string, feedback?: string): Promise<void> => {
    const targetBooking = bookingRequests.find(b => b.id === bookingId);
    const reviewerName = user?.name || user?.email || 'Administrator';
    const nowIso = new Date().toISOString();
    const rejectionReason = feedback?.trim() || 'Conflicting departmental event';

    // Optimistic booking update
    setBookingRequests(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'Rejected',
          reviewedAt: nowIso,
          reviewedBy: reviewerName,
          adminFeedback: rejectionReason
        };
      }
      return b;
    }));

    if (targetBooking) {
      // Create Lecturer Notification
      const lecturerNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientRole: 'lecturer',
        recipientId: targetBooking.lecturerId,
        recipientEmail: targetBooking.lecturerEmail,
        title: 'Room Request Declined',
        message: `Your request for ${targetBooking.hallName} on ${targetBooking.day} ${targetBooking.timeSlot} was declined: ${rejectionReason}`,
        type: 'booking_rejected',
        referenceId: bookingId,
        createdAt: nowIso,
        isRead: false
      };
      setNotifications(prev => [lecturerNotif, ...prev.filter(n => n.id !== lecturerNotif.id)]);

      try {
        await updateBookingStatusInFirestore(bookingId, 'Rejected', {
          reviewedBy: reviewerName,
          reviewedAt: nowIso,
          adminFeedback: rejectionReason
        });
        await createNotificationInFirestore(lecturerNotif);

        addActivity(
          'Room Request Declined', 
          `Room request declined for ${targetBooking.lecturerName} — ${targetBooking.hallName}`, 
          'booking',
          { userEmail: user?.email, userName: reviewerName }
        );
      } catch (err) {
        console.warn('[Context] rejectBookingRequest error:', err);
        throw err;
      }
    }
  };

  const withdrawBookingRequest = async (bookingId: string): Promise<void> => {
    const targetBooking = bookingRequests.find(b => b.id === bookingId);
    if (targetBooking && targetBooking.status !== 'Pending') {
      throw new Error('Only pending booking requests can be withdrawn.');
    }
    const nowIso = new Date().toISOString();

    // Optimistic update
    setBookingRequests(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'Withdrawn',
          reviewedAt: nowIso
        };
      }
      return b;
    }));

    if (targetBooking) {
      const adminNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientRole: 'admin',
        title: 'Room Request Withdrawn',
        message: `${targetBooking.lecturerName} withdrew their request for ${targetBooking.hallName} on ${targetBooking.day} ${targetBooking.timeSlot}`,
        type: 'booking_withdrawn',
        referenceId: bookingId,
        createdAt: nowIso,
        isRead: false
      };
      setNotifications(prev => [adminNotif, ...prev.filter(n => n.id !== adminNotif.id)]);

      try {
        await updateBookingStatusInFirestore(bookingId, 'Withdrawn', {
          reviewedAt: nowIso
        });
        await createNotificationInFirestore(adminNotif);

        addActivity(
          'Room Request Withdrawn', 
          `${targetBooking.lecturerName} withdrew room request for ${targetBooking.hallName}`, 
          'booking',
          { userEmail: targetBooking.lecturerEmail, userName: targetBooking.lecturerName }
        );
      } catch (err) {
        console.warn('[Context] withdrawBookingRequest error:', err);
        if (targetBooking) {
          setBookingRequests(prev => prev.map(b => b.id === bookingId ? targetBooking : b));
        }
        throw err;
      }
    }
  };

  const cancelBookingRequest = async (bookingId: string): Promise<void> => {
    await withdrawBookingRequest(bookingId);
  };

  const markNotificationRead = async (notificationId: string): Promise<void> => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    await markNotificationAsReadInFirestore(notificationId);
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllNotificationsAsReadInFirestore(unreadIds);
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    await deleteNotificationFromFirestore(notificationId);
  };

  // Secure courses exposure for lecturers at the Context boundary
  const securedCourses = useMemo(() => {
    if (user?.role === 'lecturer') {
      const activeFaculty = lecturerProfile || (user?.lecturerId ? lecturers.find(l => l.lecturerId === user.lecturerId) : null);
      if (!activeFaculty) return [];
      return courses.filter(c => isCourseAllocatedToLecturer(c, activeFaculty));
    }
    return courses;
  }, [courses, user, lecturerProfile, lecturers]);

  // Secure schedules exposure for lecturers at the Context boundary
  const securedSchedules = useMemo(() => {
    if (user?.role === 'lecturer') {
      // If the active academic period is unpublished, lecturer sees no schedules
      if (activeAcademicPeriod && !activeAcademicPeriod.isPublished) {
        return [];
      }

      const currentLecturerId = lecturerProfile?.lecturerId || user?.lecturerId;
      if (!currentLecturerId) return [];
      
      const email = user.email?.toLowerCase();
      const name = (lecturerProfile?.fullName || user.name || '').toLowerCase();
      const activeYear = activeAcademicPeriod?.academicYear || currentAcademicYear;
      const activeSem = activeAcademicPeriod?.semester;

      return schedules.filter(s => {
        if (s.status !== 'published') return false;

        // Match academic year and semester of current active period
        const sYear = s.academicYear || '2026/2027';
        if (sYear !== activeYear) return false;
        if (activeSem && s.semester !== activeSem) return false;

        // Match lecturer identity
        if (s.lecturerId && s.lecturerId === currentLecturerId) return true;
        if (s.lecturerEmail && email && s.lecturerEmail.toLowerCase() === email) return true;
        if (s.lecturerName && name && s.lecturerName.toLowerCase() === name) return true;
        return false;
      });
    }
    return schedules;
  }, [schedules, user, lecturerProfile, activeAcademicPeriod, currentAcademicYear]);

  // Dynamically compute all dashboard metrics and analytics whenever state updates
  const analytics = useMemo(() => {
    return calculateDashboardAnalytics(securedCourses, facilities, lecturers, timeSlots, securedSchedules);
  }, [securedCourses, facilities, lecturers, timeSlots, securedSchedules]);

  return (
    <TimetableContext.Provider
      value={{
        courses: securedCourses,
        facilities,
        lecturers,
        timeSlots,
        residentialHalls,
        schedules: securedSchedules,
        academicPeriods,
        activeAcademicPeriod,
        currentAcademicYear,
        setCurrentAcademicYear,
        setActiveAcademicPeriod,
        publishCurrentTimetable,
        unpublishCurrentTimetable,
        systemActivities,
        bookingRequests,
        notifications,
        activeView,
        setActiveView,
        highlightedBookingId,
        setHighlightedBookingId,
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
        suspendLecturer,
        reactivateLecturer,
        bulkDeleteLecturers,
        addTimeSlot,
        bulkAddTimeSlots,
        updateTimeSlot,
        deleteTimeSlot,
        bulkDeleteTimeSlots,
        submitBookingRequest,
        approveBookingRequest,
        rejectBookingRequest,
        withdrawBookingRequest,
        cancelBookingRequest,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
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
