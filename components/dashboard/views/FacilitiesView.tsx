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
              Facilities
            </h2>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {facilities.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Department of Computer Science
          </p>
        </div>

        <button
          id="add-new-facility-btn"
          onClick={onOpenAddFacility}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add facility</span>
        </button>
      </div>

      {/* Success Notification */}
      {bulkSuccessMsg && (
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{bulkSuccessMsg}</span>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="facility-search-input"
              type="text"
              placeholder="Search venue name, ID, or campus location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isAllFilteredSelected ? 'Deselect all' : 'Select all'}
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
        <div className="sticky top-4 z-30 p-3 rounded-2xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 shadow-xl border border-white/20 dark:border-black/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-300 dark:text-zinc-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'facility' : 'facilities'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
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
              className={`p-5 rounded-3xl glass-panel space-y-3.5 hover:border-zinc-300 dark:hover:border-white/20 transition-all group relative ${
                isSelected ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : ''
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(facility.hallId)}
                    aria-label={`Select facility ${facility.hallName}`}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {facility.hallName}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">ID: {facility.hallId} • {facility.venueType}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleStatus(facility)}
                  className={`text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    facility.status === 'Active'
                      ? 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  title="Toggle operational status"
                >
                  {facility.status}
                </button>
              </div>

              {/* Stats & Capacity (Flattened - no nested cards) */}
              <div className="grid grid-cols-2 gap-4 py-2 border-t border-zinc-200/60 dark:border-white/10 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Capacity</span>
                  <span className="font-semibold text-zinc-900 dark:text-white mt-0.5 block">
                    {facility.capacity} seats
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 block">Weekly Scheduled</span>
                  <span className="font-semibold text-zinc-900 dark:text-white mt-0.5 block">
                    {activeSessions} sessions
                  </span>
                </div>
              </div>

              {/* Location & Amenities */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-200/60 dark:border-white/10 text-xs">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Location:</span> {facility.buildingLocation}
                </p>

                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                  {facility.hasProjector && (
                    <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-300" title="Digital Projector Available">
                      <Tv className="w-3 h-3 text-zinc-400" /> Projector
                    </span>
                  )}
                  {facility.hasAC && (
                    <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-300" title="Air Conditioned">
                      <Wind className="w-3 h-3 text-zinc-400" /> AC
                    </span>
                  )}
                  {facility.hasComputers && (
                    <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-300" title={`${facility.computerCount} Workstations`}>
                      <Monitor className="w-3 h-3 text-zinc-400" /> {facility.computerCount} PCs
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2.5 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-2 no-print">
                <button
                  onClick={() => onEditFacility(facility)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    setDeletingFacilityId(facility.hallId);
                    setDeletingFacilityName(facility.hallName);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Delete
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
