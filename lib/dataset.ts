export interface Course {
  courseCode: string;
  courseTitle: string;
  totalCredits: number;
  level: number; // 100, 200, 300, 400
  semester: 'Semester 1' | 'Semester 2';
  expectedEnrollment: number;
  theoryHours: number;
  practicalHours: number;
  department: string;
  assignedLecturerId?: string;
  assignedLecturerName?: string;
}

export interface LectureFacility {
  hallId: string;
  hallName: string;
  venueType: 'Lecture Theatre' | 'Lecture Hall' | 'Auditorium' | 'Computer Lab';
  capacity: number;
  buildingLocation: string;
  hasProjector: boolean;
  hasComputers: boolean;
  computerCount?: number;
  hasAC?: boolean;
  hasSoundSystem?: boolean;
  status: 'Active' | 'Under Maintenance' | 'Inactive' | 'Maintenance';
}

export interface Lecturer {
  lecturerId: string;
  fullName: string;
  title?: 'Professor' | 'Associate Professor' | 'Senior Lecturer' | 'Lecturer' | 'Assistant Lecturer' | string;
  avatar?: string;
  officeEmail?: string;
  email?: string;
  phone?: string;
  department?: string;
  maxWeeklyHours?: number;
  specializations?: string[];
  assignedCourses?: string | string[];
  officeLocation?: string;
  availability?: string[];
  authUid?: string;
  accountStatus?: 'unclaimed' | 'active' | 'suspended';
  role?: 'lecturer' | 'admin' | 'super_admin';
  registeredAt?: string;
}

export interface ResidentialHall {
  hallName: string;
  category: 'Traditional Hall' | 'Traditional Hall (Male)' | 'Traditional Hall (Female)' | 'UGEL Hostel' | 'Hostel' | 'Graduate Hostel';
  management: 'University of Ghana' | 'UGEL';
}

export interface TimeSlot {
  slotId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  durationHours: number;
  durationMinutes?: number;
  periodNumber?: number;
  sessionType: 'Theory' | 'Lab / Practical';
}

export interface AcademicPeriod {
  id: string; // e.g., '2026-2027-sem1'
  academicYear: string; // e.g. '2026/2027'
  semester: 'Semester 1' | 'Semester 2';
  isCurrent: boolean;
  isActive?: boolean;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
}

export const INITIAL_ACADEMIC_PERIODS: AcademicPeriod[] = [
  {
    id: '2026-2027-sem1',
    academicYear: '2026/2027',
    semester: 'Semester 1',
    isCurrent: true,
    isPublished: true,
    publishedAt: '2026-09-01T08:00:00.000Z',
    publishedBy: 'Academic Directorate',
    createdAt: '2026-08-15T08:00:00.000Z'
  },
  {
    id: '2026-2027-sem2',
    academicYear: '2026/2027',
    semester: 'Semester 2',
    isCurrent: false,
    isPublished: false,
    createdAt: '2026-08-15T08:00:00.000Z'
  },
  {
    id: '2025-2026-sem2',
    academicYear: '2025/2026',
    semester: 'Semester 2',
    isCurrent: false,
    isPublished: true,
    publishedAt: '2026-01-15T09:00:00.000Z',
    publishedBy: 'Academic Directorate',
    createdAt: '2025-12-01T08:00:00.000Z'
  },
  {
    id: '2025-2026-sem1',
    academicYear: '2025/2026',
    semester: 'Semester 1',
    isCurrent: false,
    isPublished: true,
    publishedAt: '2025-09-10T09:00:00.000Z',
    publishedBy: 'Academic Directorate',
    createdAt: '2025-08-01T08:00:00.000Z'
  }
];

