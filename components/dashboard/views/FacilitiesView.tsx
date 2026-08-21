'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Armchair, 
  Monitor, 
  Tv, 
  Wind, 
  Volume2, 
  Edit3, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { LectureFacility } from '@/lib/dataset';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

interface FacilitiesViewProps {
  onOpenAddFacility: () => void;
  onEditFacility: (facility: LectureFacility) => void;
}

export function FacilitiesView({ onOpenAddFacility, onEditFacility }: FacilitiesViewProps) {
  const { facilities, updateFacility, deleteFacility, bulkDeleteFacilities, schedules } = useTimetable();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Single Delete modal state
  const [deletingFacilityId, setDeletingFacilityId] = useState<string | null>(null);
  const [deletingFacilityName, setDeletingFacilityName] = useState<string>('');

  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchesSearch = 
        f.hallName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.hallId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.buildingLocation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'All' || f.venueType === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => b.capacity - a.capacity);
  }, [facilities, searchTerm, typeFilter]);

  const toggleStatus = (facility: LectureFacility) => {
    const nextStatus = facility.status === 'Active' ? 'Maintenance' : 'Active';
    updateFacility(facility.hallId, { status: nextStatus });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredFacilities.map(f => f.hallId);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...allFilteredIds])));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = () => {
    if (deletingFacilityId) {
      deleteFacility(deletingFacilityId);
      setSelectedIds(prev => prev.filter(id => id !== deletingFacilityId));
      setDeletingFacilityId(null);
      setDeletingFacilityName('');
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      const count = selectedIds.length;
      bulkDeleteFacilities(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      setBulkSuccessMsg(`Successfully decommissioned ${count} selected facility/facilities.`);
      setTimeout(() => setBulkSuccessMsg(null), 4000);
    }
  };

  const isAllFilteredSelected = filteredFacilities.length > 0 && filteredFacilities.every(f => selectedIds.includes(f.hallId));

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Lecture Facilities & Computer Labs
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {facilities.length} Venues • {facilities.reduce((sum, f) => sum + f.capacity, 0).toLocaleString()} Total Seats
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Department of Computer Science & Campus Lecture Theatre Directory
          </p>
        </div>

        <button
          id="add-new-facility-btn"
          onClick={onOpenAddFacility}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Facility</span>
        </button>
      </div>

      {/* Success Notification */}
      {bulkSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{bulkSuccessMsg}</span>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl glass-panel space-y-3 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="facility-search-input"
              type="text"
              placeholder="Search venue name, ID, or campus location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/30 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>
        </div>

        {/* Venue Type Filter */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200/60 dark:border-white/10 text-xs overflow-x-auto custom-scrollbar max-w-full">
          {['All', 'Lecture Theatre', 'Lecture Hall', 'Auditorium', 'Computer Lab'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === type
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-black/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 dark:text-emerald-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'facility' : 'facilities'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Decommission Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Facilities Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map((facility) => {
          const activeSessions = schedules.filter(s => s.hallId === facility.hallId).length;
          const isSelected = selectedIds.includes(facility.hallId);

          return (
            <div
              key={facility.hallId}
              className={`p-5 rounded-3xl glass-panel space-y-4 hover:border-emerald-500/50 transition-all group relative ${
                isSelected ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : ''
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(facility.hallId)}
                    aria-label={`Select facility ${facility.hallName}`}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {facility.hallName}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">ID: {facility.hallId}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleStatus(facility)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all border ${
                    facility.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  }`}
                  title="Click to toggle operational status"
                >
                  {facility.status}
                </button>
              </div>

              {/* Stats & Capacity */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Seating Capacity</span>
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Armchair className="w-3.5 h-3.5 text-emerald-500" />
                    {facility.capacity} seats
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Weekly Scheduled</span>
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    {activeSessions} sessions
                  </span>
                </div>
              </div>

              {/* Location & Amenities */}
              <div className="space-y-2 pt-2 border-t border-zinc-200/60 dark:border-white/10 text-xs">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Location:</span> {facility.buildingLocation}
                </p>

                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                  {facility.hasProjector && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium" title="Digital Projector Available">
                      <Tv className="w-3 h-3" /> Projector
                    </span>
                  )}
                  {facility.hasAC && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium" title="Air Conditioned">
                      <Wind className="w-3 h-3" /> AC
                    </span>
                  )}
                  {facility.hasComputers && (
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium" title={`${facility.computerCount} Workstations`}>
                      <Monitor className="w-3 h-3" /> {facility.computerCount} PCs
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-2 no-print">
                <button
                  onClick={() => onEditFacility(facility)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => {
                    setDeletingFacilityId(facility.hallId);
                    setDeletingFacilityName(facility.hallName);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingFacilityId}
        onClose={() => setDeletingFacilityId(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Lecture Facility?"
        itemName={deletingFacilityName}
        itemType="facility"
        description="Are you sure you want to remove this lecture hall/lab? Any timetable slots assigned to this venue will be vacated."
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Decommission Selected Facilities?"
        itemName={`${selectedIds.length} Selected Facilities`}
        itemType="facilities"
        description={`Are you sure you want to decommission these ${selectedIds.length} selected lecture facilities? All associated timetable sessions assigned to these venues will be unassigned.`}
      />
    </div>
  );
}
