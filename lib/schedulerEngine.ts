import { 
  Course, 
  LectureFacility, 
  Lecturer, 
  TimeSlot, 
  TimetableEntry
} from './dataset';

export interface GenerationOptions {
  semester?: 'Semester 1' | 'Semester 2' | 'All';
  targetLevel?: number | 'All';
  separateTheoryAndPracticalDays?: boolean;
  strictCapacityCheck?: boolean;
  academicYear?: string;
  status?: 'generated' | 'published' | 'draft';
}

export interface GenerationResult {
  schedules: TimetableEntry[];
  totalCoursesTargeted: number;
  successfullyScheduledCount: number;
  conflictCount: number;
  unsatisfiedCount: number;
  conflicts: {
    courseCode: string;
    reason: string;
    type: string;
  }[];
}

/**
 * Intelligent Timetable Scheduler Algorithm
 * Implements Heuristic Constraint Satisfaction:
 * 1. Most Constrained Variable First (Large enrollment courses & Lab sessions first)
 * 2. Hard Constraints: No Room Double Booking, No Lecturer Collision, No Level Clashing
 * 3. Soft Constraints: Separate Theory & Practical on different days, optimal room capacity utilization
 */
export function generateIntelligentTimetable(
  courses: Course[] = [],
  facilities: LectureFacility[] = [],
  lecturers: Lecturer[] = [],
  timeSlots: TimeSlot[] = [],
  options: GenerationOptions = { semester: 'Semester 1', separateTheoryAndPracticalDays: true, strictCapacityCheck: true }
): GenerationResult {
  const selectedSemester = options.semester || 'Semester 1';
  
  // Filter courses based on semester and level selection
  const targetCourses = courses.filter(c => {
    if (selectedSemester !== 'All' && c.semester !== selectedSemester) return false;
    if (options.targetLevel && options.targetLevel !== 'All' && c.level !== options.targetLevel) return false;
    return true;
  });

  // Sort courses by difficulty to schedule: highest enrollment and highest total hours first
  const sortedCourses = [...targetCourses].sort((a, b) => {
    return b.expectedEnrollment - a.expectedEnrollment;
  });

  const activeHalls = facilities.filter(f => f.status === 'Active');
  const theorySlots = timeSlots.filter(s => s.sessionType === 'Theory');
  const labSlots = timeSlots.filter(s => s.sessionType === 'Lab / Practical');

  const allocatedSchedules: TimetableEntry[] = [];
  const conflictsList: { courseCode: string; reason: string; type: string }[] = [];

  // Track occupancies: key = `${slotId}_${hallId}`
  const roomOccupancy = new Set<string>();
  // Track lecturer occupancies: key = `${slotId}_${lecturerId}`
  const lecturerOccupancy = new Set<string>();
  // Track cohort occupancies: key = `${slotId}_Level${level}_${semester}`
  const cohortOccupancy = new Set<string>();

  for (const course of sortedCourses) {
    const lecturer = lecturers.find(l => 
      l.lecturerId === course.assignedLecturerId || 
      (Array.isArray(l.assignedCourses) && l.assignedCourses.includes(course.courseCode)) ||
      (typeof l.assignedCourses === 'string' && l.assignedCourses.includes(course.courseCode))
    ) || lecturers[0];

    let theoryScheduled = false;
    let practicalScheduled = course.practicalHours === 0;
    let theoryDay: string | null = null;

    // --- STEP 1: SCHEDULE THEORY SESSION (2 Hours) ---
    // Find candidate theory halls with capacity >= enrollment
    const candidateTheoryHalls = activeHalls
      .filter(h => h.venueType !== 'Computer Lab' && h.capacity >= (options.strictCapacityCheck ? course.expectedEnrollment : 100))
      .sort((a, b) => a.capacity - b.capacity); // Tightest fit first to conserve large halls

    // Fallback halls if no strict match
    const fallbackTheoryHalls = activeHalls
      .filter(h => h.venueType !== 'Computer Lab')
      .sort((a, b) => b.capacity - a.capacity);

    const hallsToTry = candidateTheoryHalls.length > 0 ? candidateTheoryHalls : fallbackTheoryHalls;

    for (const hall of hallsToTry) {
      if (theoryScheduled) break;

      for (const slot of theorySlots) {
        const roomKey = `${slot.slotId}_${hall.hallId}`;
        const lecturerKey = `${slot.slotId}_${lecturer.lecturerId}`;
        const cohortKey = `${slot.slotId}_Level${course.level}_${course.semester}`;

        const isRoomBusy = roomOccupancy.has(roomKey);
        const isLecturerBusy = lecturerOccupancy.has(lecturerKey);
        const isCohortBusy = cohortOccupancy.has(cohortKey);

        if (!isRoomBusy && !isLecturerBusy && !isCohortBusy) {
          // Valid placement
          const hasCapacityIssue = hall.capacity < course.expectedEnrollment;
          
          roomOccupancy.add(roomKey);
          lecturerOccupancy.add(lecturerKey);
          cohortOccupancy.add(cohortKey);

          const yearTag = (options.academicYear || '2026/2027').replace('/', '-');
          const semAbbr = course.semester.toLowerCase().includes('1') ? 'sem1' : 'sem2';
          const periodId = `${yearTag}-${semAbbr}`;

          allocatedSchedules.push({
            id: `SCH-${yearTag}-${semAbbr.toUpperCase()}-${course.courseCode}-TH-${slot.slotId}`,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            level: course.level,
            semester: course.semester,
            academicYear: options.academicYear || '2026/2027',
            periodId,
            status: options.status || 'draft',
            hallId: hall.hallId,
            hallName: hall.hallName,
            slotId: slot.slotId,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            durationHours: 2,
            sessionType: 'Theory',
            lecturerId: lecturer.lecturerId,
            lecturerName: lecturer.fullName,
            lecturerEmail: lecturer.officeEmail || lecturer.email,
            expectedEnrollment: course.expectedEnrollment,
            hallCapacity: hall.capacity,
            hasConflict: hasCapacityIssue,
            conflictType: hasCapacityIssue ? 'CAPACITY_OVERFLOW' : 'NONE',
            conflictReason: hasCapacityIssue ? `Enrollment (${course.expectedEnrollment}) exceeds ${hall.hallName} capacity (${hall.capacity})` : undefined
          });

          theoryScheduled = true;
          theoryDay = slot.day;
          break;
        }
      }
    }

    // --- STEP 2: SCHEDULE PRACTICAL / LAB SESSION (1 Hour) ---
    if (course.practicalHours > 0) {
      // Find candidate computer labs
      const candidateLabs = activeHalls
        .filter(h => h.venueType === 'Computer Lab' || h.hasComputers)
        .sort((a, b) => b.capacity - a.capacity);

      const labsToTry = candidateLabs.length > 0 ? candidateLabs : activeHalls.slice(0, 4);

      for (const lab of labsToTry) {
        if (practicalScheduled) break;

        for (const slot of labSlots) {
          // Constraint: Place practical on different day if option enabled
          if (options.separateTheoryAndPracticalDays && theoryDay && slot.day === theoryDay) {
            continue;
          }

          const roomKey = `${slot.slotId}_${lab.hallId}`;
          const lecturerKey = `${slot.slotId}_${lecturer.lecturerId}`;
          const cohortKey = `${slot.slotId}_Level${course.level}_${course.semester}`;

          const isRoomBusy = roomOccupancy.has(roomKey);
          const isLecturerBusy = lecturerOccupancy.has(lecturerKey);
          const isCohortBusy = cohortOccupancy.has(cohortKey);

          if (!isRoomBusy && !isLecturerBusy && !isCohortBusy) {
            roomOccupancy.add(roomKey);
            lecturerOccupancy.add(lecturerKey);
            cohortOccupancy.add(cohortKey);

            const yearTag = (options.academicYear || '2026/2027').replace('/', '-');
            const semAbbr = course.semester.toLowerCase().includes('1') ? 'sem1' : 'sem2';
            const periodId = `${yearTag}-${semAbbr}`;

            allocatedSchedules.push({
              id: `SCH-${yearTag}-${semAbbr.toUpperCase()}-${course.courseCode}-LAB-${slot.slotId}`,
              courseCode: course.courseCode,
              courseTitle: course.courseTitle,
              level: course.level,
              semester: course.semester,
              academicYear: options.academicYear || '2026/2027',
              periodId,
              status: options.status || 'draft',
              hallId: lab.hallId,
              hallName: lab.hallName,
              slotId: slot.slotId,
              day: slot.day,
              startTime: slot.startTime,
              endTime: slot.endTime,
              durationHours: 1,
              sessionType: 'Lab / Practical',
              lecturerId: lecturer.lecturerId,
              lecturerName: lecturer.fullName,
              lecturerEmail: lecturer.officeEmail || lecturer.email,
              expectedEnrollment: course.expectedEnrollment,
              hallCapacity: lab.capacity,
              hasConflict: false,
              conflictType: 'NONE'
            });

            practicalScheduled = true;
            break;
          }
        }
      }
    }

    if (!theoryScheduled || !practicalScheduled) {
      conflictsList.push({
        courseCode: course.courseCode,
        reason: !theoryScheduled ? 'No available theory hall slot without clash' : 'No available computer lab slot without clash',
        type: 'UNSATISFIED_SLOT'
      });
    }
  }

  const successfullyScheduledCourses = new Set(allocatedSchedules.map(s => s.courseCode)).size;
  const conflictEntries = allocatedSchedules.filter(s => s.hasConflict);

  return {
    schedules: allocatedSchedules,
    totalCoursesTargeted: targetCourses.length,
    successfullyScheduledCount: successfullyScheduledCourses,
    conflictCount: conflictEntries.length + conflictsList.length,
    unsatisfiedCount: targetCourses.length - successfullyScheduledCourses,
    conflicts: conflictsList
  };
}