export interface TimetableEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  level: number;
  semester: 'Semester 1' | 'Semester 2';
  academicYear?: string; // e.g. '2026/2027'
  periodId?: string; // e.g. '2026-2027-sem1'
  status?: 'generated' | 'published' | 'draft';
  publishedAt?: string;
  publishedBy?: string;
  hallId: string;
  hallName: string;
  slotId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  durationHours: number;
  periodNumber?: number;
  periodLabel?: string;
  timeSlotLabel?: string;
  sessionType: 'Theory' | 'Lab / Practical';
  lecturerId: string;
  lecturerName: string;
  lecturerEmail?: string;
  expectedEnrollment: number;
  hallCapacity: number;
  hasConflict: boolean;
  conflictType?: 'CAPACITY_OVERFLOW' | 'ROOM_DOUBLE_BOOKING' | 'LECTURER_CLASH' | 'LEVEL_CLASH' | 'NONE';
  conflictReason?: string;
}

export type ScheduleAssignment = TimetableEntry;

export interface SystemActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'import' | 'update' | 'create' | 'generate' | 'conflict' | 'export' | 'booking' | 'delete';
  badgeColor?: string;
  userEmail?: string;
  userName?: string;
  createdAt?: string;
}

// Master Course Catalog from User Dataset
export const INITIAL_COURSES: Course[] = [
  { courseCode: 'DCIT101', courseTitle: 'INTRODUCTION TO COMPUTER SCIENCE', totalCredits: 3, level: 100, semester: 'Semester 1', expectedEnrollment: 350, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L311', assignedLecturerName: 'Dr. Prince Alvin Kwabena Ansah' },
  { courseCode: 'DCIT103', courseTitle: 'OFFICE PRODUCTIVITY TOOLS', totalCredits: 3, level: 100, semester: 'Semester 1', expectedEnrollment: 280, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L312', assignedLecturerName: 'Mr. Paul N. T. Ammah' },
  { courseCode: 'DCIT105', courseTitle: 'MATHEMATICS FOR IT PROFESSIONALS', totalCredits: 3, level: 100, semester: 'Semester 1', expectedEnrollment: 320, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L314', assignedLecturerName: 'Mr. Dwumfour Aziz Abdullai' },
  { courseCode: 'DCIT102', courseTitle: 'COMPUTER HARDWARE FUNDAMENTALS AND CIRCUITS', totalCredits: 3, level: 100, semester: 'Semester 2', expectedEnrollment: 340, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L312', assignedLecturerName: 'Mr. Paul N. T. Ammah' },
  { courseCode: 'DCIT104', courseTitle: 'PROGRAMMING FUNDAMENTALS', totalCredits: 3, level: 100, semester: 'Semester 2', expectedEnrollment: 330, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L308', assignedLecturerName: 'Dr. Michael Agbo Tettey Soli' },
  
  { courseCode: 'DCIT201', courseTitle: 'PROGRAMMING I', totalCredits: 3, level: 200, semester: 'Semester 1', expectedEnrollment: 280, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L308', assignedLecturerName: 'Dr. Michael Agbo Tettey Soli' },
  { courseCode: 'DCIT203', courseTitle: 'DIGITAL AND LOGIC SYSTEMS DESIGN', totalCredits: 3, level: 200, semester: 'Semester 1', expectedEnrollment: 250, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L306', assignedLecturerName: 'Prof. Kofi Sarpong Adu-Manu' },
  { courseCode: 'DCIT205', courseTitle: 'MULTI MEDIA AND WEB DESIGN', totalCredits: 3, level: 200, semester: 'Semester 1', expectedEnrollment: 240, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L310', assignedLecturerName: 'Dr. Matilda S. A. Wilson' },
  { courseCode: 'DCIT207', courseTitle: 'COMPUTER ORGANIZATION & ARCHITECTURE', totalCredits: 3, level: 200, semester: 'Semester 1', expectedEnrollment: 220, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L306', assignedLecturerName: 'Prof. Kofi Sarpong Adu-Manu' },
  { courseCode: 'DCIT209', courseTitle: 'E-BUSINESS ARCHITECTURES', totalCredits: 3, level: 200, semester: 'Semester 1', expectedEnrollment: 210, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L307', assignedLecturerName: 'Prof. Solomon Mensah' },
  
  { courseCode: 'DCIT202', courseTitle: 'MOBILE APPLICATION DEVELOPMENT', totalCredits: 3, level: 200, semester: 'Semester 2', expectedEnrollment: 260, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L308', assignedLecturerName: 'Dr. Michael Agbo Tettey Soli' },
  { courseCode: 'DCIT204', courseTitle: 'DATA STRUCTURES & ALGORITHM I', totalCredits: 3, level: 200, semester: 'Semester 2', expectedEnrollment: 270, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L304', assignedLecturerName: 'Prof. Justice K. Appati' },
  { courseCode: 'DCIT206', courseTitle: 'SYSTEMS ADMINISTRATION', totalCredits: 3, level: 200, semester: 'Semester 2', expectedEnrollment: 230, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L313', assignedLecturerName: 'Mr. Julius Y. Ludu' },
  { courseCode: 'DCIT208', courseTitle: 'SOFTWARE ENGINEERING', totalCredits: 3, level: 200, semester: 'Semester 2', expectedEnrollment: 265, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L303', assignedLecturerName: 'Prof. Isaac Wiafe' },
  { courseCode: 'DCIT214', courseTitle: 'INFORMATION MODELING AND SPECIFICATION', totalCredits: 3, level: 200, semester: 'Semester 2', expectedEnrollment: 215, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L309', assignedLecturerName: 'Dr. Edward Danso Ansong' },
  
  { courseCode: 'DCIT301', courseTitle: 'OPERATING SYSTEMS', totalCredits: 3, level: 300, semester: 'Semester 1', expectedEnrollment: 190, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L302', assignedLecturerName: 'Prof. Jamal-Deen Abdulai' },
  { courseCode: 'DCIT303', courseTitle: 'COMPUTER NETWORKS', totalCredits: 3, level: 300, semester: 'Semester 1', expectedEnrollment: 200, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L301', assignedLecturerName: 'Prof. Ferdinand A. Katsriku' },
  { courseCode: 'DCIT305', courseTitle: 'DATABASE FUNDAMENTALS', totalCredits: 3, level: 300, semester: 'Semester 1', expectedEnrollment: 210, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L309', assignedLecturerName: 'Dr. Edward Danso Ansong' },
  { courseCode: 'DCIT313', courseTitle: 'INTRODUCTION TO ARTIFICIAL INTELLIGENCE', totalCredits: 3, level: 300, semester: 'Semester 1', expectedEnrollment: 185, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L305', assignedLecturerName: 'Prof. Ebenezer Owusu' },
  { courseCode: 'DCIT317', courseTitle: 'IT PROJECT MANAGEMENT', totalCredits: 3, level: 300, semester: 'Semester 1', expectedEnrollment: 175, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L314', assignedLecturerName: 'Mr. Dwumfour Aziz Abdullai' },
  { courseCode: 'DCIT321', courseTitle: 'SOFTWARE EVOLUTION', totalCredits: 3, level: 300, semester: 'Semester 1', expectedEnrollment: 160, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L303', assignedLecturerName: 'Prof. Isaac Wiafe' },
  
  { courseCode: 'DCIT302', courseTitle: 'HUMAN COMPUTER INTERACTION', totalCredits: 3, level: 300, semester: 'Semester 2', expectedEnrollment: 180, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L310', assignedLecturerName: 'Dr. Matilda S. A. Wilson' },
  { courseCode: 'DCIT304', courseTitle: 'RESEARCH METHODS', totalCredits: 3, level: 300, semester: 'Semester 2', expectedEnrollment: 195, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L307', assignedLecturerName: 'Prof. Solomon Mensah' },
  { courseCode: 'DCIT306', courseTitle: 'CLOUD COMPUTING', totalCredits: 3, level: 300, semester: 'Semester 2', expectedEnrollment: 185, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L301', assignedLecturerName: 'Prof. Ferdinand A. Katsriku' },
  { courseCode: 'DCIT308', courseTitle: 'DATA STRUCTURE AND ALGORITHMS II', totalCredits: 3, level: 300, semester: 'Semester 2', expectedEnrollment: 205, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L304', assignedLecturerName: 'Prof. Justice K. Appati' },
  { courseCode: 'DCIT312', courseTitle: 'INFORMATION SECURITY MANAGEMENT', totalCredits: 3, level: 300, semester: 'Semester 2', expectedEnrollment: 170, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L306', assignedLecturerName: 'Prof. Kofi Sarpong Adu-Manu' },
  { courseCode: 'DCIT318', courseTitle: 'PROGRAMMING II', totalCredits: 3, level: 300, semester: 'Semester 2', expectedEnrollment: 165, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L311', assignedLecturerName: 'Dr. Prince Alvin Kwabena Ansah' },
  
  { courseCode: 'DCIT401', courseTitle: 'SOCIAL, LEGAL, ETHICAL & PROFESSIONAL ISSUES', totalCredits: 3, level: 400, semester: 'Semester 1', expectedEnrollment: 140, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L307', assignedLecturerName: 'Prof. Solomon Mensah' },
  { courseCode: 'DCIT409', courseTitle: 'DIGITAL FORENSICS', totalCredits: 3, level: 400, semester: 'Semester 1', expectedEnrollment: 125, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L313', assignedLecturerName: 'Mr. Julius Y. Ludu' },
  { courseCode: 'DCIT415', courseTitle: 'ADVANCED SOFTWARE ENGINEERING', totalCredits: 3, level: 400, semester: 'Semester 1', expectedEnrollment: 135, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L303', assignedLecturerName: 'Prof. Isaac Wiafe' },
  { courseCode: 'DCIT419', courseTitle: 'AGILE METHODS', totalCredits: 3, level: 400, semester: 'Semester 1', expectedEnrollment: 115, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L303', assignedLecturerName: 'Prof. Isaac Wiafe' },
  { courseCode: 'DCIT421', courseTitle: 'PERSUASIVE SOFTWARE DEVELOPMENT', totalCredits: 3, level: 400, semester: 'Semester 1', expectedEnrollment: 110, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L310', assignedLecturerName: 'Dr. Matilda S. A. Wilson' },
  
  { courseCode: 'DCIT402', courseTitle: 'MANAGEMENT PRINCIPLES IN COMPUTING', totalCredits: 3, level: 400, semester: 'Semester 2', expectedEnrollment: 130, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L314', assignedLecturerName: 'Mr. Dwumfour Aziz Abdullai' },
  { courseCode: 'DCIT412', courseTitle: 'COMPUTER VISION', totalCredits: 3, level: 400, semester: 'Semester 2', expectedEnrollment: 105, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L305', assignedLecturerName: 'Prof. Ebenezer Owusu' },
  { courseCode: 'DCIT418', courseTitle: 'SYSTEMS AND NETWORK SECURITY', totalCredits: 3, level: 400, semester: 'Semester 2', expectedEnrollment: 120, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L302', assignedLecturerName: 'Prof. Jamal-Deen Abdulai' },
  { courseCode: 'DCIT426', courseTitle: 'TELECOMMUNICATION SYSTEMS', totalCredits: 3, level: 400, semester: 'Semester 2', expectedEnrollment: 95, theoryHours: 3, practicalHours: 0, department: 'Computer Science', assignedLecturerId: 'L301', assignedLecturerName: 'Prof. Ferdinand A. Katsriku' },
  { courseCode: 'DCIT428', courseTitle: 'WIRELESS SYSTEMS AND NETWORK', totalCredits: 3, level: 400, semester: 'Semester 2', expectedEnrollment: 100, theoryHours: 2, practicalHours: 1, department: 'Computer Science', assignedLecturerId: 'L306', assignedLecturerName: 'Prof. Kofi Sarpong Adu-Manu' }
];

// Master Lecture Facilities & Labs
export const INITIAL_FACILITIES: LectureFacility[] = [
  { hallId: 'H101', hallName: 'Great Hall', venueType: 'Lecture Theatre', capacity: 1500, buildingLocation: 'Main Campus Central', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H102', hallName: 'N-Block Lecture Hall 1', venueType: 'Lecture Hall', capacity: 500, buildingLocation: 'N-Block Complex', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H103', hallName: 'N-Block Lecture Hall 2', venueType: 'Lecture Hall', capacity: 400, buildingLocation: 'N-Block Complex', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H104', hallName: 'N-Block Lecture Hall 3', venueType: 'Lecture Hall', capacity: 300, buildingLocation: 'N-Block Complex', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H105', hallName: 'JQB23 (Jones Quartey Building)', venueType: 'Lecture Hall', capacity: 400, buildingLocation: 'JQB Complex', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H106', hallName: 'Cedi Conference Centre', venueType: 'Auditorium', capacity: 300, buildingLocation: 'Cedi Conference Block', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H107', hallName: 'Computer Science Lecture Theatre', venueType: 'Lecture Theatre', capacity: 220, buildingLocation: 'Dept of Computer Science', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H108', hallName: 'Mathematical Sciences Auditorium', venueType: 'Auditorium', capacity: 250, buildingLocation: 'Dept of Mathematics', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H109', hallName: 'Statistics Lecture Theatre', venueType: 'Lecture Theatre', capacity: 200, buildingLocation: 'Dept of Statistics', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H110', hallName: 'NN1 (New Natural Science Block)', venueType: 'Lecture Hall', capacity: 200, buildingLocation: 'NN-Block Complex', hasProjector: true, hasComputers: false, status: 'Active' },
  { hallId: 'H111', hallName: 'Computer Science Lab 1 (UGCS)', venueType: 'Computer Lab', capacity: 120, buildingLocation: 'Dept of Computer Science', hasProjector: true, hasComputers: true, status: 'Active' },
  { hallId: 'H112', hallName: 'Computer Science Lab 2', venueType: 'Computer Lab', capacity: 100, buildingLocation: 'Dept of Computer Science', hasProjector: true, hasComputers: true, status: 'Active' },
  { hallId: 'H113', hallName: 'Engineering Lab 1', venueType: 'Computer Lab', capacity: 100, buildingLocation: 'School of Engineering', hasProjector: true, hasComputers: true, status: 'Active' },
  { hallId: 'H115', hallName: 'Department AI & Network Lab', venueType: 'Computer Lab', capacity: 80, buildingLocation: 'Dept of Computer Science', hasProjector: true, hasComputers: true, status: 'Active' },
  { hallId: 'H114', hallName: 'Balme Library Lecture Hall', venueType: 'Lecture Hall', capacity: 250, buildingLocation: 'Balme Library Complex', hasProjector: true, hasComputers: false, status: 'Active' }
];

// Master Lecturers
export const INITIAL_LECTURERS: Lecturer[] = [
  { lecturerId: 'L301', fullName: 'Prof. Ferdinand A. Katsriku', title: 'Professor', officeEmail: 'fkatsriku@ug.edu.gh', assignedCourses: 'DCIT303, DCIT426, DCIT306', accountStatus: 'unclaimed' },
  { lecturerId: 'L302', fullName: 'Prof. Jamal-Deen Abdulai', title: 'Associate Professor', officeEmail: 'jabdulai@ug.edu.gh', assignedCourses: 'DCIT301, DCIT418', accountStatus: 'unclaimed' },
  { lecturerId: 'L303', fullName: 'Prof. Isaac Wiafe', title: 'Associate Professor', officeEmail: 'iwiafe@ug.edu.gh', assignedCourses: 'DCIT208, DCIT415, DCIT321, DCIT419', accountStatus: 'unclaimed' },
  { lecturerId: 'L304', fullName: 'Prof. Justice K. Appati', title: 'Associate Professor', officeEmail: 'jkappati@ug.edu.gh', assignedCourses: 'DCIT204, DCIT308', accountStatus: 'unclaimed' },
  { lecturerId: 'L305', fullName: 'Prof. Ebenezer Owusu', title: 'Associate Professor', officeEmail: 'ebeowusu@ug.edu.gh', assignedCourses: 'DCIT313, DCIT412', accountStatus: 'unclaimed' },
  { lecturerId: 'L306', fullName: 'Prof. Kofi Sarpong Adu-Manu', title: 'Associate Professor', officeEmail: 'ksadu-manu@ug.edu.gh', assignedCourses: 'DCIT428, DCIT207, DCIT203, DCIT312', accountStatus: 'unclaimed' },
  { lecturerId: 'L307', fullName: 'Prof. Solomon Mensah', title: 'Senior Lecturer', officeEmail: 'smensah03@ug.edu.gh', assignedCourses: 'DCIT304, DCIT209, DCIT401', accountStatus: 'unclaimed' },
  { lecturerId: 'L308', fullName: 'Dr. Michael Agbo Tettey Soli', title: 'Senior Lecturer', officeEmail: 'msoli@ug.edu.gh', assignedCourses: 'DCIT104, DCIT201, DCIT202', accountStatus: 'unclaimed' },
  { lecturerId: 'L309', fullName: 'Dr. Edward Danso Ansong', title: 'Senior Lecturer', officeEmail: 'edansong@ug.edu.gh', assignedCourses: 'DCIT305, DCIT214', accountStatus: 'unclaimed' },
  { lecturerId: 'L310', fullName: 'Dr. Matilda S. A. Wilson', title: 'Senior Lecturer', officeEmail: 'matwaa@ug.edu.gh', assignedCourses: 'DCIT205, DCIT302, DCIT421', accountStatus: 'unclaimed' },
  { lecturerId: 'L311', fullName: 'Dr. Prince Alvin Kwabena Ansah', title: 'Lecturer', officeEmail: 'pakansah@ug.edu.gh', assignedCourses: 'DCIT101, DCIT318', accountStatus: 'unclaimed' },
  { lecturerId: 'L312', fullName: 'Mr. Paul N. T. Ammah', title: 'Assistant Lecturer', officeEmail: 'pammah@ug.edu.gh', assignedCourses: 'DCIT102, DCIT103', accountStatus: 'unclaimed' },
  { lecturerId: 'L313', fullName: 'Mr. Julius Y. Ludu', title: 'Assistant Lecturer', officeEmail: 'jyludu@ug.edu.gh', assignedCourses: 'DCIT409, DCIT206', accountStatus: 'unclaimed' },
  { lecturerId: 'L314', fullName: 'Mr. Dwumfour Aziz Abdullai', title: 'Assistant Lecturer', officeEmail: 'adwumfour@ug.edu.gh', assignedCourses: 'DCIT105, DCIT317, DCIT402', accountStatus: 'unclaimed' }
];

// Master Residential Halls
export const INITIAL_RESIDENTIAL_HALLS: ResidentialHall[] = [
  { hallName: 'Legon Hall', category: 'Traditional Hall', management: 'University of Ghana' },
  { hallName: 'Akuafo Hall', category: 'Traditional Hall', management: 'University of Ghana' },
  { hallName: 'Commonwealth Hall (Vandals)', category: 'Traditional Hall (Male)', management: 'University of Ghana' },
  { hallName: 'Volta Hall', category: 'Traditional Hall (Female)', management: 'University of Ghana' },
  { hallName: 'Mensah Sarbah Hall', category: 'Traditional Hall', management: 'University of Ghana' },
  { hallName: 'Dr. Hilla Limann Hall', category: 'UGEL Hostel', management: 'UGEL' },
  { hallName: 'Alexander Adum Kwapong Hall', category: 'UGEL Hostel', management: 'UGEL' },
  { hallName: 'Elizabeth Frances Sey Hall', category: 'UGEL Hostel', management: 'UGEL' },
  { hallName: 'Jean Nelson Aka Hall', category: 'UGEL Hostel', management: 'UGEL' },
  { hallName: 'Jubilee Hall', category: 'Hostel', management: 'UGEL' },
  { hallName: 'International Students Hostel 1 & 2', category: 'Hostel', management: 'UGEL' },
  { hallName: 'Valco Graduate Hostels', category: 'Graduate Hostel', management: 'UGEL' }
];

// Master Time Slots (25 slots across Monday - Friday)
export const INITIAL_TIME_SLOTS: TimeSlot[] = [
  { slotId: 'TS01', day: 'Monday', startTime: '07:30', endTime: '09:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS02', day: 'Monday', startTime: '09:30', endTime: '11:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS03', day: 'Monday', startTime: '11:30', endTime: '12:30', durationHours: 1, sessionType: 'Lab / Practical' },
  { slotId: 'TS04', day: 'Monday', startTime: '13:30', endTime: '15:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS05', day: 'Monday', startTime: '15:30', endTime: '17:30', durationHours: 2, sessionType: 'Theory' },

  { slotId: 'TS06', day: 'Tuesday', startTime: '07:30', endTime: '09:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS07', day: 'Tuesday', startTime: '09:30', endTime: '11:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS08', day: 'Tuesday', startTime: '11:30', endTime: '12:30', durationHours: 1, sessionType: 'Lab / Practical' },
  { slotId: 'TS09', day: 'Tuesday', startTime: '13:30', endTime: '15:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS10', day: 'Tuesday', startTime: '15:30', endTime: '17:30', durationHours: 2, sessionType: 'Theory' },

  { slotId: 'TS11', day: 'Wednesday', startTime: '07:30', endTime: '09:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS12', day: 'Wednesday', startTime: '09:30', endTime: '11:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS13', day: 'Wednesday', startTime: '11:30', endTime: '12:30', durationHours: 1, sessionType: 'Lab / Practical' },
  { slotId: 'TS14', day: 'Wednesday', startTime: '13:30', endTime: '15:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS15', day: 'Wednesday', startTime: '15:30', endTime: '17:30', durationHours: 2, sessionType: 'Theory' },

  { slotId: 'TS16', day: 'Thursday', startTime: '07:30', endTime: '09:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS17', day: 'Thursday', startTime: '09:30', endTime: '11:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS18', day: 'Thursday', startTime: '11:30', endTime: '12:30', durationHours: 1, sessionType: 'Lab / Practical' },
  { slotId: 'TS19', day: 'Thursday', startTime: '13:30', endTime: '15:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS20', day: 'Thursday', startTime: '15:30', endTime: '17:30', durationHours: 2, sessionType: 'Theory' },

  { slotId: 'TS21', day: 'Friday', startTime: '07:30', endTime: '09:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS22', day: 'Friday', startTime: '09:30', endTime: '11:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS23', day: 'Friday', startTime: '11:30', endTime: '12:30', durationHours: 1, sessionType: 'Lab / Practical' },
  { slotId: 'TS24', day: 'Friday', startTime: '13:30', endTime: '15:30', durationHours: 2, sessionType: 'Theory' },
  { slotId: 'TS25', day: 'Friday', startTime: '15:30', endTime: '17:30', durationHours: 2, sessionType: 'Theory' }
];

// Initial System Activity State (clean initialization)
export const INITIAL_SYSTEM_ACTIVITIES: SystemActivity[] = [
  { 
    id: 'ACT-INIT', 
    action: 'System Initialized', 
    description: 'Academic scheduling environment initialized', 
    timestamp: 'Just now', 
    type: 'create', 
    badgeColor: 'blue',
    userEmail: 'admin@ug.edu.gh',
    userName: 'System Administrator'
  }
];

// Initial Booking Requests
export const INITIAL_BOOKING_REQUESTS = [
  {
    id: 'REQ-DEMO-001',
    lecturerId: 'L311',
    lecturerName: 'Dr. Prince Alvin Kwabena Ansah',
    lecturerEmail: 'pansah@ug.edu.gh',
    hallId: 'H105',
    hallName: 'JQB23 (Jones Quartey Building)',
    buildingLocation: 'JQB Complex',
    day: 'Wednesday' as const,
    timeSlot: '07:30 - 09:30',
    courseCode: 'DCIT101',
    courseTitle: 'INTRODUCTION TO COMPUTER SCIENCE',
    expectedAttendance: 180,
    purpose: 'Mid-semester review & tutorial session',
    status: 'Pending' as const,
    submittedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'REQ-DEMO-002',
    lecturerId: 'L308',
    lecturerName: 'Dr. Michael Agbo Tettey Soli',
    lecturerEmail: 'msoli@ug.edu.gh',
    hallId: 'H102',
    hallName: 'N-Block Lecture Hall 1',
    buildingLocation: 'N-Block Complex',
    day: 'Thursday' as const,
    timeSlot: '13:30 - 15:30',
    courseCode: 'DCIT201',
    courseTitle: 'PROGRAMMING I',
    expectedAttendance: 240,
    purpose: 'Extra tutorial class for Level 200 cohort',
    status: 'Pending' as const,
    submittedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

// Initial Notification Items for Admin & Lecturers
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-DEMO-001',
    recipientRole: 'admin' as const,
    title: 'New Room Request',
    message: 'Dr. Kwame Mensah requested Jones Quartey Building - Room 01 for Wednesday 09:30 - 11:30 (DCIT 101)',
    type: 'booking_request' as const,
    referenceId: 'REQ-DEMO-001',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: false
  },
  {
    id: 'NOTIF-DEMO-002',
    recipientRole: 'admin' as const,
    title: 'New Room Request',
    message: 'Prof. Abena Osei requested N Block Room 1 for Thursday 13:30 - 15:30 (DCIT 201)',
    type: 'booking_request' as const,
    referenceId: 'REQ-DEMO-002',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isRead: false
  },
  {
    id: 'NOTIF-DEMO-003',
    recipientRole: 'lecturer' as const,
    recipientId: 'LEC01',
    recipientEmail: 'kmensah@ug.edu.gh',
    title: 'Welcome to Faculty Portal',
    message: 'You can check real-time lecture hall availability and submit room reservation requests directly.',
    type: 'system' as const,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: false
  }
];

export function isCourseAllocatedToLecturer(
  course: Course | null | undefined,
  lecturer: Lecturer | null | undefined,
  userAuthUid?: string | null
): boolean {
  if (!course) return false;

  // 1. Direct Auth UID match if passed
  if (userAuthUid && course.assignedLecturerId && course.assignedLecturerId === userAuthUid) {
    return true;
  }

  if (!lecturer) return false;

  // 2. Direct Lecturer ID match
  if (course.assignedLecturerId && lecturer.lecturerId) {
    if (course.assignedLecturerId.trim().toUpperCase() === lecturer.lecturerId.trim().toUpperCase()) {
      return true;
    }
  }

  // 3. Auth UID match on lecturer object
  if (course.assignedLecturerId && lecturer.authUid) {
    if (course.assignedLecturerId === lecturer.authUid) {
      return true;
    }
  }

  // 4. Full name match (handles both direct and stripped title comparisons)
  if (course.assignedLecturerName && lecturer.fullName) {
    const cName = course.assignedLecturerName.trim().toLowerCase();
    const lName = lecturer.fullName.trim().toLowerCase();
    if (cName === lName) {
      return true;
    }
    // Compare after removing leading titles (e.g. "Dr. Michael Agbo Tettey Soli" vs "Michael Agbo Tettey Soli")
    const cleanPrefixRegex = /^(?:(?:rev(?:erend)?\.?\s*(?:dr\.?|prof(?:essor)?\.?)?)|(?:(?:associate|assoc\.?)\s+prof(?:essor)?\.?)|(?:(?:assistant|asst\.?)\s+prof(?:essor)?\.?)|(?:prof(?:essor)?\.?)|(?:dr\.?|doctor)|(?:mr\.?)|(?:mrs\.?)|(?:ms\.?)|(?:miss))\s+/i;
    const cleanCourseName = cName.replace(cleanPrefixRegex, '').trim();
    const cleanLecName = lName.replace(cleanPrefixRegex, '').trim();
    if (cleanCourseName && cleanLecName && cleanCourseName === cleanLecName) {
      return true;
    }
  }

  // 5. Lecturer assignedCourses field check
  if (lecturer.assignedCourses && course.courseCode) {
    const courseCodeClean = course.courseCode.replace(/\s+/g, '').toUpperCase();
    const assignedList = Array.isArray(lecturer.assignedCourses)
      ? lecturer.assignedCourses
      : lecturer.assignedCourses.split(',').map(s => s.trim());

    if (assignedList.some(item => item.replace(/\s+/g, '').toUpperCase() === courseCodeClean)) {
      return true;
    }
  }

  // 6. Lecturer specializations field check
  if (lecturer.specializations && Array.isArray(lecturer.specializations) && course.courseCode) {
    const courseCodeClean = course.courseCode.replace(/\s+/g, '').toUpperCase();
    if (lecturer.specializations.some(item => item.replace(/\s+/g, '').toUpperCase() === courseCodeClean)) {
      return true;
    }
  }

  return false;
}

