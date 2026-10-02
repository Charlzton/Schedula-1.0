'use client';

import React, { useState } from 'react';
import { RoomBookingRequest, LecturerViewType } from '@/lib/lecturerTypes';
import { useTimetable } from '@/context/TimetableContext';
import { DoorOpen, Plus, Search, AlertCircle } from 'lucide-react';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';

interface LecturerBookingRequestsViewProps {
  bookingRequests: RoomBookingRequest[];
  onNavigate: (view: LecturerViewType) => void;
  onCancelRequest?: (id: string) => void;
}

export function LecturerBookingRequestsView({
  bookingRequests,
  onNavigate,
}: LecturerBookingRequestsViewProps) {
  const { withdrawBookingRequest, highlightedBookingId, setHighlightedBookingId } = useTimetable();

  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Withdrawal modal state
  const [requestToWithdraw, setRequestToWithdraw] = useState<RoomBookingRequest | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Auto-scroll and expand filter when navigated to a specific booking from a notification
  React.useEffect(() => {
    if (highlightedBookingId) {
      setFilterStatus('All');
      const timer = setTimeout(() => {
        const el = document.getElementById(`lecturer-booking-row-${highlightedBookingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedBookingId]);

  const filteredRequests = bookingRequests.filter(req => {
    if (filterStatus !== 'All' && req.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = req.hallName.toLowerCase().includes(q);
      const matchCourse = req.courseCode.toLowerCase().includes(q) || req.courseTitle.toLowerCase().includes(q);
      if (!matchRoom && !matchCourse) return false;
    }
    return true;
  });

  const handleConfirmWithdraw = async () => {
    if (!requestToWithdraw) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdrawBookingRequest(requestToWithdraw.id);
      setRequestToWithdraw(null);
    } catch (err: any) {
      setWithdrawError(err?.message || 'Failed to withdraw booking request.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-system">
      
      {/* 1. View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Booking Requests
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {bookingRequests.length} Total
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ad-hoc lecture hall and computer lab reservations submitted for review
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('rooms')}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer self-start sm:self-auto"
          title="New Request"
          aria-label="New Request"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Filter & Status Bar (Admin Style) */}
      <div className="p-3 sm:p-4 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs self-start overflow-x-auto max-w-full">
          {(['All', 'Pending', 'Approved', 'Rejected', 'Withdrawn'] as const).map(status => {
            const count = status === 'All' 
              ? bookingRequests.length 
              : bookingRequests.filter(r => r.status === status).length;
            const isSelected = filterStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected 
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-zinc-950 font-bold' 
                    : 'bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venue or course..."
            className="w-full glass-input pl-8.5 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* 3. Requests Table */}
      {filteredRequests.length > 0 ? (
        <div className="liquid-glass rounded-3xl border border-zinc-200/70 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-zinc-200/60 dark:border-white/10 text-zinc-500 dark:text-zinc-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-5">Venue & Course</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4">Notes / Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Action / Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
                {filteredRequests.map(req => {
                  const isHighlighted = highlightedBookingId === req.id;
                  return (
                  <tr 
                    key={req.id} 
                    id={`lecturer-booking-row-${req.id}`}
                    className={`transition-colors ${
                      isHighlighted 
                        ? 'bg-blue-50/20 dark:bg-blue-950/30 ring-1 ring-blue-500' 
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    
                    {/* Venue & Course */}
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {req.hallName}
                        </div>
                        {isHighlighted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                            <span>Focused</span>
                            <button
                              type="button"
                              onClick={() => setHighlightedBookingId(null)}
                              className="hover:opacity-75 cursor-pointer ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {req.courseCode} — {req.courseTitle}
                      </div>
                    </td>

                    {/* Day & Time Slot */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {req.day}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {req.timeSlot}
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-3.5 px-4 text-center font-bold text-zinc-900 dark:text-white">
                      {req.expectedAttendance}
                    </td>

                    {/* Purpose & Admin Note */}
                    <td className="py-3.5 px-4 text-xs max-w-xs">
                      <div className="text-zinc-600 dark:text-zinc-400">
                        {req.purpose || '—'}
                      </div>
                      {req.adminFeedback && (
                        <div className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block">
                          Note: &ldquo;{req.adminFeedback}&rdquo;
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {req.status === 'Pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                      {req.status === 'Approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Approved
                        </span>
                      )}
                      {req.status === 'Rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          Rejected
                        </span>
                      )}
                      {req.status === 'Withdrawn' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                          Withdrawn
                        </span>
                      )}
                    </td>

                    {/* Action & Submitted Date */}
                    <td className="py-3.5 px-4 sm:px-5 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setWithdrawError(null);
                              setRequestToWithdraw(req);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer inline-flex items-center justify-center"
                          >
                            Withdraw
                          </button>
                        )}
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {new Date(req.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              No booking requests found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
              Search available campus lecture halls and computer labs to submit an ad-hoc room reservation.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 transition-all cursor-pointer shadow-xs"
            >
              Check Room Availability
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Confirmation Modal */}
      {requestToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-system">
          <div className="w-full max-w-md rounded-3xl liquid-glass border border-zinc-200/80 dark:border-white/10 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Withdraw Room Request?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This action will mark your pending request as withdrawn.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-xs space-y-1">
              <p className="font-bold text-zinc-900 dark:text-white">{requestToWithdraw.hallName}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{requestToWithdraw.day} ({requestToWithdraw.timeSlot}) — {requestToWithdraw.courseCode}</p>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {withdrawError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestToWithdraw(null)}
                disabled={isWithdrawing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={isWithdrawing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Request'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
