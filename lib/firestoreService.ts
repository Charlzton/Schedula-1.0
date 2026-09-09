import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Course, 
  LectureFacility, 
  Lecturer, 
  TimeSlot, 
  TimetableEntry, 
  SystemActivity,
  AcademicPeriod,
  INITIAL_COURSES,
  INITIAL_FACILITIES,
  INITIAL_LECTURERS,
  INITIAL_TIME_SLOTS,
  INITIAL_SYSTEM_ACTIVITIES,
  INITIAL_BOOKING_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACADEMIC_PERIODS
} from './dataset';
import { RoomBookingRequest, NotificationItem } from './lecturerTypes';
import { handleFirestoreError, OperationType } from './firestoreErrors';

/**
 * Remove undefined values from an object to prevent Firestore errors
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): T {
  const clean: any = {};
  for (const key of Object.keys(data)) {
    if (data[key] !== undefined) {
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        clean[key] = cleanFirestoreData(data[key]);
      } else {
        clean[key] = data[key];
      }
    }
  }
  return clean as T;
}

/**
 * Sanitize document IDs to ensure they are safe for Firestore document paths
 */
export function sanitizeDocId(id: string): string {
  return encodeURIComponent(String(id).trim().replace(/\//g, '_'));
}

// ---------------- COURSE OPERATIONS ---------------- //

export async function saveCourseToFirestore(course: Course): Promise<void> {
  const docId = sanitizeDocId(course.courseCode);
  try {
    await setDoc(doc(db, 'courses', docId), cleanFirestoreData(course), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save course ${course.courseCode}:`, error);
  }
}

export async function deleteCourseFromFirestore(courseCode: string): Promise<void> {
  const docId = sanitizeDocId(courseCode);
  try {
    await deleteDoc(doc(db, 'courses', docId));
  } catch (error) {
    console.warn(`[Firestore] Failed to delete course ${courseCode}:`, error);
  }
}

export async function bulkSaveCoursesToFirestore(coursesList: Course[]): Promise<void> {
  if (!coursesList.length) return;
  try {
    const batch = writeBatch(db);
    for (const course of coursesList) {
      const docRef = doc(db, 'courses', sanitizeDocId(course.courseCode));
      batch.set(docRef, cleanFirestoreData(course), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk courses save:', error);
  }
}

export async function bulkDeleteCoursesFromFirestore(courseCodes: string[]): Promise<void> {
  if (!courseCodes.length) return;
  try {
    const batch = writeBatch(db);
    for (const code of courseCodes) {
      const docRef = doc(db, 'courses', sanitizeDocId(code));
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk courses delete:', error);
  }
}

// ---------------- FACILITY OPERATIONS ---------------- //

export async function saveFacilityToFirestore(facility: LectureFacility): Promise<void> {
  const docId = sanitizeDocId(facility.hallId);
  try {
    await setDoc(doc(db, 'facilities', docId), cleanFirestoreData(facility), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save facility ${facility.hallId}:`, error);
  }
}

export async function deleteFacilityFromFirestore(hallId: string): Promise<void> {
  const docId = sanitizeDocId(hallId);
  try {
    await deleteDoc(doc(db, 'facilities', docId));
  } catch (error) {
    console.warn(`[Firestore] Failed to delete facility ${hallId}:`, error);
  }
}

export async function bulkSaveFacilitiesToFirestore(facilitiesList: LectureFacility[]): Promise<void> {
  if (!facilitiesList.length) return;
  try {
    const batch = writeBatch(db);
    for (const fac of facilitiesList) {
      const docRef = doc(db, 'facilities', sanitizeDocId(fac.hallId));
      batch.set(docRef, cleanFirestoreData(fac), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk facilities save:', error);
  }
}

export async function bulkDeleteFacilitiesFromFirestore(hallIds: string[]): Promise<void> {
  if (!hallIds.length) return;
  try {
    const batch = writeBatch(db);
    for (const id of hallIds) {
      const docRef = doc(db, 'facilities', sanitizeDocId(id));
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk facilities delete:', error);
  }
}

// ---------------- LECTURER OPERATIONS ---------------- //

export async function saveLecturerToFirestore(lecturer: Lecturer): Promise<void> {
  const docId = sanitizeDocId(lecturer.lecturerId);
  try {
    await setDoc(doc(db, 'lecturers', docId), cleanFirestoreData(lecturer), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save lecturer ${lecturer.lecturerId}:`, error);
  }
}

export async function deleteLecturerFromFirestore(lecturerId: string): Promise<void> {
  const docId = sanitizeDocId(lecturerId);
  try {
    await deleteDoc(doc(db, 'lecturers', docId));
  } catch (error) {
    console.warn(`[Firestore] Failed to delete lecturer ${lecturerId}:`, error);
  }
}

export async function bulkSaveLecturersToFirestore(lecturersList: Lecturer[]): Promise<void> {
  if (!lecturersList.length) return;
  try {
    const batch = writeBatch(db);
    for (const lec of lecturersList) {
      const docRef = doc(db, 'lecturers', sanitizeDocId(lec.lecturerId));
      batch.set(docRef, cleanFirestoreData(lec), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk lecturers save:', error);
  }
}

export async function bulkDeleteLecturersFromFirestore(lecturerIds: string[]): Promise<void> {
  if (!lecturerIds.length) return;
  try {
    const batch = writeBatch(db);
    for (const id of lecturerIds) {
      const docRef = doc(db, 'lecturers', sanitizeDocId(id));
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk lecturers delete:', error);
  }
}

// ---------------- TIMESLOT OPERATIONS ---------------- //

export async function saveTimeSlotToFirestore(slot: TimeSlot): Promise<void> {
  const docId = sanitizeDocId(slot.slotId);
  try {
    await setDoc(doc(db, 'timeslots', docId), cleanFirestoreData(slot), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save timeslot ${slot.slotId}:`, error);
  }
}

export async function deleteTimeSlotFromFirestore(slotId: string): Promise<void> {
  const docId = sanitizeDocId(slotId);
  try {
    await deleteDoc(doc(db, 'timeslots', docId));
  } catch (error) {
    console.warn(`[Firestore] Failed to delete timeslot ${slotId}:`, error);
  }
}

export async function bulkSaveTimeSlotsToFirestore(slotsList: TimeSlot[]): Promise<void> {
  if (!slotsList.length) return;
  try {
    const batch = writeBatch(db);
    for (const slot of slotsList) {
      const docRef = doc(db, 'timeslots', sanitizeDocId(slot.slotId));
      batch.set(docRef, cleanFirestoreData(slot), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk timeslots save:', error);
  }
}

export async function bulkDeleteTimeSlotsFromFirestore(slotIds: string[]): Promise<void> {
  if (!slotIds.length) return;
  try {
    const batch = writeBatch(db);
    for (const id of slotIds) {
      const docRef = doc(db, 'timeslots', sanitizeDocId(id));
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk timeslots delete:', error);
  }
}

// ---------------- TIMETABLE SCHEDULE OPERATIONS ---------------- //

export async function saveScheduleEntryToFirestore(entry: TimetableEntry): Promise<void> {
  const docId = sanitizeDocId(entry.id);
  try {
    await setDoc(doc(db, 'timetables', docId), cleanFirestoreData(entry), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save timetable entry ${entry.id}:`, error);
  }
}

export async function deleteScheduleEntryFromFirestore(scheduleId: string): Promise<void> {
  const docId = sanitizeDocId(scheduleId);
  try {
    await deleteDoc(doc(db, 'timetables', docId));
  } catch (error) {
    console.warn(`[Firestore] Failed to delete timetable entry ${scheduleId}:`, error);
  }
}

export async function bulkDeleteSchedulesFromFirestore(scheduleIds: string[]): Promise<void> {
  if (!scheduleIds.length) return;
  try {
    // Firestore batches are limited to 500 operations per batch
    const chunks = [];
    for (let i = 0; i < scheduleIds.length; i += 400) {
      chunks.push(scheduleIds.slice(i, i + 400));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'timetables', sanitizeDocId(id)));
      }
      await batch.commit();
    }
  } catch (error) {
    console.warn('[Firestore] Failed bulk schedule delete:', error);
  }
}

/**
 * Saves timetable schedules scoped to a specific Academic Year and Semester.
 * Crucially preserves historical data from other semesters and academic years.
 */
export async function savePeriodSchedulesToFirestore(
  academicYear: string,
  semester: string,
  schedulesList: TimetableEntry[]
): Promise<void> {
  try {
    const existingSnap = await getDocs(collection(db, 'timetables'));
    // Find IDs belonging ONLY to this specific academicYear and semester
    const periodOldIds: string[] = [];
    existingSnap.docs.forEach((d) => {
      const data = d.data() as TimetableEntry;
      const dataYear = data.academicYear || '2026/2027';
      const dataSem = data.semester || 'Semester 1';
      if (dataYear === academicYear && dataSem === semester) {
        periodOldIds.push(d.id);
      }
    });

    const newIdSet = new Set(schedulesList.map((s) => sanitizeDocId(s.id)));
    const toDeleteIds = periodOldIds.filter((id) => !newIdSet.has(id));
    if (toDeleteIds.length > 0) {
      await bulkDeleteSchedulesFromFirestore(toDeleteIds);
    }

    // Batch write new entries in chunks of 400
    const chunks = [];
    for (let i = 0; i < schedulesList.length; i += 400) {
      chunks.push(schedulesList.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const entry of chunk) {
        const docRef = doc(db, 'timetables', sanitizeDocId(entry.id));
        batch.set(docRef, cleanFirestoreData({
          ...entry,
          academicYear,
          semester
        }), { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.warn(`[Firestore] Failed to save period schedules (${academicYear} ${semester}):`, error);
  }
}

export async function publishPeriodTimetableInFirestore(
  academicYear: string,
  semester: string,
  publisherName: string
): Promise<void> {
  try {
    const existingSnap = await getDocs(collection(db, 'timetables'));
    const matchingDocs = existingSnap.docs.filter((d) => {
      const data = d.data() as TimetableEntry;
      const dataYear = data.academicYear || '2026/2027';
      const dataSem = data.semester || 'Semester 1';
      return dataYear === academicYear && dataSem === semester;
    });

    const now = new Date().toISOString();
    const chunks = [];
    for (let i = 0; i < matchingDocs.length; i += 400) {
      chunks.push(matchingDocs.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.update(d.ref, {
          status: 'published',
          publishedAt: now,
          publishedBy: publisherName
        });
      }
      await batch.commit();
    }

    // Also update the academic period record
    const periodId = `${academicYear.replace('/', '-')}-${semester.toLowerCase().replace(' ', '')}`;
    const periodDocRef = doc(db, 'academic_periods', periodId);
    await setDoc(periodDocRef, {
      id: periodId,
      academicYear,
      semester,
      isPublished: true,
      publishedAt: now,
      publishedBy: publisherName
    }, { merge: true });

  } catch (error) {
    console.warn(`[Firestore] Failed to publish period timetable (${academicYear} ${semester}):`, error);
  }
}

export async function unpublishPeriodTimetableInFirestore(
  academicYear: string,
  semester: string
): Promise<void> {
  try {
    const existingSnap = await getDocs(collection(db, 'timetables'));
    const matchingDocs = existingSnap.docs.filter((d) => {
      const data = d.data() as TimetableEntry;
      const dataYear = data.academicYear || '2026/2027';
      const dataSem = data.semester || 'Semester 1';
      return dataYear === academicYear && dataSem === semester;
    });

    const chunks = [];
    for (let i = 0; i < matchingDocs.length; i += 400) {
      chunks.push(matchingDocs.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.update(d.ref, {
          status: 'generated'
        });
      }
      await batch.commit();
    }

    const periodId = `${academicYear.replace('/', '-')}-${semester.toLowerCase().replace(' ', '')}`;
    const periodDocRef = doc(db, 'academic_periods', periodId);
    await setDoc(periodDocRef, {
      id: periodId,
      academicYear,
      semester,
      isPublished: false
    }, { merge: true });

  } catch (error) {
    console.warn(`[Firestore] Failed to unpublish period timetable (${academicYear} ${semester}):`, error);
  }
}

// ---------------- ACADEMIC PERIOD OPERATIONS ---------------- //

export async function saveAcademicPeriodToFirestore(period: AcademicPeriod): Promise<void> {
  const docId = sanitizeDocId(period.id);
  try {
    await setDoc(doc(db, 'academic_periods', docId), cleanFirestoreData(period), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save academic period ${period.id}:`, error);
  }
}

export async function bulkSaveAcademicPeriodsToFirestore(periods: AcademicPeriod[]): Promise<void> {
  if (!periods.length) return;
  try {
    const batch = writeBatch(db);
    for (const p of periods) {
      const docRef = doc(db, 'academic_periods', sanitizeDocId(p.id));
      batch.set(docRef, cleanFirestoreData(p), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed bulk academic periods save:', error);
  }
}

export async function saveAllSchedulesToFirestore(schedulesList: TimetableEntry[]): Promise<void> {
  try {
    // If schedules have academicYear and semester, save scoped; otherwise default chunk save
    const chunks = [];
    for (let i = 0; i < schedulesList.length; i += 400) {
      chunks.push(schedulesList.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const entry of chunk) {
        const docRef = doc(db, 'timetables', sanitizeDocId(entry.id));
        batch.set(docRef, cleanFirestoreData(entry), { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.warn('[Firestore] Failed to save all schedules:', error);
  }
}

export async function clearAllSchedulesFromFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'timetables'));
    const ids = snap.docs.map((d) => d.id);
    if (ids.length > 0) {
      await bulkDeleteSchedulesFromFirestore(ids);
    }
  } catch (error) {
    console.warn('[Firestore] Failed to clear schedules:', error);
  }
}

// ---------------- ACTIVITY LOG OPERATIONS ---------------- //

export async function saveActivityToFirestore(activity: SystemActivity): Promise<void> {
  const docId = sanitizeDocId(activity.id);
  try {
    await setDoc(doc(db, 'activities', docId), cleanFirestoreData(activity), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to save activity ${activity.id}:`, error);
  }
}

// ---------------- BOOKING REQUEST OPERATIONS ---------------- //

export async function saveBookingRequestToFirestore(booking: RoomBookingRequest): Promise<void> {
  const docId = sanitizeDocId(booking.id);
  try {
    await setDoc(doc(db, 'bookings', docId), cleanFirestoreData(booking), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Note: Failed to sync booking request ${booking.id} to remote server:`, error);
  }
}

export async function updateBookingStatusInFirestore(
  bookingId: string, 
  status: 'Approved' | 'Rejected' | 'Pending' | 'Withdrawn',
  details?: { reviewedBy?: string; reviewedAt?: string; adminFeedback?: string }
): Promise<void> {
  const docId = sanitizeDocId(bookingId);
  try {
    const updateData: any = {
      status,
      reviewedAt: details?.reviewedAt || new Date().toISOString(),
      ...(details?.reviewedBy && { reviewedBy: details.reviewedBy }),
      ...(details?.adminFeedback !== undefined && { adminFeedback: details.adminFeedback })
    };
    await setDoc(doc(db, 'bookings', docId), cleanFirestoreData(updateData), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Note: Failed to sync booking status ${bookingId} to remote server:`, error);
  }
}

export async function deleteBookingRequestFromFirestore(bookingId: string): Promise<void> {
  const docId = sanitizeDocId(bookingId);
  try {
    await deleteDoc(doc(db, 'bookings', docId));
  } catch (error) {
    console.warn(`[Firestore] Note: Failed to delete booking ${bookingId} from remote server:`, error);
  }
}

// ---------------- NOTIFICATION OPERATIONS ---------------- //

export async function createNotificationInFirestore(notification: NotificationItem): Promise<void> {
  const docId = sanitizeDocId(notification.id);
  try {
    await setDoc(doc(db, 'notifications', docId), cleanFirestoreData(notification), { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to create notification ${notification.id}:`, error);
  }
}

export async function markNotificationAsReadInFirestore(notificationId: string): Promise<void> {
  const docId = sanitizeDocId(notificationId);
  try {
    await setDoc(doc(db, 'notifications', docId), { isRead: true }, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to mark notification as read ${notificationId}:`, error);
  }
}

export async function markAllNotificationsAsReadInFirestore(notificationIds: string[]): Promise<void> {
  if (!notificationIds.length) return;
  try {
    const batch = writeBatch(db);
    for (const id of notificationIds) {
      const docRef = doc(db, 'notifications', sanitizeDocId(id));
      batch.set(docRef, { isRead: true }, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Failed to mark all notifications as read:', error);
  }
}

export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  const docId = sanitizeDocId(notificationId);
  try {
    await deleteDoc(doc(db, 'notifications', docId));
  } catch (error) {
    console.warn(`[Firestore] Failed to delete notification ${notificationId}:`, error);
  }
}

// ---------------- AUTO-SEEDING ROUTINE ---------------- //

/**
 * Checks each Firestore collection. If empty, populates with initial University of Ghana dataset.
 * Does NOT overwrite existing records if collection is already populated.
 */
export async function ensureFirestoreInitialized(): Promise<{
  seededCourses: boolean;
  seededFacilities: boolean;
  seededLecturers: boolean;
  seededTimeSlots: boolean;
}> {
  const result = {
    seededCourses: false,
    seededFacilities: false,
    seededLecturers: false,
    seededTimeSlots: false,
  };

  try {
    // 1. Check Courses
    const coursesSnap = await getDocs(collection(db, 'courses'));
    if (coursesSnap.empty) {
      console.log('[Firestore] Seeding initial courses dataset...');
      await bulkSaveCoursesToFirestore(INITIAL_COURSES);
      result.seededCourses = true;
    }

    // 2. Check Facilities
    const facilitiesSnap = await getDocs(collection(db, 'facilities'));
    if (facilitiesSnap.empty) {
      console.log('[Firestore] Seeding initial facilities dataset...');
      await bulkSaveFacilitiesToFirestore(INITIAL_FACILITIES);
      result.seededFacilities = true;
    }

    // 3. Check Lecturers
    const lecturersSnap = await getDocs(collection(db, 'lecturers'));
    if (lecturersSnap.empty) {
      console.log('[Firestore] Seeding initial lecturers dataset...');
      await bulkSaveLecturersToFirestore(INITIAL_LECTURERS);
      result.seededLecturers = true;
    }

    // 4. Check TimeSlots
    const timeSlotsSnap = await getDocs(collection(db, 'timeslots'));
    if (timeSlotsSnap.empty) {
      console.log('[Firestore] Seeding initial time slots dataset...');
      await bulkSaveTimeSlotsToFirestore(INITIAL_TIME_SLOTS);
      result.seededTimeSlots = true;
    }

    // 5. Check Activities
    const activitiesSnap = await getDocs(collection(db, 'activities'));
    if (activitiesSnap.empty && INITIAL_SYSTEM_ACTIVITIES.length > 0) {
      console.log('[Firestore] Seeding initial system activity...');
      await saveActivityToFirestore(INITIAL_SYSTEM_ACTIVITIES[0]);
    }

    // 6. Check Bookings
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    if (bookingsSnap.empty && INITIAL_BOOKING_REQUESTS.length > 0) {
      console.log('[Firestore] Seeding initial room booking requests...');
      for (const req of INITIAL_BOOKING_REQUESTS) {
        await saveBookingRequestToFirestore(req as RoomBookingRequest);
      }
    }

    // 7. Check Notifications
    const notifsSnap = await getDocs(collection(db, 'notifications'));
    if (notifsSnap.empty && INITIAL_NOTIFICATIONS.length > 0) {
      console.log('[Firestore] Seeding initial notifications...');
      for (const notif of INITIAL_NOTIFICATIONS) {
        await createNotificationInFirestore(notif as NotificationItem);
      }
    }

    // 8. Check Academic Periods
    const periodsSnap = await getDocs(collection(db, 'academic_periods'));
    if (periodsSnap.empty && INITIAL_ACADEMIC_PERIODS.length > 0) {
      console.log('[Firestore] Seeding initial academic periods...');
      await bulkSaveAcademicPeriodsToFirestore(INITIAL_ACADEMIC_PERIODS);
    }
  } catch (error) {
    console.warn('[Firestore] Note during initial collections seed check:', error);
  }

  return result;
}
