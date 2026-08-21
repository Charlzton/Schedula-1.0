'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Building2, 
  Users, 
  Clock, 
  CalendarDays, 
  BarChart3, 
  LogOut,
  GraduationCap,
  X,
  Loader2
} from 'lucide-react';
import { useTimetable, DashboardViewType } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { SchedulaLogo } from '@/components/SchedulaLogo';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { activeView, setActiveView, analytics } = useTimetable();
  const { signOut, user, isSigningOut: authIsSigningOut } = useAuth();
  const { theme, mounted } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isDark = mounted ? theme === 'dark' : false;
  const router = useRouter();

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navItems: { 
    id: DashboardViewType; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badge?: string | number; 
    badgeColor?: string 
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen, badge: analytics.kpi.totalCourses },
    { id: 'facilities', label: 'Lecture Facilities', icon: Building2, badge: analytics.kpi.totalFacilities },
    { id: 'lecturers', label: 'Lecturers', icon: Users, badge: analytics.kpi.totalLecturers },
    { id: 'timeslots', label: 'Time Slots', icon: Clock, badge: analytics.kpi.totalTimeSlots },
    { id: 'generated_timetables', label: 'Generated Timetables', icon: CalendarDays, badge: analytics.kpi.successfullyScheduled > 0 ? `${analytics.kpi.successfullyScheduled}` : undefined },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleNavClick = (view: DashboardViewType) => {
    setActiveView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = async () => {
    if (isSigningOut || authIsSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Mobile Glass Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/75 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-in fade-in no-print cursor-pointer"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside 
        id="admin-sidebar"
        className={`
        no-print fixed lg:static top-0 left-0 h-screen z-50 lg:z-30
        w-72 max-w-[85vw] sm:max-w-72 p-3 shrink-0
        flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen 
          ? 'translate-x-0 shadow-2xl' 
          : '-translate-x-full lg:translate-x-0 max-lg:pointer-events-none max-lg:invisible'
        }
      `}>
        {/* Glass Container - Strict overflow-hidden with no internal vertical scrolling */}
        <div className="w-full h-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 flex flex-col justify-between overflow-hidden rounded-3xl shadow-2xl">
          
          {/* Top Section: Brand Logo & Academic Context */}
          <div className="p-3 sm:p-4 lg:p-5 border-b border-zinc-200/60 dark:border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <SchedulaLogo size="md" isDark={isDark} />
              
              {/* Close button on mobile */}
              <button 
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Department Context Badge */}
            <div className="mt-2.5 sm:mt-3 px-2.5 py-1 sm:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">UGCS Dept. CS</span>
              </div>
              <span className="font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0 text-[9px] sm:text-[10px]">
                2025/26
              </span>
            </div>
          </div>

          {/* Middle: Navigation Items (Flexible layout fitting screen height without scrolling) */}
          <div className="flex-1 flex flex-col justify-evenly px-2.5 sm:px-3 py-1 sm:py-2 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
              Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 lg:py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all group cursor-pointer shrink-0
                    ${isActive 
                      ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 font-bold border border-blue-500/20' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full font-bold ${
                      item.badgeColor || (isActive ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' : 'bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom: Current Admin Profile & Logout */}
          <div className="p-3 sm:p-4 border-t border-zinc-200/70 dark:border-white/10 bg-black/5 dark:bg-black/20 shrink-0 space-y-2.5">
            <div 
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer group"
              title="Click to manage profile & settings"
            >
              {user?.avatar ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-blue-500/40 ring-1 ring-white/50 dark:ring-white/10 shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                  {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator')}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {user?.email || 'admin@ug.edu.gh'}
                </p>
              </div>
            </div>

            <button
              id="sidebar-logout-button"
              onClick={handleLogout}
              disabled={isSigningOut || authIsSigningOut}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/15 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
            >
              {isSigningOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}


