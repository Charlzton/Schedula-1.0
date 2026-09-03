'use client';

import React, { useState, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { LectureFacility } from '@/lib/dataset';
import { RoomBookingRequest } from '@/lib/lecturerTypes';
import { RoomBookingModal } from '../modals/RoomBookingModal';
import { Search, DoorOpen, Plus } from 'lucide-react';

interface LecturerRoomAvailabilityViewProps {
  onAddBookingRequest: (request: Omit<RoomBookingRequest, 'id' | 'submittedAt' | 'status'>) => Promise<void> | void;
}

export function LecturerRoomAvailabilityView({ onAddBookingRequest }: LecturerRoomAvailabilityViewProps) {
  const { facilities, schedules, timeSlots, courses, bookingRequests } = useTimetable();

  // Filters
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('07:30 - 09:30');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [venueTypeFilter, setVenueTypeFilter] = useState<string>('All');
  
  // Amenity filters
  const [filterProjector, setFilterProjector] = useState<boolean>(false);
  const [filterComputers, setFilterComputers] = useState<boolean>(false);
  const [filterAC, setFilterAC] = useState<boolean>(false);
  const [filterSound, setFilterSound] = useState<boolean>(false);

  // Modal state
  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState<LectureFacility | null>(null);

  // Available slots from timeSlots or default schedule blocks
  const availableSlots = useMemo(() => {
    if (timeSlots && timeSlots.length > 0) {
      const unique = Array.from(new Set(timeSlots.map(t => `${t.startTime} - ${t.endTime}`)));
      return unique.sort();
    }
    return [
      '07:30 - 09:30',
      '09:30 - 11:30',
      '11:30 - 13:30',
      '13:30 - 15:30',
      '15:30 - 17:30',
      '17:30 - 19:30'
    ];
  }, [timeSlots]);

  // Venue Types in dataset
  const venueTypes = useMemo(() => {
    const types = Array.from(new Set(facilities.map(f => f.venueType)));
    return ['All', ...types];
  }, [facilities]);

  // Calculate room status for each facility on selected day and time slot
  const processedRooms = useMemo(() => {
    const [start, end] = selectedTimeSlot.split('-').map(s => s.trim());

    return facilities.map((facility) => {
      // 1. Check Maintenance
      const isMaintenance = facility.status === 'Under Maintenance' || 
                            facility.status === 'Maintenance' || 
                            facility.status === 'Inactive';

      // 2. Check if occupied in scheduled timetables
      const conflictSchedule = schedules.find((s) => {
        if (s.day !== selectedDay) return false;
        
        const hallMatch = (s.hallId && s.hallId === facility.hallId) ||
                          (s.hallName && s.hallName.toLowerCase() === facility.hallName.toLowerCase());
        if (!hallMatch) return false;

        if (s.startTime && s.endTime && start && end) {
          return s.startTime === start || s.endTime === end || (s.startTime <= start && s.endTime >= end);
        }
        return false;
      });

      // 3. Check if occupied in approved ad-hoc bookings
      const approvedBooking = bookingRequests?.find((b) => {
        if (b.status !== 'Approved') return false;
        if (b.day !== selectedDay) return false;
        const hallMatch = (b.hallId && b.hallId === facility.hallId) ||
                          (b.hallName && b.hallName.toLowerCase() === facility.hallName.toLowerCase());
        if (!hallMatch) return false;
        return b.timeSlot === selectedTimeSlot;
      });

      let status: 'Available' | 'Occupied' | 'Under Maintenance' = 'Available';
      if (isMaintenance) {
        status = 'Under Maintenance';
      } else if (conflictSchedule || approvedBooking) {
        status = 'Occupied';
      }

      return {
        facility,
        status,
        conflictSchedule,
        approvedBooking
      };
    });
  }, [facilities, schedules, bookingRequests, selectedDay, selectedTimeSlot]);

  // Filtered rooms based on user criteria
  const filteredRooms = useMemo(() => {
    return processedRooms.filter(({ facility }) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = facility.hallName.toLowerCase().includes(q);
        const matchLoc = facility.buildingLocation.toLowerCase().includes(q);
        if (!matchName && !matchLoc) return false;
      }

      if (minCapacity > 0 && facility.capacity < minCapacity) {
        return false;
      }

      if (venueTypeFilter !== 'All' && facility.venueType !== venueTypeFilter) {
        return false;
      }

      if (filterProjector && !facility.hasProjector) return false;
      if (filterComputers && !facility.hasComputers) return false;
      if (filterAC && !facility.hasAC) return false;
      if (filterSound && !facility.hasSoundSystem) return false;

      return true;
    });
  }, [processedRooms, searchQuery, minCapacity, venueTypeFilter, filterProjector, filterComputers, filterAC, filterSound]);

  const availableCount = filteredRooms.filter(r => r.status === 'Available').length;
  const occupiedCount = filteredRooms.filter(r => r.status === 'Occupied').length;
  const maintenanceCount = filteredRooms.filter(r => r.status === 'Under Maintenance').length;

  return (
    <div className="space-y-6 pb-12 font-system">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Room Availability
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {availableCount} Open Now
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Campus lecture halls, seminar rooms, and computer labs
          </p>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            {availableCount} Available
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold">
            {occupiedCount} Occupied
          </span>
          {maintenanceCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border border-zinc-500/20 font-semibold">
              {maintenanceCount} Maintenance
            </span>
          )}
        </div>
      </div>

      {/* 2. Filter Controls (Admin Style) */}
      <div className="p-4 sm:p-5 rounded-3xl liquid-glass border border-zinc-200/70 dark:border-white/10 space-y-4">
        
        {/* Row 1: Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Day Selector */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as any)}
              className="w-full glass-input px-3 py-2 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>

          {/* Time Slot Selector */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <select
              value={selectedTimeSlot}
              onChange={(e) => setSelectedTimeSlot(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {/* Minimum Capacity */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Minimum Capacity
            </label>
            <select
              value={minCapacity}
              onChange={(e) => setMinCapacity(parseInt(e.target.value))}
              className="w-full glass-input px-3 py-2 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={0}>Any Capacity</option>
              <option value={50}>50+ Seats</option>
              <option value={100}>100+ Seats</option>
              <option value={150}>150+ Seats</option>
              <option value={200}>200+ Seats</option>
              <option value={300}>300+ Seats</option>
            </select>
          </div>

          {/* Venue Type */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Venue Type
            </label>
            <select
              value={venueTypeFilter}
              onChange={(e) => setVenueTypeFilter(e.target.value)}
              className="w-full glass-input px-3 py-2 text-xs text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {venueTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Search Query & Amenities */}
        <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter venue or building..."
              className="w-full glass-input pl-8.5 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white rounded-xl placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Amenity Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mr-1 uppercase tracking-wider">
              Amenities:
            </span>

            <button
              type="button"
              onClick={() => setFilterProjector(!filterProjector)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterProjector
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              Projector
            </button>

            <button
              type="button"
              onClick={() => setFilterComputers(!filterComputers)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterComputers
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              Computers
            </button>

            <button
              type="button"
              onClick={() => setFilterAC(!filterAC)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterAC
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              AC
            </button>

            <button
              type="button"
              onClick={() => setFilterSound(!filterSound)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterSound
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              Audio
            </button>
          </div>
        </div>

      </div>

      {/* 3. Venue Table (Admin Liquid Glass Style) */}
      <div className="liquid-glass rounded-3xl border border-zinc-200/70 dark:border-white/10 overflow-hidden">
        {filteredRooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-zinc-200/60 dark:border-white/10 text-zinc-500 dark:text-zinc-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-5">Venue & Building</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Capacity</th>
                  <th className="py-3 px-4">Amenities</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
                {filteredRooms.map(({ facility, status, conflictSchedule }) => (
                  <tr 
                    key={facility.hallId}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Venue & Location */}
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {facility.hallName}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {facility.buildingLocation}
                      </div>
                    </td>

                    {/* Venue Type */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                      {facility.venueType}
                    </td>

                    {/* Capacity */}
                    <td className="py-3.5 px-4 text-center font-bold text-zinc-900 dark:text-white">
                      {facility.capacity}
                    </td>

                    {/* Amenities */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {facility.hasProjector && (
                          <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-medium">
                            Projector
                          </span>
                        )}
                        {facility.hasComputers && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-medium">
                            {facility.computerCount ? `${facility.computerCount} PCs` : 'Computers'}
                          </span>
                        )}
                        {facility.hasAC && (
                          <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-medium">
                            AC
                          </span>
                        )}
                        {facility.hasSoundSystem && (
                          <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-medium">
                            Audio
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4">
                      {status === 'Available' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Available
                        </span>
                      )}

                      {status === 'Occupied' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Occupied
                          </span>
                          {conflictSchedule && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[180px]">
                              {conflictSchedule.courseCode} ({conflictSchedule.lecturerName.split(' ').slice(-1)[0]})
                            </p>
                          )}
                        </div>
                      )}

                      {status === 'Under Maintenance' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                          Maintenance
                        </span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 sm:px-5 text-right">
                      {status === 'Available' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedFacilityForBooking(facility)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Request</span>
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
                          Unavailable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No matching venues found for the selected criteria.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Try adjusting the capacity threshold, amenities, or time slot.
            </p>
          </div>
        )}
      </div>

      {/* 4. Booking Request Modal */}
      {selectedFacilityForBooking && (
        <RoomBookingModal
          isOpen={true}
          onClose={() => setSelectedFacilityForBooking(null)}
          facility={selectedFacilityForBooking}
          defaultDay={selectedDay}
          defaultSlot={selectedTimeSlot}
          courses={courses}
          onSubmit={async (req) => {
            await onAddBookingRequest(req);
            setSelectedFacilityForBooking(null);
          }}
        />
      )}

    </div>
  );
}
