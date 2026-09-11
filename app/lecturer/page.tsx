'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTimetable } from '@/context/TimetableContext';
import { LecturerViewType, RoomBookingRequest } from '@/lib/lecturerTypes';
import { LecturerSidebar } from '@/components/lecturer/LecturerSidebar';
import { LecturerHeader } from '@/components/lecturer/LecturerHeader';
import { LecturerOverviewView } from '@/components/lecturer/views/LecturerOverviewView';
import { LecturerRoomAvailabilityView } from '@/components/lecturer/views/LecturerRoomAvailabilityView';
import { LecturerTeachingScheduleView } from '@/components/lecturer/views/LecturerTeachingScheduleView';
import { LecturerCoursesView } from '@/components/lecturer/views/LecturerCoursesView';
import { LecturerBookingRequestsView } from '@/components/lecturer/views/LecturerBookingRequestsView';
import { LecturerSettingsView } from '@/components/lecturer/views/LecturerSettingsView';
import { LecturerProfileModal } from '@/components/lecturer/modals/LecturerProfileModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import { HeroBackground } from '@/components/HeroBackground';
import { Loader2 } from 'lucide-react';

export default function LecturerPage() {
  const { user, lecturerProfile, isLoading, isSigningOut } = useAuth();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const router = useRouter();

  const { bookingRequests, submitBookingRequest, cancelBookingRequest } = useTimetable();

  const [activeView, setActiveView] = useState<LecturerViewType>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !user && !isSigningOut) {
      router.replace('/');
    }
  }, [user, isLoading, isSigningOut, router]);

  // Lecturer's personal booking requests (filtered by lecturerId or email)
  const myBookingRequests = useMemo(() => {
    if (!user) return [];
    const currentLecturerId = lecturerProfile?.lecturerId || user.lecturerId;
    const currentEmail = user.email?.toLowerCase();
    
    // If specific lecturer profile or userId, filter strictly to this lecturer
    return bookingRequests.filter(req => {
      if (req.userId && req.userId === user.id) return true;
      if (currentLecturerId && req.lecturerId === currentLecturerId) return true;
      if (currentEmail && req.lecturerEmail?.toLowerCase() === currentEmail) return true;
      return false;
    });
  }, [bookingRequests, lecturerProfile, user]);

  // Handler for adding a new booking request via Firestore
  const handleAddBookingRequest = useCallback(async (
    newReq: Omit<RoomBookingRequest, 'id' | 'submittedAt' | 'status'>
  ) => {
    await submitBookingRequest(newReq);
    setToastMessage(`Booking request for ${newReq.hallName} submitted for administrative review.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, [submitBookingRequest]);

  if (isLoading && !isSigningOut) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0B0E] flex flex-col items-center justify-center text-zinc-900 dark:text-zinc-100 font-system">
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl glass-panel shadow-lg border border-zinc-200/80 dark:border-white/10">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Authorizing Faculty Portal...</span>
        </div>
      </div>
    );
  }

  if (!user && !isSigningOut) {
    return null;
  }

  const pendingCount = myBookingRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="h-screen w-full flex overflow-hidden relative bg-[#F7F9FB] dark:bg-[#0A0B10] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950 font-system">
      {/* Subtle Animated Glassmorphism Background */}
      <HeroBackground isDark={isDark} subdued={true} />

      {/* Fixed Sidebar navigation */}
      <LecturerSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        pendingRequestsCount={pendingCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 min-w-0 w-full max-w-full">
        {/* Top Header (Fixed) */}
        <LecturerHeader
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenMobileMenu={() => setMobileOpen(prev => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-3 sm:mx-6 lg:mx-8 mt-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-200 shadow-xs">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:opacity-80 cursor-pointer ml-3 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Content Body (The ONLY scrollable region with strict horizontal containment) */}
        <main 
          id="lecturer-main-content" 
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 min-w-0 w-full"
        >
          <div className="max-w-7xl w-full mx-auto pb-10 min-w-0">
            {activeView === 'overview' && (
              <LecturerOverviewView
                onNavigate={setActiveView}
                bookingRequests={myBookingRequests}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
              />
            )}

            {activeView === 'rooms' && (
              <LecturerRoomAvailabilityView
                onAddBookingRequest={handleAddBookingRequest}
              />
            )}

            {activeView === 'schedule' && (
              <LecturerTeachingScheduleView />
            )}

            {activeView === 'courses' && (
              <LecturerCoursesView />
            )}

            {activeView === 'requests' && (
              <LecturerBookingRequestsView
                bookingRequests={myBookingRequests}
                onNavigate={setActiveView}
                onCancelRequest={cancelBookingRequest}
              />
            )}

            {activeView === 'settings' && (
              <LecturerSettingsView />
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Controls */}
      <ScrollToTop />

      {/* Faculty Profile Modal */}
      <LecturerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
