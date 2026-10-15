import { Lecturer, Course, TimetableEntry, AcademicPeriod, isCourseAllocatedToLecturer } from './dataset';

/**
 * Common professional and courtesy title prefix regex.
 * Matches leading titles followed by whitespace.
 * Case-insensitive and handles abbreviations with or without periods.
 */
const LEADING_TITLE_REGEX = /^(?:(?:Rev(?:erend)?\.?\s*(?:Dr\.?|Prof(?:essor)?\.?)?)|(?:(?:Associate|Assoc\.?)\s+Prof(?:essor)?\.?)|(?:(?:Assistant|Asst\.?)\s+Prof(?:essor)?\.?)|(?:Prof(?:essor)?\.?)|(?:Dr\.?|Doctor)|(?:Mr\.?)|(?:Mrs\.?)|(?:Ms\.?)|(?:Miss)|(?:Engr\.?|Engineer)|(?:Hon(?:orable)?\.?))\s+/i;

/**
 * Strips leading recognized title prefixes from a lecturer's name.
 * 
 * Rules:
 * 1. Trims leading and trailing whitespace.
 * 2. Normalizes multiple spaces into a single space.
 * 3. Removes recognized title only when it appears at the START of the name.
 * 4. Safely iterates to collapse chained/duplicated titles (e.g., "Dr. Dr. Vincent Mensah" -> "Vincent Mensah").
 * 5. Ordinary name components elsewhere in the string are completely preserved.
 * 6. Idempotent: safe when run repeatedly.
 * 
 * Examples:
 * - "Dr. Vincent Mensah" -> "Vincent Mensah"
 * - "Professor Joshua Asare" -> "Joshua Asare"
 * - "Mr. Daniel Owusu" -> "Daniel Owusu"
 * - "Mrs. Mary Johnson" -> "Mary Johnson"
 * - "Linda Boateng" -> "Linda Boateng"
 * - "Dr. Dr. Vincent Mensah" -> "Vincent Mensah"
 * - "Doctor Dr. Vincent Mensah" -> "Vincent Mensah"
 * - "Prof. Ferdinand A. Katsriku" -> "Ferdinand A. Katsriku"
 */
export function stripLeadingTitle(rawName: string | null | undefined): string {
  if (!rawName) return '';
  const trimmed = String(rawName).trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  let name = trimmed;
  let previous = '';

  // Loop to handle duplicate or chained titles (e.g., "Dr. Dr.", "Doctor Dr.", "Prof. Dr.")
  while (name !== previous && name.length > 0) {
    previous = name;
    name = name.replace(LEADING_TITLE_REGEX, '').trim();
  }

  // If stripping would leave an empty string, fallback to trimmed input
  return name || trimmed;
}

/**
 * Extracts and cleans a lecturer's professional title.
 * Does NOT generate or invent a title if one is not provided.
 * Normalizes repeated title values (e.g. "Dr. Dr." -> "Dr.").
 */
export function cleanLecturerTitle(rawTitle: string | null | undefined): string {
  if (!rawTitle) return '';
  const trimmed = String(rawTitle).trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  // Remove duplicate repeated titles in the title field itself (e.g., "Dr. Dr." -> "Dr.")
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase().replace(/\./g, '') === parts[1].toLowerCase().replace(/\./g, '')) {
    return parts[0];
  }
  return trimmed;
}

/**
 * Authoritative Display Name function for lecturers.
 * 
 * The lecturer's actual name is the primary information displayed throughout the application.
 * Professional titles (Dr., Prof., Mr., Mrs., Ms.) are NOT automatically prepended to the name.
 * 
 * Accepts a Lecturer object, a raw string, or null/undefined.
 */
export function getLecturerDisplayName(
  lecturerOrName: Partial<Lecturer> | string | null | undefined
): string {
  if (!lecturerOrName) return 'Faculty Member';

  if (typeof lecturerOrName === 'string') {
    const cleaned = stripLeadingTitle(lecturerOrName);
    return cleaned || 'Faculty Member';
  }

  const rawName = lecturerOrName.fullName || (lecturerOrName as any).name || '';
  const cleaned = stripLeadingTitle(rawName);
  return cleaned || 'Faculty Member';
}

