'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  DoorOpen, 
  CalendarDays, 
  ClipboardList, 
  Settings,
  LogOut,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { SchedulaLogo } from '@/components/SchedulaLogo';
import { LecturerViewType } from '@/lib/lecturerTypes';

interface LecturerSidebarProps {
  activeView: LecturerViewType;
  setActiveView: (view: LecturerViewType) => void;
  pendingRequestsCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenProfileModal?: () => void;
}

export function LecturerSidebar({
  activeView,
  setActiveView,
  pendingRequestsCount = 0,
  mobileOpen = false,
  onCloseMobile,
  onOpenProfileModal
}: LecturerSidebarProps) {
  const { signOut, user, lecturerProfile, isSigningOut: authIsSigningOut } = useAuth();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === 'dark' : false;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // Prevent background body scroll when mobile menu is open
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
      if (e.key === 'Escape') onCloseMobile?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navItems: {
    id: LecturerViewType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { 
      id: 'requests', 
      label: 'Requests', 
      icon: ClipboardList, 
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined 
    },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (view: LecturerViewType) => {
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

  const displayName = lecturerProfile?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Faculty Member');
  const displayTitle = lecturerProfile?.title || 'Lecturer';
  const staffId = lecturerProfile?.lecturerId || user?.lecturerId || 'Faculty';

  const renderSidebarContent = (isExpanded: boolean, isMobileView: boolean = false) => (
    <div className="w-full h-full glass-sidebar flex flex-col justify-between overflow-hidden rounded-3xl">
      
      {/* Top Section: Brand Logo */}
      <div className="p-3 sm:p-3.5 border-b border-zinc-200/60 dark:border-white/10 shrink-0">
        <div className={`flex items-center min-h-[36px] ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          <div className={`flex items-center min-w-0 ${isExpanded ? 'gap-2.5' : 'justify-center w-full'}`}>
            <div className="w-10.5 h-10.5 rounded-xl flex items-center justify-center shrink-0">
              <SchedulaLogo size="md" isDark={isDark} showText={false} />
            </div>
            <div className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
              <div className="leading-tight">
                <span className="font-bold text-[17px] tracking-[-0.025em] text-zinc-900 dark:text-zinc-50 block">
                  Schedula
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Faculty
                </span>
              </div>
            </div>
          </div>
          
          {/* Close button on mobile only */}
          {isMobileView && (
            <button 
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle: Navigation Items */}
      <div className="flex-1 flex flex-col justify-start gap-1 sm:gap-1.5 px-2 sm:px-3 py-2.5 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0 h-4 flex items-center justify-center mb-1">
          <span className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            Faculty Portal
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
              id={`lecturer-nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              title={!isExpanded ? item.label : undefined}
              className={`
                w-full flex items-center transition-all duration-200 group cursor-pointer shrink-0 rounded-2xl select-none
                ${isExpanded 
                  ? `px-2.5 py-1.5 justify-between ${
                      isActive 
                        ? 'bg-zinc-200/70 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold border border-zinc-300/60 dark:border-white/15 shadow-2xs' 
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                    }`
                  : 'p-0 justify-center bg-transparent border-transparent'
                }
              `}
            >
              {/* Left Group: Centered Icon + Revealable Label */}
              <div className={`flex items-center min-w-0 ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                <div 
                  className={`
                    rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                    ${isExpanded ? 'w-9 h-9' : 'w-10.5 h-10.5'}
                    ${isActive
                      ? 'bg-zinc-200/80 dark:bg-white/15 text-zinc-900 dark:text-white border border-zinc-300/60 dark:border-white/20'
                      : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:bg-black/5 dark:group-hover:bg-white/10 border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0 stroke-[1.85]" />
                </div>

                <div className={`sidebar-text-reveal text-left ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
                  <span className={`truncate block text-[13px] ${isActive ? 'font-semibold text-zinc-900 dark:text-white' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </div>
              </div>

              {/* Right Group: Raw Number Count (No pill container) */}
              {item.badge !== undefined && (
                <div className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
                  <span className={`text-xs font-semibold ml-1.5 ${
                    isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {item.badge}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Current Faculty Profile & Sign Out */}
      <div className="p-2.5 sm:p-3 border-t border-zinc-200/70 dark:border-white/10 bg-black/5 dark:bg-black/20 shrink-0 space-y-2">
        <div 
          onClick={() => {
            setActiveView('settings');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`flex items-center p-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer group ${isExpanded ? 'gap-3 px-2 py-1.5' : 'justify-center w-full'}`}
          title={!isExpanded ? displayName : 'Faculty Profile & Settings'}
        >
          {user?.avatar ? (
            <div className="w-10.5 h-10.5 rounded-full overflow-hidden border border-blue-500/40 ring-1 ring-white/50 dark:ring-white/10 shrink-0 shadow-xs flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10.5 h-10.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className={`sidebar-text-reveal min-w-0 flex-1 ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {displayName}
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
              {displayTitle} {staffId ? `• ID: ${staffId}` : ''}
            </p>
          </div>
        </div>

        <button
          id="lecturer-sidebar-logout"
          onClick={handleLogout}
          disabled={isSigningOut || authIsSigningOut}
          title={!isExpanded ? 'Sign Out' : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/15 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-60 shadow-2xs ${
            isExpanded ? 'px-3.5 py-2 justify-center gap-2' : 'p-0 justify-center h-10.5'
          }`}
        >
          <div className="w-10.5 h-10.5 rounded-xl flex items-center justify-center shrink-0">
            {isSigningOut || authIsSigningOut ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin shrink-0" />
            ) : (
              <LogOut className="w-4.5 h-4.5 shrink-0" />
            )}
          </div>
          <div className={`sidebar-text-reveal ${isExpanded ? 'sidebar-text-expanded' : 'sidebar-text-collapsed'}`}>
            <span className="font-semibold">{isSigningOut || authIsSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* =================================================================== */}
      {/* 1. Mobile Drawer Navigation (< 1024px)                              */}
      {/* =================================================================== */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/75 z-50 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-in fade-in no-print cursor-pointer"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside 
        id="lecturer-sidebar-mobile"
        className={`
          no-print fixed top-0 left-0 h-screen z-50 lg:hidden
          w-72 max-w-[85vw] p-3 shrink-0
          flex flex-col transition-transform duration-300 ease-in-out
          ${mobileOpen 
            ? 'translate-x-0 shadow-2xl' 
            : '-translate-x-full pointer-events-none invisible'
          }
        `}
      >
        {renderSidebarContent(true, true)}
      </aside>

      {/* =================================================================== */}
      {/* 2. Desktop Floating Overlay Sidebar (>= 1024px)                     */}
      {/* Static 88px layout footprint prevents content reflow.               */}
      {/* =================================================================== */}
      <div 
        className="hidden lg:block w-[88px] shrink-0 h-screen relative z-40 no-print"
        aria-label="Desktop Lecturer Sidebar Container"
      >
        <aside 
          id="lecturer-sidebar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            absolute top-0 left-0 h-screen p-3 z-40 pointer-events-auto
            sidebar-overlay-container
            ${isHovered ? 'w-72 shadow-2xl' : 'w-[88px] shadow-lg'}
          `}
        >
          {renderSidebarContent(isHovered, false)}
        </aside>
      </div>
    </>
  );
}
