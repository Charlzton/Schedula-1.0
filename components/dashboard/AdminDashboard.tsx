'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { useTheme } from '@/context/ThemeContext';
import { DashboardOverviewView } from './views/DashboardOverviewView';
import { CoursesView } from './views/CoursesView';
import { FacilitiesView } from './views/FacilitiesView';
import { LecturersView } from './views/LecturersView';
import { TimeSlotsView } from './views/TimeSlotsView';
import { GenerateTimetableView } from './views/GenerateTimetableView';
import { GeneratedTimetablesView } from './views/GeneratedTimetablesView';
import { BookingRequestsView } from './views/BookingRequestsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AdminManagementView } from './views/AdminManagementView';

import { CourseModal } from './modals/CourseModal';
import { FacilityModal } from './modals/FacilityModal';
import { LecturerModal } from './modals/LecturerModal';
import { TimeSlotModal } from './modals/TimeSlotModal';
import { ImportExportModal } from './modals/ImportExportModal';
import { AdvancedImportModal } from './modals/AdvancedImportModal';
import { FloatingSchedulerButton } from './FloatingSchedulerButton';
import { ScrollToTop } from '@/components/ScrollToTop';
import { HeroBackground } from '@/components/HeroBackground';

import { useTimetable } from '@/context/TimetableContext';
import { Course, LectureFacility, Lecturer, TimeSlot } from '@/lib/dataset';