/**
 * Normalizes a lecturer record:
 * - Cleans fullName by stripping leading titles so the actual name is stored cleanly.
 * - Cleans title if provided, leaving it blank/optional if not provided (never automatically defaults to Dr.).
 * - Preserves all other lecturer properties verbatim.
 */
export function normalizeLecturerRecord<T extends Partial<Lecturer>>(record: T): T {
  const rawName = record.fullName || (record as any).name || '';
  const cleanName = stripLeadingTitle(rawName);
  const cleanTitle = cleanLecturerTitle(record.title);

  return {
    ...record,
    fullName: cleanName || rawName || 'New Lecturer',
    title: cleanTitle || '',
  };
}

/**
 * Checks if a name contains unambiguous duplicate titles
 * (e.g. "Dr. Dr.", "Doctor Dr.", "Prof. Prof.", "Professor Prof.")
 */
export function hasDuplicateTitleInName(rawName: string | null | undefined): boolean {
  if (!rawName) return false;
  const s = String(rawName).trim();
  return /^(?:Dr\.?|Doctor|Prof\.?|Professor|Mr\.?|Mrs\.?|Ms\.?)\s+(?:Dr\.?|Doctor|Prof\.?|Professor|Mr\.?|Mrs\.?|Ms\.?)\b/i.test(s);
}

/**
 * Safely sanitizes existing lecturer records that may contain unambiguous duplicate titles,
 * preserving all existing IDs, authUids, emails, departments, specializations, etc.
 */
export function sanitizeExistingLecturers(lecturers: Lecturer[]): {
  sanitized: Lecturer[];
  hasChanges: boolean;
  changedCount: number;
} {
  let changedCount = 0;

  const sanitized = lecturers.map(lec => {
    let changed = false;
    let newFullName = lec.fullName;
    let newTitle = lec.title;

    // Check for duplicate title in name
    if (hasDuplicateTitleInName(lec.fullName)) {
      newFullName = stripLeadingTitle(lec.fullName);
      changed = true;
    }

    // Check for duplicate in title field
    const cleanedTitle = cleanLecturerTitle(lec.title);
    if (cleanedTitle !== lec.title) {
      newTitle = cleanedTitle;
      changed = true;
    }

    if (changed) {
      changedCount++;
      return {
        ...lec,
        fullName: newFullName,
        title: newTitle,
      };
    }

    return lec;
  });

  return {
    sanitized,
    hasChanges: changedCount > 0,
    changedCount,
  };
}

/**
 * Authoritatively determines if a published timetable entry is assigned to a lecturer.
 * Adheres strictly to the identity and schedule model hierarchy:
 * 1. Direct stable Lecturer ID match on schedule entry (or Auth UID).
 * 2. Direct stable Email match on schedule entry.
 * 3. Course catalog assigned lecturer check (assignedLecturerId / isCourseAllocatedToLecturer).
 * 4. Canonical profile assignedCourses and specializations check.
 * 5. Strict rejection if schedule specifies an explicit conflicting lecturer ID.
 * 6. Fallback clean name match (only if no conflicting ID is set).
 */
