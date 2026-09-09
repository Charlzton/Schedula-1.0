'use client';

import React, { useState, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { RoomBookingRequest } from '@/lib/lecturerTypes';
import { 
  DoorOpen, 
  Search, 
  Check, 
  X, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';

export function BookingRequestsView() {
  const { 
    bookingRequests, 
    approveBookingRequest, 
    rejectBookingRequest, 
    facilities, 
    schedules,
    highlightedBookingId,
    setHighlightedBookingId
  } = useTimetable();

  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Auto-scroll and expand filter when navigated to a specific booking from a notification
  React.useEffect(() => {
    if (highlightedBookingId) {
      setFilterStatus('All');
      const timer = setTimeout(() => {
        const el = document.getElementById(`booking-card-${highlightedBookingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedBookingId]);

  // Modal / Feedback state for Approving with Note or Rejecting with Reason
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject';
    booking: RoomBookingRequest;
  } | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string>('');

  // Conflict and occupancy check helper for any booking request
  const checkVenueAvailability = (req: RoomBookingRequest) => {
    const facility = facilities.find(
      f => f.hallId === req.hallId || f.hallName.toLowerCase() === req.hallName.toLowerCase()
    );

    const [start, end] = req.timeSlot.split('-').map(s => s.trim());

    // 1. Facility capacity check
    const isOverCapacity = facility ? req.expectedAttendance > facility.capacity : false;

    // 2. Conflict with existing timetable schedules
    const timetableConflict = schedules.find(s => {
      if (s.day !== req.day) return false;
      const hallMatch = (s.hallId && s.hallId === req.hallId) ||
                        (s.hallName && s.hallName.toLowerCase() === req.hallName.toLowerCase());
      if (!hallMatch) return false;
      if (s.startTime && s.endTime && start && end) {
        return s.startTime === start || s.endTime === end || (s.startTime <= start && s.endTime >= end);
      }
      return false;
    });

    // 3. Conflict with other approved booking requests
    const bookingConflict = bookingRequests.find(b => {
      if (b.id === req.id || b.status !== 'Approved') return false;
      if (b.day !== req.day) return false;
      const hallMatch = (b.hallId && b.hallId === req.hallId) ||
                        (b.hallName && b.hallName.toLowerCase() === req.hallName.toLowerCase());
      if (!hallMatch) return false;
      return b.timeSlot === req.timeSlot;
    });

    return {
      facility,
      isOverCapacity,
      timetableConflict,
      bookingConflict,
      hasWarning: isOverCapacity || !!timetableConflict || !!bookingConflict
    };
  };

  const filteredRequests = useMemo(() => {
    return bookingRequests.filter(req => {
      if (filterStatus !== 'All' && req.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLecturer = req.lecturerName.toLowerCase().includes(q) || req.lecturerEmail.toLowerCase().includes(q);
        const matchVenue = req.hallName.toLowerCase().includes(q) || req.buildingLocation.toLowerCase().includes(q);
        const matchCourse = req.courseCode.toLowerCase().includes(q) || req.courseTitle.toLowerCase().includes(q);
        if (!matchLecturer && !matchVenue && !matchCourse) return false;
      }
      return true;
    });
  }, [bookingRequests, filterStatus, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: bookingRequests.length,
      pending: bookingRequests.filter(r => r.status === 'Pending').length,
      approved: bookingRequests.filter(r => r.status === 'Approved').length,
      rejected: bookingRequests.filter(r => r.status === 'Rejected').length,
      withdrawn: bookingRequests.filter(r => r.status === 'Withdrawn').length
    };
  }, [bookingRequests]);

  const handleQuickApprove = async (req: RoomBookingRequest) => {
    setProcessingId(req.id);
    try {
      await approveBookingRequest(req.id, 'Approved by Administrator');
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenActionModal = (type: 'approve' | 'reject', booking: RoomBookingRequest) => {
    setActionModal({ type, booking });
    setFeedbackNote(
      type === 'approve' 
        ? 'Approved for scheduled session' 
        : 'Conflicting departmental event'
    );
  };

  const handleConfirmModalAction = async () => {
    if (!actionModal) return;
    const { type, booking } = actionModal;
    setProcessingId(booking.id);
    try {
      if (type === 'approve') {
        await approveBookingRequest(booking.id, feedbackNote);
      } else {
        await rejectBookingRequest(booking.id, feedbackNote);
      }
      setActionModal(null);
      setFeedbackNote('');
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-system animate-in fade-in duration-300">
      
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Booking Requests
            </h2>
            {counts.pending > 0 && (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {counts.pending} pending
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Room reservations submitted by academic faculty
          </p>
        </div>
      </div>

      {/* 2. Status Navigation & Search Bar */}
      <div className="p-3 rounded-2xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs overflow-x-auto max-w-full">
          {(['All', 'Pending', 'Approved', 'Rejected', 'Withdrawn'] as const).map(status => {
            const count = status === 'All' ? counts.total : counts[status.toLowerCase() as keyof typeof counts];
            const isSelected = filterStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <span>{status}</span>
                <span className={`text-[11px] ${
                  isSelected 
                    ? 'opacity-80' 
                    : 'text-zinc-400'
                }`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* 3. Requests Grid / List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const availability = checkVenueAvailability(req);
            const isProcessing = processingId === req.id;
            const isHighlighted = highlightedBookingId === req.id;

            return (
              <div 
                key={req.id} 
                id={`booking-card-${req.id}`}
                className={`glass-panel rounded-2xl p-4 sm:p-5 transition-all ${
                  isHighlighted
                    ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-500/5'
                    : 'hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Request Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    
                    {/* Top Row: Venue, Status, and Warning Badge */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                        {req.hallName}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {req.buildingLocation}
                      </span>

                      {/* Focused Highlight Indicator */}
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          <span>Focused</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedBookingId(null);
                            }}
                            className="hover:opacity-75 cursor-pointer ml-0.5"
                            title="Dismiss highlight"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {/* Status Text */}
                      {req.status === 'Pending' && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Pending review
                        </span>
                      )}
                      {req.status === 'Approved' && (
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          Approved
                        </span>
                      )}
                      {req.status === 'Rejected' && (
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          Declined
                        </span>
                      )}
                      {req.status === 'Withdrawn' && (
                        <span className="text-xs font-medium text-zinc-400">
                          Withdrawn
                        </span>
                      )}

                      {/* Conflict Warning Notice (If pending) */}
                      {req.status === 'Pending' && availability.hasWarning && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10">
                          <AlertCircle className="w-3 h-3" />
                          {availability.timetableConflict 
                            ? `Conflict: ${availability.timetableConflict.courseCode}` 
                            : availability.bookingConflict
                            ? 'Conflict with another reservation'
                            : 'Capacity warning'}
                        </span>
                      )}
                    </div>

                    {/* Middle Row: Course & Faculty Information */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{req.lecturerName}</span>
                        <span className="text-zinc-400 font-normal">({req.lecturerEmail})</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{req.day}</span>
                        <span>•</span>
                        <span>{req.timeSlot}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                          {req.courseCode}
                        </span>
                        <span className="truncate max-w-xs">{req.courseTitle}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>Attendance:</span>
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {req.expectedAttendance}
                        </span>
                        {availability.facility && (
                          <span className="text-zinc-400">/ max {availability.facility.capacity}</span>
                        )}
                      </div>
                    </div>

                    {/* Purpose / Notes */}
                    {req.purpose && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-black/[0.02] dark:bg-white/[0.02] p-2 rounded-xl border border-zinc-200/50 dark:border-white/5">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Notes:</span> {req.purpose}
                      </div>
                    )}

                    {/* Admin Feedback (If reviewed) */}
                    {req.adminFeedback && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                        <span>Feedback: <em>&ldquo;{req.adminFeedback}&rdquo;</em></span>
                        {req.reviewedBy && <span className="text-zinc-400">— {req.reviewedBy}</span>}
                      </div>
                    )}

                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {req.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(req)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenActionModal('reject', req)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : req.status === 'Withdrawn' ? (
                      <div className="text-zinc-400 text-xs select-none">
                        Withdrawn
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(req.status === 'Approved' ? 'reject' : 'approve', req)}
                        disabled={isProcessing}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Change status
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl glass-panel p-12 text-center space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            No booking requests
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {searchQuery 
              ? `No requests match "${searchQuery}".` 
              : 'When faculty submit room reservation requests, they will appear here.'}
          </p>
        </div>
      )}

      {/* 4. Action / Feedback Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-system">
          <div className="w-full max-w-md rounded-3xl liquid-glass border border-zinc-200/80 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {actionModal.type === 'approve' ? 'Approve Room Request' : 'Decline Room Request'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {actionModal.booking.hallName} • {actionModal.booking.lecturerName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {actionModal.type === 'approve' ? 'Optional Note to Lecturer' : 'Reason for Declining'}
                </label>
                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Enter feedback or instructions for the instructor..."
                  className="w-full glass-input p-3 text-xs sm:text-sm text-zinc-900 dark:text-white rounded-xl placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmModalAction}
                  disabled={processingId !== null}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    actionModal.type === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