export function AdminDashboard() {
  const { activeView, setActiveView } = useTimetable();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcuts implementation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        // Special case: Escape to blur input
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
        case '/':
          e.preventDefault();
          document.getElementById('global-search-input')?.focus();
          break;
        case 'n':
          window.dispatchEvent(new CustomEvent('toggle-ai-scheduler'));
          break;
        case 'd':
          setActiveView('dashboard');
          break;
        case 'c':
          setActiveView('courses');
          break;
        case 'l':
          setActiveView('lecturers');
          break;
        case 'f':
          setActiveView('facilities');
          break;
        case 't':
          setActiveView('timeslots');
          break;
        case 'r':
          setActiveView('reports');
          break;
        case 'p':
        case ',':
          setActiveView('settings');
          break;
        case 'm':
          if (window.innerWidth < 1024) {
            setMobileMenuOpen(prev => !prev);
          }
          break;
        case 'escape':
          setMobileMenuOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, setMobileMenuOpen]);

  // Auto-redirect legacy 'generate' view state to dashboard overview and open floating AI panel
  useEffect(() => {
    if (activeView === 'generate') {
      setActiveView('dashboard');
      window.dispatchEvent(new CustomEvent('open-ai-scheduler'));
    }
  }, [activeView, setActiveView]);

  // Handle tour reset to overview
  useEffect(() => {
    const handleReset = () => {
      setActiveView('dashboard');
    };
    window.addEventListener('schedula-reset-to-overview', handleReset);
    return () => window.removeEventListener('schedula-reset-to-overview', handleReset);
  }, [setActiveView]);

  // Close mobile drawer on view change or viewport resize to desktop
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeView]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modal states
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAdvancedImportOpen, setIsAdvancedImportOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsAdvancedImportOpen(true);
    window.addEventListener('open-advanced-import', handleOpen);
    return () => window.removeEventListener('open-advanced-import', handleOpen);
  }, []);
  
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<LectureFacility | null>(null);

  const [lecturerModalOpen, setLecturerModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);

  const [timeSlotModalOpen, setTimeSlotModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setCourseModalOpen(true);
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setCourseModalOpen(true);
  };

  const handleEditFacility = (facility: LectureFacility) => {
    setSelectedFacility(facility);
    setFacilityModalOpen(true);
  };

  const handleAddFacility = () => {
    setSelectedFacility(null);
    setFacilityModalOpen(true);
  };

  const handleEditLecturer = (lecturer: Lecturer) => {
    setSelectedLecturer(lecturer);
    setLecturerModalOpen(true);
  };

  const handleAddLecturer = () => {
    setSelectedLecturer(null);
    setLecturerModalOpen(true);
  };

  const handleEditTimeSlot = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setTimeSlotModalOpen(true);
  };

  const handleAddTimeSlot = () => {
    setSelectedTimeSlot(null);
    setTimeSlotModalOpen(true);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden relative bg-[#F7F9FB] dark:bg-[#0A0B10] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950">
      {/* Subtle Animated Glassmorphism Background */}
      <HeroBackground isDark={isDark} subdued={true} />

      {/* Sidebar navigation (Desktop static sidebar, Mobile slide-in drawer) */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 min-w-0 w-full max-w-full">
        {/* Top Header (Fixed) */}
        <DashboardHeader 
          onOpenMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
        />

        {/* View Content Body (The ONLY scrollable region with strict horizontal containment) */}
        <main id="admin-main-content" className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 min-w-0 w-full">
          <div className="max-w-7xl w-full mx-auto pb-10 min-w-0">
            {activeView === 'dashboard' && (
              <DashboardOverviewView 
                onOpenImportExport={() => setIsImportExportOpen(true)}
                onOpenAddCourse={handleAddCourse}
                onOpenAddFacility={handleAddFacility}
              />
            )}
            {/* ... rest of views ... */}
            {activeView === 'booking_requests' && (
              <BookingRequestsView />
            )}

            {activeView === 'courses' && (
              <CoursesView 
                onOpenAddCourse={handleAddCourse}
                onEditCourse={handleEditCourse}
              />
            )}

            {activeView === 'facilities' && (
              <FacilitiesView 
                onOpenAddFacility={handleAddFacility}
                onEditFacility={handleEditFacility}
              />
            )}

            {activeView === 'lecturers' && (
              <LecturersView 
                onOpenAddLecturer={handleAddLecturer}
                onEditLecturer={handleEditLecturer}
              />
            )}

            {activeView === 'timeslots' && (
              <TimeSlotsView 
                onOpenAddTimeSlot={handleAddTimeSlot}
                onEditTimeSlot={handleEditTimeSlot}
              />
            )}

            {activeView === 'generate' && (
              <GenerateTimetableView />
            )}

            {activeView === 'generated_timetables' && (
              <GeneratedTimetablesView />
            )}

            {activeView === 'reports' && (
              <ReportsView />
            )}

            {activeView === 'settings' && (
              <SettingsView />
            )}

            {activeView === 'admin_management' && (
              <AdminManagementView />
            )}
          </div>
        </main>
      </div>


      {/* Modals */}
      <CourseModal 
        key={`course-${selectedCourse?.courseCode || 'new'}`}
        isOpen={courseModalOpen} 
        onClose={() => setCourseModalOpen(false)} 
        initialCourse={selectedCourse} 
      />

      <FacilityModal 
        key={`facility-${selectedFacility?.hallId || 'new'}`}
        isOpen={facilityModalOpen} 
        onClose={() => setFacilityModalOpen(false)} 
        initialFacility={selectedFacility} 
      />

      <LecturerModal 
        key={`lecturer-${selectedLecturer?.lecturerId || 'new'}`}
        isOpen={lecturerModalOpen} 
        onClose={() => setLecturerModalOpen(false)} 
        initialLecturer={selectedLecturer} 
      />

      <TimeSlotModal 
        key={`timeslot-${selectedTimeSlot?.slotId || 'new'}`}
        isOpen={timeSlotModalOpen} 
        onClose={() => setTimeSlotModalOpen(false)} 
        initialSlot={selectedTimeSlot} 
      />

      <ImportExportModal 
        isOpen={isImportExportOpen} 
        onClose={() => setIsImportExportOpen(false)} 
      />

      <AdvancedImportModal 
        isOpen={isAdvancedImportOpen} 
        onClose={() => setIsAdvancedImportOpen(false)} 
      />

      {/* Floating Action Controls */}
      <ScrollToTop />
      <FloatingSchedulerButton />
    </div>
  );
}