export function isScheduleAllocatedToLecturer(
  schedule: TimetableEntry,
  lecturer: Lecturer | null | undefined,
  courses: Course[] = [],
  userAuthUid?: string | null,
  userEmail?: string | null
): boolean {
  if (!schedule) return false;

  const canonicalLecId = (lecturer?.lecturerId || '').trim().toUpperCase();
  const authUid = (userAuthUid || lecturer?.authUid || '').trim();
  const schedLecId = (schedule.lecturerId || '').trim().toUpperCase();
  const schedCourseCode = (schedule.courseCode || '').replace(/\s+/g, '').toUpperCase();
  const schedEmail = (schedule.lecturerEmail || '').trim().toLowerCase();
  const userEmailClean = (userEmail || lecturer?.officeEmail || lecturer?.email || '').trim().toLowerCase();

  // 1. Direct Stable Lecturer ID match
  if (canonicalLecId && schedLecId && canonicalLecId === schedLecId) {
    return true;
  }
  if (authUid && schedLecId && (authUid.toUpperCase() === schedLecId || authUid === schedule.lecturerId)) {
    return true;
  }

  // 2. Direct Stable Email match on schedule entry
  if (schedEmail && userEmailClean && schedEmail === userEmailClean) {
    return true;
  }
  if (schedEmail && lecturer?.officeEmail && schedEmail === lecturer.officeEmail.trim().toLowerCase()) {
    return true;
  }
  if (schedEmail && lecturer?.email && schedEmail === lecturer.email.trim().toLowerCase()) {
    return true;
  }

  // 3. Course catalog assigned lecturer check
  if (schedCourseCode) {
    const course = courses.find(c => c.courseCode.replace(/\s+/g, '').toUpperCase() === schedCourseCode);
    if (course) {
      if (course.assignedLecturerId) {
        const cLecId = course.assignedLecturerId.trim().toUpperCase();
        if (canonicalLecId && cLecId === canonicalLecId) return true;
        if (authUid && (cLecId === authUid.toUpperCase() || course.assignedLecturerId === authUid)) return true;
      }
      if (isCourseAllocatedToLecturer(course, lecturer, authUid)) {
        return true;
      }
    }
  }

  // 4. Lecturer profile assignedCourses or specializations check
  if (schedCourseCode && lecturer) {
    if (lecturer.assignedCourses) {
      const assigned = Array.isArray(lecturer.assignedCourses)
        ? lecturer.assignedCourses
        : lecturer.assignedCourses.split(',').map(s => s.trim());
      if (assigned.some(c => c.replace(/\s+/g, '').toUpperCase() === schedCourseCode)) {
        return true;
      }
    }
    if (lecturer.specializations && Array.isArray(lecturer.specializations)) {
      if (lecturer.specializations.some(c => c.replace(/\s+/g, '').toUpperCase() === schedCourseCode)) {
        return true;
      }
    }
  }

  // 5. If schedule entry explicitly specifies a DIFFERENT known lecturer ID, do NOT match by display name
  if (schedLecId && canonicalLecId && schedLecId !== canonicalLecId) {
    return false;
  }

  // 6. Fallback Name match (only when no conflicting ID is set)
  if (schedule.lecturerName && lecturer?.fullName) {
    const cleanSchedName = stripLeadingTitle(schedule.lecturerName).toLowerCase();
    const cleanLecName = stripLeadingTitle(lecturer.fullName).toLowerCase();
    if (cleanSchedName && cleanLecName && cleanSchedName === cleanLecName) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a timetable schedule entry is authoritative and published.
 * Draft schedules are never displayed as published.
 */
export function isSchedulePublished(
  schedule: TimetableEntry,
  academicPeriods: AcademicPeriod[] = []
): boolean {
  if (!schedule) return false;

  // 1. Explicit draft is never published
  if (schedule.status === 'draft') {
    return false;
  }

  // 2. Explicit published status
  if (schedule.status === 'published') {
    // If an academic period exists for this schedule, verify it has not been unpublished by an admin
    const period = academicPeriods.find(p => 
      (schedule.periodId && p.id === schedule.periodId) ||
      (p.academicYear === schedule.academicYear && p.semester === schedule.semester)
    );
    if (period && period.isPublished === false) {
      return false;
    }
    return true;
  }

  // 3. Fallback: If status is undefined or 'generated', check if corresponding academic period is published
  const period = academicPeriods.find(p => 
    (schedule.periodId && p.id === schedule.periodId) ||
    (p.academicYear === schedule.academicYear && p.semester === schedule.semester)
  );

  if (period && period.isPublished === true) {
    return true;
  }

  return false;
}

