'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Building2, 
  Users, 
  CalendarDays, 
  LogOut,
  X,
  Loader2,
  ShieldCheck,
  Compass,
  Settings
} from 'lucide-react';
import { useTimetable, DashboardViewType } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTour } from '@/context/TourContext';
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
  const { startTour, forceSidebarExpand } = useTour();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDark = mounted ? theme === 'dark' : false;
  const router = useRouter();

  const handleStartTour = () => {
    if (activeView !== 'dashboard') {
      setActiveView('dashboard');
    }
    startTour();
    if (onCloseMobile) onCloseMobile();
  };

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
  }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen, badge: analytics.kpi.totalCourses },
    { id: 'facilities', label: 'Facilities', icon: Building2, badge: analytics.kpi.totalFacilities },
    { id: 'lecturers', label: 'Lecturers', icon: Users, badge: analytics.kpi.totalLecturers },
    { id: 'generated_timetables', label: 'Schedule', icon: CalendarDays, badge: analytics.kpi.successfullyScheduled > 0 ? `${analytics.kpi.successfullyScheduled}` : undefined },
    ...(user?.role === 'super_admin' ? [
      { id: 'admin_management' as DashboardViewType, label: 'Admins', icon: ShieldCheck }
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getTourDataAttribute = (id: DashboardViewType) => {
    switch (id) {
      case 'courses': return 'sidebar-courses';
      case 'lecturers': return 'sidebar-lecturers';
      case 'facilities': return 'sidebar-facilities';
      case 'generated_timetables': return 'sidebar-schedules';
      case 'admin_management': return 'sidebar-admins';
      case 'settings': return 'sidebar-settings';
      default: return undefined;
    }
  };

  const handleNavClick = (view: DashboardViewType) => {
    setActiveView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = async () => {
    if (isSigningOut || authIsSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/?loggedOut=true');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsSigningOut(false);
    }
  };

  // Render sidebar content (structured with flex-col: top header, scrollable middle nav, anchored bottom sign-out)
  const renderSidebarContent = (isExpanded: boolean, isMobileView: boolean = false) => (
    <div className="w-full h-full glass-sidebar flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-2xl">
      
      {/* Top Section: Brand Logo & Close button */}
      <div className="p-3 sm:p-3.5 border-b border-zinc-200/60 dark:border-white/10 shrink-0">
        <div className={`flex items-center min-h-[36px] ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          <div className={`flex items-center min-w-0 overflow-hidden ${isExpanded ? 'gap-2.5' : 'justify-center w-full'}`}>
            <SchedulaLogo size="md" isDark={isDark} showText={isExpanded} textColor={isDark ? 'text-zinc-50' : 'text-zinc-900'} />
          </div>
          
          {/* Close button on mobile only */}
          {isMobileView && (
            <button 
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle: Navigation Items (Scrolls smoothly if height is limited) */}
      <div 
        data-tour="admin-nav" 
        className="flex-1 flex flex-col justify-start gap-1 sm:gap-1.5 px-2 sm:px-3 py-2.5 min-h-0 overflow-y-auto custom-scrollbar"
      >
        <div className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0 h-4 flex items-center justify-center mb-1">
          <span className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            Navigation
          </span>
          {!isExpanded && (
            <div className="w-5 h-[2px] bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto" />
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              data-tour={getTourDataAttribute(item.id)}
              onClick={() => handleNavClick(item.id)}
              title={!isExpanded ? item.label : undefined}
              className={`
                w-full flex items-center transition-all duration-200 group cursor-pointer shrink-0 rounded-2xl select-none
                ${isExpanded 
                  ? `px-2.5 py-2 justify-between ${
                      isActive 
                        ? 'bg-zinc-200/70 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold border border-zinc-300/60 dark:border-white/15 shadow-2xs' 
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                    }`
                  : 'p-0 justify-center bg-transparent border-transparent'
                }
              `}
            >
              {/* Left Group: Icon + Label */}
              <div className={`flex items-center min-w-0 ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                <div 
                  className={`
                    flex items-center justify-center shrink-0 transition-colors
                    ${isExpanded ? 'w-5 h-5' : 'w-10.5 h-10.5 rounded-xl'}
                    ${isActive
                      ? 'text-zinc-950 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0 stroke-[1.85]" />
                </div>

                <div className={`sidebar-text-reveal text-left ${isExpanded ? 'sidebar-text-expanded opacity-100 visible' : 'sidebar-text-collapsed opacity-0 hidden'}`}>
                  <span className={`truncate block text-xs sm:text-[13px] ${isActive ? 'font-semibold text-zinc-900 dark:text-white' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </div>
              </div>

              {/* Right Group: Badge Count */}
              {item.badge !== undefined && (
                <div className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
                  <span className={`text-xs font-semibold ml-1.5 ${
                    isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {item.badge}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Anchored User Profile & ALWAYS VISIBLE Sign Out */}
      <div className="p-2.5 sm:p-3 border-t border-zinc-200/70 dark:border-white/10 bg-black/5 dark:bg-black/20 shrink-0 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div 
          onClick={() => {
            setActiveView('settings');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`flex items-center p-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer group ${isExpanded ? 'gap-3 px-2 py-1.5' : 'justify-center w-full'}`}
          title={!isExpanded ? (user?.name || 'Administrator') : 'Manage account'}
        >
          {user?.avatar ? (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-2xs flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt={user.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
            </div>
          )}
          
          <div className={`sidebar-text-reveal min-w-0 flex-1 ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator')}
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
              {user?.email || 'admin@ug.edu.gh'}
            </p>
          </div>
        </div>

        {/* TAKE A TOUR BUTTON */}
        <button
          id="sidebar-tour-button"
          data-tour="sidebar-tour-btn"
          type="button"
          onClick={handleStartTour}
          title={!isExpanded ? 'Take a tour' : undefined}
          aria-label="Take a tour"
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 active:scale-98 transition-all cursor-pointer ${
            isExpanded ? 'px-3 py-2 justify-start gap-2.5' : 'p-0 justify-center h-10'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0 stroke-[2]" />
          <div className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            <span>Take a tour</span>
          </div>
        </button>

        {/* ALWAYS ACCESSIBLE SIGN OUT BUTTON */}
        <button
          id="sidebar-logout-button"
          onClick={handleLogout}
          disabled={isSigningOut || authIsSigningOut}
          title={!isExpanded ? 'Sign Out' : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 active:scale-98 transition-all cursor-pointer disabled:opacity-60 ${
            isExpanded ? 'px-3 py-2 justify-start gap-2.5' : 'p-0 justify-center h-10'
          }`}
        >
          {isSigningOut || authIsSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <LogOut className="w-4 h-4 shrink-0" />
          )}
          <div className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            <span>{isSigningOut || authIsSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </div>
        </button>
      </div>
    </div>
  );

  const isMobileDrawerActive = mobileOpen || (forceSidebarExpand && typeof window !== 'undefined' && window.innerWidth < 1024);

  return (
    <>
      {/* =================================================================== */}
      {/* 1. Mobile Drawer Navigation (< 1024px)                              */}
      {/* =================================================================== */}
      {isMobileDrawerActive && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 lg:hidden backdrop-blur-md transition-opacity duration-200 animate-in fade-in no-print cursor-pointer"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside 
        id="admin-sidebar-mobile"
        data-tour="sidebar"
        className={`
          no-print fixed top-0 left-0 h-[100dvh] max-h-[100dvh] z-50 lg:hidden
          w-72 max-w-[85vw] p-2.5 sm:p-3 shrink-0
          flex flex-col transition-transform duration-250 ease-out
          ${isMobileDrawerActive 
            ? 'translate-x-0 shadow-2xl' 
            : '-translate-x-full pointer-events-none invisible'
          }
        `}
      >
        {renderSidebarContent(true, true)}
      </aside>

      {/* =================================================================== */}
      {/* 2. Desktop Floating Overlay Sidebar (>= 1024px)                     */}
      {/* =================================================================== */}
      <div 
        className="hidden lg:block w-[88px] shrink-0 h-screen relative z-40 no-print"
        aria-label="Desktop Sidebar Container"
      >
        <aside 
          id="admin-sidebar"
          data-tour="sidebar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            if (!forceSidebarExpand) {
              setIsHovered(false);
            }
          }}
          className={`
            absolute top-0 left-0 h-screen p-3 z-40 pointer-events-auto
            sidebar-overlay-container transition-all duration-200 ease-in-out
            ${(isHovered || forceSidebarExpand) ? 'w-72 shadow-2xl' : 'w-[88px] shadow-lg'}
          `}
        >
          {renderSidebarContent(isHovered || forceSidebarExpand, false)}
        </aside>
      </div>
    </>
  );
}
