export type TourRole = 'admin' | 'super_admin' | 'lecturer' | 'student';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  preferredPlacement?: TooltipPlacement;
  padding?: number;
  radius?: number;
  optional?: boolean;
}

export const SUPER_ADMIN_TOUR_STEPS: TourStep[] = [
  {
    id: 'admin-overview',
    targetSelector: '[data-tour="admin-overview"]',
    title: 'Overview',
    description: 'Monitor curriculum load, scheduling efficiency, and active lecture sessions across departments.',
    preferredPlacement: 'bottom',
    padding: 10,
    radius: 20
  },
  {
    id: 'sidebar',
    targetSelector: '[data-tour="sidebar"]',
    title: 'Sidebar',
    description: 'Access all administrative modules, system configurations, and master timetables from the expandable navigation sidebar.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 24
  },
  {
    id: 'sidebar-courses',
    targetSelector: '[data-tour="sidebar-courses"]',
    title: 'Courses',
    description: 'Manage course creation, code assignments, unit allocations, and department offerings.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'sidebar-facilities',
    targetSelector: '[data-tour="sidebar-facilities"]',
    title: 'Facilities',
    description: 'Configure classroom capacity, lecture halls, venue availability, and spatial constraints.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'sidebar-lecturers',
    targetSelector: '[data-tour="sidebar-lecturers"]',
    title: 'Lecturers',
    description: 'Maintain faculty profiles, teaching load availability, status activation, and assigned departments.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'sidebar-schedules',
    targetSelector: '[data-tour="sidebar-schedules"]',
    title: 'Schedule',
    description: 'Oversee timetable generation, conflict resolution, room allocations, and schedule publishing.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'sidebar-admins',
    targetSelector: '[data-tour="sidebar-admins"]',
    title: 'Admins',
    description: 'Manage administrative access control, sub-admin management, and system permissions.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'sidebar-settings',
    targetSelector: '[data-tour="sidebar-settings"]',
    title: 'Settings',
    description: 'Configure system preferences, profile configuration, domain authorization, and persistent rules.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'quick-search',
    targetSelector: '[data-tour="quick-search"]',
    title: 'Quick Search',
    description: 'Instantly filter and find courses, venues, or faculty across the application.',
    preferredPlacement: 'bottom',
    padding: 6,
    radius: 14
  },
  {
    id: 'header-extras',
    targetSelector: '[data-tour="header-extras"]',
    title: 'Extras',
    description: 'Manage system notices, quick preferences, role switchers, and profile utilities housed in this area.',
    preferredPlacement: 'bottom',
    padding: 6,
    radius: 16
  }
];

export const ADMIN_TOUR_STEPS: TourStep[] = SUPER_ADMIN_TOUR_STEPS.filter(
  step => step.id !== 'sidebar-admins'
);

export const LECTURER_TOUR_STEPS: TourStep[] = [
  {
    id: 'lecturer-overview',
    targetSelector: '[data-tour="lecturer-overview"]',
    title: 'Overview',
    description: 'View your weekly teaching workload, assigned courses, and pending room reservation requests.',
    preferredPlacement: 'bottom',
    padding: 10,
    radius: 16
  },
  {
    id: 'lecturer-sidebar',
    targetSelector: '[data-tour="sidebar"]',
    title: 'Sidebar',
    description: 'Access your teaching timetable, room booking tools, and course information from the sidebar.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 24
  },
  {
    id: 'lecturer-nav-rooms',
    targetSelector: '[data-tour="sidebar-facilities"]',
    title: 'Rooms',
    description: 'Check real-time lecture hall availability and submit room reservation requests for review.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'lecturer-nav-schedule',
    targetSelector: '[data-tour="sidebar-schedules"]',
    title: 'Schedule',
    description: 'Inspect your personalized class schedule with allocated rooms, lecture hours, and course codes.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'lecturer-nav-courses',
    targetSelector: '[data-tour="sidebar-courses"]',
    title: 'My Courses',
    description: 'Review curriculum details, student enrollment counts, and credit hours for your assigned subjects.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'lecturer-nav-requests',
    targetSelector: '[data-tour="sidebar-requests"]',
    title: 'Requests',
    description: 'Track the real-time status of your room requests and receive administrative feedback.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'lecturer-nav-settings',
    targetSelector: '[data-tour="sidebar-settings"]',
    title: 'Settings',
    description: 'Manage your faculty profile details, notification preferences, and account security.',
    preferredPlacement: 'right',
    padding: 6,
    radius: 12
  },
  {
    id: 'lecturer-header-actions',
    targetSelector: '[data-tour="header-extras"]',
    title: 'Extras',
    description: 'Receive booking approvals, toggle light and dark modes, and update your faculty contact details.',
    preferredPlacement: 'bottom',
    padding: 6,
    radius: 16
  }
];

// Student tour placeholder for future extension if student role is added
export const STUDENT_TOUR_STEPS: TourStep[] = [];
