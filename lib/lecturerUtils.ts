import { Lecturer } from './dataset';

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
