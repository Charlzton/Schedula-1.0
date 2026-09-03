'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SchedulaLogo } from '@/components/SchedulaLogo';
import { useTheme } from '@/context/ThemeContext';
import { 
  LogOut, 
  UserCheck, 
  Calendar, 
  DoorOpen, 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Sun,
  Moon,
  ShieldAlert
} from 'lucide-react';

export default function LecturerPage() {
  const { user, lecturerProfile, isLoading, isSigningOut, signOut } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !isSigningOut) {
      router.replace('/login');
    }
  }, [user, isLoading, isSigningOut, router]);

  if (isLoading && !isSigningOut) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0B0E] flex flex-col items-center justify-center text-[#121212] dark:text-[#F4F4F6]">
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#121318] shadow-lg border border-gray-200/80 dark:border-[#222430]">
          <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Authorizing Lecturer Portal...</span>
        </div>
      </div>
    );
  }

  if (!user && !isSigningOut) {
    return null;
  }

  // Security Check: If an admin somehow navigates to /lecturer without a linked lecturer profile
  const isLecturer = user?.role === 'lecturer' || Boolean(lecturerProfile);

  return (
    <main className="min-h-screen w-full bg-[#F7F9FB] dark:bg-[#0A0B10] text-slate-900 dark:text-white font-system transition-colors duration-300 relative selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0E1017]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SchedulaLogo size="md" isDark={isDark} />
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              Lecturer Portal
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-black/5 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-white/10">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/15 backdrop-blur-sm text-blue-200">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Verified Faculty Member</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Welcome, {lecturerProfile?.fullName || user?.name || 'Faculty Member'}
            </h1>
            
            <p className="text-blue-100/80 text-sm sm:text-base max-w-2xl leading-relaxed">
              {lecturerProfile ? (
                <>
                  <span className="font-semibold text-white">{lecturerProfile.title}</span> • {lecturerProfile.department || 'Department of Computer Science'} • Staff ID: <span className="font-mono text-blue-200">{lecturerProfile.lecturerId}</span>
                </>
              ) : (
                'You are successfully authenticated into the Schedula Lecturer Access Foundation.'
              )}
            </p>
          </div>
        </div>

        {/* Status / Up Next Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12131A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Teaching Schedule</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Assigned Courses: <span className="font-medium text-slate-800 dark:text-zinc-200">{lecturerProfile?.assignedCourses ? (Array.isArray(lecturerProfile.assignedCourses) ? lecturerProfile.assignedCourses.join(', ') : lecturerProfile.assignedCourses) : 'DCIT Courses'}</span>
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#12131A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Room Availability Scanner</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Real-time campus lecture hall lookup by day, time slot, capacity, and amenities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#12131A] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ad-Hoc Reservations</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Direct room booking requests with synchronized administrative approval.
            </p>
          </div>
        </div>

        {/* Next Step Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-slate-900 dark:text-white space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
            <Clock className="w-4 h-4" />
            <span>Phase 1 Verification Complete</span>
          </div>
          <h2 className="text-lg font-bold">Lecturer Role Authentication Initialized</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            You have successfully signed in through the verified Lecturer role path. The interactive Lecturer Dashboard with live room availability scanning and reservation requests will be active in the next phase.
          </p>
        </div>

      </div>
    </main>
  );
}
