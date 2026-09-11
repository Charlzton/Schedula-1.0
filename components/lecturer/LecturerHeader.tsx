'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Search, 
  User as UserIcon, 
  ChevronDown, 
  LogOut, 
  Settings,
  Loader2
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
  const { user, lecturerProfile, signOut, isSigningOut } = useAuth();
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
    router.replace('/?loggedOut=true');
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
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              {displayName}
            </h2>
            {displayTitle && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate -mt-0.5">
                {displayTitle} {staffId ? `• ID: ${staffId}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Right Area: Search, Theme Toggle, Settings, Notification, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Quick Search */}
          {onSearchChange && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 bg-white/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 xs:w-36 sm:w-48 transition-all"
              />
            </div>
          )}

          {/* Theme Toggle (Header Placement) */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
            id="lecturer-header-theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-zinc-300" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              if (onOpenProfileModal) {
                onOpenProfileModal();
              } else {
                setActiveView('settings');
              }
            }}
            aria-label="Settings"
            title="Settings"
            className={`p-1.5 sm:p-2 rounded-xl transition-colors focus:outline-none cursor-pointer ${
              activeView === 'settings'
                ? 'text-blue-600 dark:text-blue-400 bg-black/5 dark:bg-white/10 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            id="lecturer-header-settings-button"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <NotificationBell 
            variant="lecturer" 
            onNavigateToRequests={() => setActiveView('requests')} 
          />

          {/* Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center text-xs font-semibold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
            </button>

            {/* Dropdown Card */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-24px)] glass-modal rounded-2xl p-3 border border-zinc-200/80 dark:border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                {/* User Info Header */}
                <div className="p-2 border-b border-zinc-200/60 dark:border-white/10 mb-2 flex items-center gap-3">
                  {user?.avatar ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-500/30 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user?.email || 'faculty@ug.edu.gh'}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {displayTitle}
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="py-1 space-y-1">
                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <span>Manage Profile</span>
                  </button>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10">
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
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
