'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Search, 
  User, 
  ChevronDown, 
  LogOut, 
  CalendarDays,
  DoorOpen,
  ClipboardList,
  GraduationCap,
  Settings
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LecturerViewType } from '@/lib/lecturerTypes';
import { NotificationBell } from '@/components/NotificationBell';

interface LecturerHeaderProps {
  activeView: LecturerViewType;
  setActiveView: (view: LecturerViewType) => void;
  onOpenMobileMenu: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenProfileModal?: () => void;
}

export function LecturerHeader({
  activeView,
  setActiveView,
  onOpenMobileMenu,
  searchQuery = '',
  onSearchChange,
  onOpenProfileModal
}: LecturerHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, lecturerProfile, signOut } = useAuth();
  const router = useRouter();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    await signOut();
    router.replace('/login');
  };

  const displayName = lecturerProfile?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Faculty Member');
  const displayTitle = lecturerProfile?.title || 'Faculty Member';
  const staffId = lecturerProfile?.lecturerId || user?.lecturerId;

  return (
    <div className="sticky top-0 z-30 w-full px-3 sm:px-4 pt-3 sm:pt-4 pb-2 no-print">
      <div className="w-full glass-panel px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 rounded-2xl">
        
        {/* Left: Mobile Toggle & Welcome Greeting */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
          <button
            id="mobile-sidebar-toggle"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              <span>Welcome, </span>
              <span className="text-blue-600 dark:text-blue-400">{displayName}</span>
            </h1>
          </div>
        </div>

        {/* Right Area: Search, Theme Toggle, Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Quick Search */}
          {onSearchChange && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 text-zinc-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search schedule, venues..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="glass-input pl-8 sm:pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 xs:w-36 sm:w-48 md:w-56 transition-all rounded-xl"
              />
            </div>
          )}

          {/* Theme Toggle (Header Placement) */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
            id="lecturer-header-theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Settings Button */}
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              aria-label="Profile & Preferences Settings"
              title="Profile & Preferences Settings"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
              id="lecturer-header-settings-button"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Notification Bell */}
          <NotificationBell 
            variant="lecturer" 
            onNavigateToRequests={() => setActiveView('requests')} 
          />

          {/* Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="User profile options"
              aria-expanded={profileDropdownOpen}
            >
              {user?.avatar ? (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Dropdown Card */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 glass-modal rounded-2xl p-2.5 border border-zinc-200/80 dark:border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                {/* User Info Header */}
                <div className="px-2.5 py-2 border-b border-zinc-200/60 dark:border-white/10 mb-1">
                  <div className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {user?.email || 'faculty@ug.edu.gh'}
                  </div>
                  {staffId && (
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                      ID: {staffId}
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