/**
 * Recalculate and validate all conflicts in existing schedule entries
 */
export function validateScheduleEntries(
  entries: TimetableEntry[],
  facilities: LectureFacility[],
  lecturers: Lecturer[]
): TimetableEntry[] {
  const roomMap = new Map<string, string[]>(); // slotId_hallId -> entryIds
  const lecturerMap = new Map<string, string[]>(); // slotId_lecturerId -> entryIds
  const cohortMap = new Map<string, string[]>(); // slotId_level_semester -> entryIds

  // Build occupancy maps
  entries.forEach(entry => {
    const rKey = `${entry.slotId}_${entry.hallId}`;
    const lKey = `${entry.slotId}_${entry.lecturerId}`;
    const cKey = `${entry.slotId}_${entry.level}_${entry.semester}`;

    if (!roomMap.has(rKey)) roomMap.set(rKey, []);
    roomMap.get(rKey)!.push(entry.id);

    if (!lecturerMap.has(lKey)) lecturerMap.set(lKey, []);
    lecturerMap.get(lKey)!.push(entry.id);

    if (!cohortMap.has(cKey)) cohortMap.set(cKey, []);
    cohortMap.get(cKey)!.push(entry.id);
  });

  return entries.map(entry => {
    const facility = facilities.find(f => f.hallId === entry.hallId);
    const capacity = facility ? facility.capacity : entry.hallCapacity;
    const rKey = `${entry.slotId}_${entry.hallId}`;
    const lKey = `${entry.slotId}_${entry.lecturerId}`;
    const cKey = `${entry.slotId}_${entry.level}_${entry.semester}`;

    const roomClash = (roomMap.get(rKey)?.length || 0) > 1;
    const lecturerClash = (lecturerMap.get(lKey)?.length || 0) > 1;
    const cohortClash = (cohortMap.get(cKey)?.length || 0) > 1;
    const capacityOverflow = entry.sessionType === 'Theory' && entry.expectedEnrollment > capacity;

    let hasConflict = false;
    let conflictType: TimetableEntry['conflictType'] = 'NONE';
    let conflictReason: string | undefined = undefined;

    if (roomClash) {
      hasConflict = true;
      conflictType = 'ROOM_DOUBLE_BOOKING';
      conflictReason = `Double-booking: Multiple classes assigned to ${entry.hallName} at this time`;
    } else if (lecturerClash) {
      hasConflict = true;
      conflictType = 'LECTURER_CLASH';
      conflictReason = `Lecturer clash: ${entry.lecturerName} scheduled for multiple classes simultaneously`;
    } else if (cohortClash) {
      hasConflict = true;
      conflictType = 'LEVEL_CLASH';
      conflictReason = `Cohort clash: Level ${entry.level} ${entry.semester} students have simultaneous core classes`;
    } else if (capacityOverflow) {
      hasConflict = true;
      conflictType = 'CAPACITY_OVERFLOW';
      conflictReason = `Capacity overflow: ${entry.expectedEnrollment} students in ${capacity}-seat hall`;
    }

    return {
      ...entry,
      hallCapacity: capacity,
      hasConflict,
      conflictType,
      conflictReason
    };
  });
}

