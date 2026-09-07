export interface RoomBookingRequest {
  id: string;
  lecturerId: string;
  lecturerName: string;
  lecturerEmail: string;
  hallId: string;
  hallName: string;
  buildingLocation: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  timeSlot: string;
  courseCode: string;
  courseTitle: string;
  expectedAttendance: number;
  purpose?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminFeedback?: string;
}

export interface NotificationItem {
  id: string;
  recipientRole: 'admin' | 'lecturer' | 'all';
  recipientId?: string; // specific lecturerId or userId or undefined
  recipientEmail?: string;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'booking_withdrawn' | 'schedule_update' | 'system';
  referenceId?: string;
  createdAt: string;
  isRead: boolean;
}

export type LecturerViewType = 'overview' | 'rooms' | 'schedule' | 'requests' | 'settings';
