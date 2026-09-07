'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Armchair, Check, AlertCircle } from 'lucide-react';
import { generateLowestAvailableId } from '@/lib/idHelper';
import { useTimetable } from '@/context/TimetableContext';
import { LectureFacility } from '@/lib/dataset';

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFacility?: LectureFacility | null;
}

export function FacilityModal({ isOpen, onClose, initialFacility }: FacilityModalProps) {
  const { addFacility, updateFacility, facilities } = useTimetable();

  const [hallId, setHallId] = useState('');
  const [hallName, setHallName] = useState('');
  const [capacity, setCapacity] = useState(250);
  const [venueType, setVenueType] = useState<LectureFacility['venueType']>('Lecture Theatre');
  const [buildingLocation, setBuildingLocation] = useState('Department of Computer Science');
  const [hasProjector, setHasProjector] = useState(true);
  const [hasComputers, setHasComputers] = useState(false);
  const [computerCount, setComputerCount] = useState(0);
  const [hasAC, setHasAC] = useState(true);
  const [hasSoundSystem, setHasSoundSystem] = useState(true);
  const [status, setStatus] = useState<LectureFacility['status']>('Active');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFacility) {
      setHallId(initialFacility.hallId);
      setHallName(initialFacility.hallName);
      setCapacity(initialFacility.capacity ?? 250);
      setVenueType(initialFacility.venueType || 'Lecture Theatre');
      setBuildingLocation(initialFacility.buildingLocation || 'Department of Computer Science');
      setHasProjector(initialFacility.hasProjector ?? true);
      setHasComputers(initialFacility.hasComputers ?? false);
      setComputerCount(initialFacility.computerCount || 0);
      setHasAC(initialFacility.hasAC ?? true);
      setHasSoundSystem(initialFacility.hasSoundSystem ?? true);
      setStatus(initialFacility.status || 'Active');
    } else {
      setHallId(generateLowestAvailableId(facilities.map(f => f.hallId), 'H'));
      setHallName('');
      setCapacity(250);
      setVenueType('Lecture Theatre');
      setBuildingLocation('Department of Computer Science');
      setHasProjector(true);
      setHasComputers(false);
      setComputerCount(0);
      setHasAC(true);
      setHasSoundSystem(true);
      setStatus('Active');
    }
    setValidationError(null);
  }, [initialFacility, isOpen, facilities]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanName = hallName.trim();
    const cleanId = hallId.trim().toUpperCase();

    if (!cleanId) {
      setValidationError('Facility ID is required.');
      return;
    }
    if (!cleanName) {
      setValidationError('Facility name is required.');
      return;
    }
    if (!initialFacility) {
      const idExists = facilities.some(f => f.hallId.trim().toUpperCase() === cleanId);
      const nameExists = facilities.some(f => f.hallName.trim().toLowerCase() === cleanName.toLowerCase());
      if (idExists) {
        setValidationError(`A facility with ID "${cleanId}" already exists. Please use a unique ID.`);
        return;
      }
      if (nameExists) {
        setValidationError(`A facility with name "${cleanName}" already exists. Please use a unique name.`);
        return;
      }
    }
    if (capacity <= 0) {
      setValidationError('Capacity must be greater than 0 seats.');
      return;
    }

    const facilityData: LectureFacility = {
      hallId: hallId.trim().toUpperCase(),
      hallName: cleanName,
      capacity: Number(capacity),
      venueType,
      buildingLocation: buildingLocation.trim(),
      hasProjector,
      hasComputers,
      computerCount: hasComputers ? Number(computerCount) : 0,
      hasAC,
      hasSoundSystem,
      status
    };

    if (initialFacility) {
      updateFacility(initialFacility.hallId, facilityData);
    } else {
      addFacility(facilityData);
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {initialFacility ? 'Edit Facility' : 'Add Facility'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Venue ID *
              </label>
              <input
                type="text"
                required
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
                disabled={!!initialFacility}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Seating Capacity *
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Venue / Hall Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. J.N. Green Lecture Hall"
              value={hallName}
              onChange={(e) => setHallName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Facility Type
              </label>
              <select
                value={venueType}
                onChange={(e) => setVenueType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all cursor-pointer"
              >
                <option value="Lecture Theatre" className="dark:bg-zinc-900">Lecture Theatre</option>
                <option value="Lecture Hall" className="dark:bg-zinc-900">Lecture Hall</option>
                <option value="Auditorium" className="dark:bg-zinc-900">Auditorium</option>
                <option value="Computer Lab" className="dark:bg-zinc-900">Computer Lab</option>
                <option value="Seminar Room" className="dark:bg-zinc-900">Seminar Room</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all cursor-pointer"
              >
                <option value="Active" className="dark:bg-zinc-900">Active / Operational</option>
                <option value="Maintenance" className="dark:bg-zinc-900">Under Maintenance</option>
                <option value="Reserved" className="dark:bg-zinc-900">Reserved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Campus Location / Building
            </label>
            <input
              type="text"
              placeholder="e.g. UGCS Main Block"
              value={buildingLocation}
              onChange={(e) => setBuildingLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Facility Amenities Checkboxes */}
          <div className="pt-2">
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Facility Equipment & Features
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasProjector}
                  onChange={(e) => setHasProjector(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Digital Projector</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAC}
                  onChange={(e) => setHasAC(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Air Conditioning</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSoundSystem}
                  onChange={(e) => setHasSoundSystem(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">PA / Sound System</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasComputers}
                  onChange={(e) => setHasComputers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">PC Workstations</span>
              </label>
            </div>
          </div>

          {hasComputers && (
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Number of Computer Terminals
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={computerCount}
                onChange={(e) => setComputerCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialFacility ? 'Save Changes' : 'Register Facility'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