/**
 * Generate Comprehensive Dashboard Analytics and KPIs
 */
export function calculateDashboardAnalytics(
  courses: Course[],
  facilities: LectureFacility[],
  lecturers: Lecturer[],
  timeSlots: TimeSlot[],
  schedules: TimetableEntry[]
) {
  const totalCourses = courses.length;
  const totalFacilities = facilities.length;
  const totalSeatCapacity = facilities.reduce((sum, f) => sum + f.capacity, 0);
  const totalTimeSlots = timeSlots.length;
  const totalLecturers = lecturers.length;

  const scheduledCourseCodes = new Set(schedules.map(s => s.courseCode));
  const successfullyScheduled = scheduledCourseCodes.size;
  const schedulingConflicts = schedules.filter(s => s.hasConflict).length;
  const unsatisfiedOrPending = Math.max(0, totalCourses - successfullyScheduled);

  // 1. Courses by Academic Level
  const levelCounts: Record<number, number> = { 100: 0, 200: 0, 300: 0, 400: 0 };
  courses.forEach(c => {
    if (levelCounts[c.level] !== undefined) {
      levelCounts[c.level]++;
    }
  });
  const coursesByLevel = [
    { level: 'Level 100', count: levelCounts[100], color: '#3B82F6' },
    { level: 'Level 200', count: levelCounts[200], color: '#10B981' },
    { level: 'Level 300', count: levelCounts[300], color: '#8B5CF6' },
    { level: 'Level 400', count: levelCounts[400], color: '#F59E0B' }
  ];

  // 2. Courses by Semester
  const sem1Count = courses.filter(c => c.semester === 'Semester 1').length;
  const sem2Count = courses.filter(c => c.semester === 'Semester 2').length;
  const coursesBySemester = [
    { name: 'Semester 1', value: sem1Count, color: '#2563EB' },
    { name: 'Semester 2', value: sem2Count, color: '#0D9488' }
  ];

  // 3. Facility Capacity Comparison (Sorted)
  const facilityCapacityComparison = [...facilities]
    .sort((a, b) => b.capacity - a.capacity)
    .map(f => ({
      name: f.hallName.length > 18 ? f.hallName.substring(0, 18) + '...' : f.hallName,
      fullName: f.hallName,
      capacity: f.capacity,
      type: f.venueType,
      id: f.hallId
    }));

  // 4. Facility Type Distribution
  const typeCounts: Record<string, number> = {};
  facilities.forEach(f => {
    typeCounts[f.venueType] = (typeCounts[f.venueType] || 0) + 1;
  });
  const facilityTypeDistribution = Object.keys(typeCounts).map((type, idx) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
    return {
      name: type,
      value: typeCounts[type],
      color: colors[idx % colors.length]
    };
  });

  // 5. Time Slot Distribution across Monday to Friday
  const daySlotCounts: Record<string, { total: number; theory: number; lab: number; scheduled: number }> = {
    Monday: { total: 5, theory: 4, lab: 1, scheduled: 0 },
    Tuesday: { total: 5, theory: 4, lab: 1, scheduled: 0 },
    Wednesday: { total: 5, theory: 4, lab: 1, scheduled: 0 },
    Thursday: { total: 5, theory: 4, lab: 1, scheduled: 0 },
    Friday: { total: 5, theory: 4, lab: 1, scheduled: 0 }
  };

  schedules.forEach(s => {
    if (daySlotCounts[s.day]) {
      daySlotCounts[s.day].scheduled++;
    }
  });

  const timeSlotDistribution = Object.keys(daySlotCounts).map(day => ({
    day,
    totalSlots: daySlotCounts[day].total,
    theorySlots: daySlotCounts[day].theory,
    labSlots: daySlotCounts[day].lab,
    scheduledSessions: daySlotCounts[day].scheduled
  }));

  // 6. Course Scheduling Status
  const courseSchedulingStatus = [
    { name: 'Successfully Scheduled', value: successfullyScheduled, color: '#10B981' },
    { name: 'Conflicts / Warnings', value: schedulingConflicts, color: '#EF4444' },
    { name: 'Unsatisfied / Pending', value: unsatisfiedOrPending, color: '#F59E0B' }
  ];

  // 7. Hall Utilization Rates (calculated as scheduled slots / available slots)
  const hallUtilization = facilities.map(f => {
    const sessionsInHall = schedules.filter(s => s.hallId === f.hallId).length;
    // Maximum possible weekly slots per hall is 25 slots
    const utilizationRate = Math.min(100, Math.round((sessionsInHall / 25) * 100));
    return {
      hallId: f.hallId,
      name: f.hallName.length > 16 ? f.hallName.substring(0, 16) + '...' : f.hallName,
      fullName: f.hallName,
      capacity: f.capacity,
      sessionsCount: sessionsInHall,
      utilizationRate,
      status: f.status
    };
  }).sort((a, b) => b.sessionsCount - a.sessionsCount);

  // 8. Conflict Summary Breakdown
  const conflictBreakdown = {
    total: schedulingConflicts,
    capacityOverflow: schedules.filter(s => s.conflictType === 'CAPACITY_OVERFLOW').length,
    roomDoubleBooking: schedules.filter(s => s.conflictType === 'ROOM_DOUBLE_BOOKING').length,
    lecturerClash: schedules.filter(s => s.conflictType === 'LECTURER_CLASH').length,
    levelClash: schedules.filter(s => s.conflictType === 'LEVEL_CLASH').length
  };

  return {
    kpi: {
      totalCourses,
      totalFacilities,
      totalSeatCapacity,
      totalTimeSlots,
      totalLecturers,
      successfullyScheduled,
      schedulingConflicts,
      unsatisfiedOrPending,
      schedulingPercentage: totalCourses > 0 ? Math.round((successfullyScheduled / totalCourses) * 100) : 0,
      hallAverageUtilization: Math.round(
        hallUtilization.reduce((acc, h) => acc + h.utilizationRate, 0) / (facilities.length || 1)
      )
    },
    charts: {
      coursesByLevel,
      coursesBySemester,
      facilityCapacityComparison,
      facilityTypeDistribution,
      timeSlotDistribution,
      courseSchedulingStatus,
      hallUtilization,
      conflictBreakdown
    }
  };
}
