'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Search, 
  BookOpen, 
  Building2, 
  Users, 
  User as UserIcon,
  ChevronDown,
  Sliders,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NotificationBell } from '@/components/NotificationBell';
import { getLecturerDisplayName } from '@/lib/lecturerUtils';

interface DashboardHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenImportExport: () => void;
}

export function DashboardHeader({ onOpenMobileMenu, onOpenImportExport }: DashboardHeaderProps) {
  const router = useRouter();
  const { 
    activeView, 
    setActiveView,
    courses,
    facilities,
    lecturers
  } = useTimetable();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchModalOpen, setMobileSearchModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator');
  const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Filter search results
  const filteredCourses = searchQuery.trim() 
    ? courses.filter(c => c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) || c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const filteredFacilities = searchQuery.trim()
    ? facilities.filter(f => f.hallName.toLowerCase().includes(searchQuery.toLowerCase()) || f.venueType.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const filteredLecturers = searchQuery.trim()
    ? lecturers.filter(l => l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (l.department && l.department.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 3)
    : [];

  const totalResults = filteredCourses.length + filteredFacilities.length + filteredLecturers.length;

  return (
    <header className="sticky top-0 z-30 w-full px-2 sm:px-4 pt-2 sm:pt-4 pb-2 no-print">
      <div className="w-full glass-panel px-2.5 sm:px-5 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-4 rounded-2xl min-w-0">
        
        {/* Left: Mobile Toggle & Welcome Greeting */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            id="mobile-sidebar-toggle"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xs xs:text-sm sm:text-base lg:text-lg font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              <span className="hidden xs:inline text-zinc-500 dark:text-zinc-400 font-medium">Welcome, </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{formattedName}</span>
            </h1>
          </div>
        </div>

        {/* Right Area: Search, Theme Toggle, Notifications, Settings, Profile */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* Desktop Search Bar (Hidden on Mobile) */}
          <div ref={searchRef} data-tour="quick-search" className="hidden sm:block relative">
            <div className="relative flex items-center glass-input px-3 py-1.5 w-40 md:w-56 lg:w-64 transition-all">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 mr-2 shrink-0" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search schedule..."
                className="bg-transparent text-xs sm:text-sm w-full focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 min-w-0"
              />
            </div>

            {/* Desktop Live Search Results Dropdown */}
            {searchOpen && searchQuery.trim().length > 0 && (
              <div 
                id="global-search-results-dropdown"
                className="absolute top-full right-0 w-88 md:w-96 mt-2 p-3 rounded-2xl glass-modal z-50 shadow-2xl animate-in fade-in-50 zoom-in-95 max-h-[70vh] flex flex-col"
              >
                {totalResults === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </p>
                ) : (
                  <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-1 flex-1">
                    {filteredCourses.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center justify-between">
                          <span>Courses</span>
                          <span className="text-[9px] font-medium text-zinc-500">{filteredCourses.length}</span>
                        </div>
                        {filteredCourses.map(c => (
                          <div
                            key={c.courseCode}
                            onClick={() => {
                              setActiveView('courses');
                              setSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="font-semibold text-zinc-900 dark:text-white shrink-0">{c.courseCode}</span>
                              <span className="text-zinc-500 dark:text-zinc-400 truncate">{c.courseTitle}</span>
                            </div>
                            <span className="text-xs text-zinc-500 shrink-0">L{c.level}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredFacilities.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center justify-between">
                          <span>Facilities</span>
                          <span className="text-[9px] font-medium text-zinc-500">{filteredFacilities.length}</span>
                        </div>
                        {filteredFacilities.map(f => (
                          <div
                            key={f.hallId}
                            onClick={() => {
                              setActiveView('facilities');
                              setSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="font-semibold text-zinc-900 dark:text-white shrink-0">{f.hallName}</span>
                              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">({f.venueType})</span>
                            </div>
                            <span className="text-xs text-zinc-500 shrink-0">{f.capacity} seats</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredLecturers.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center justify-between">
                          <span>Faculty</span>
                          <span className="text-[9px] font-medium text-zinc-500">{filteredLecturers.length}</span>
                        </div>
                        {filteredLecturers.map(l => (
                          <div
                            key={l.lecturerId}
                            onClick={() => {
                              setActiveView('lecturers');
                              setSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="font-semibold text-zinc-900 dark:text-white truncate">{l.fullName}</span>
                            </div>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">{l.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Mobile Search Button (< 640px) */}
          <button
            type="button"
            data-tour="quick-search"
            onClick={() => setMobileSearchModalOpen(true)}
            className="sm:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Search"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Action Controls Cluster */}
          <div data-tour="header-extras" className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            id="dashboard-header-theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notification Bell */}
          <NotificationBell 
            variant="admin" 
            onNavigateToRequests={() => setActiveView('booking_requests')} 
          />

          {/* Profile / Account Icon & Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              aria-label="User profile menu"
              title="Manage Account"
              className="flex items-center gap-1 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              {user?.avatar ? (
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-blue-500/30 ring-1 ring-white/50 dark:ring-white/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {formattedName.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu (Clean & Focused on Account/Preferences) */}
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-24px)] p-3 rounded-2xl glass-modal z-50 shadow-2xl animate-in fade-in-50 zoom-in-95">
                {/* User Info Header */}
                <div className="p-2 border-b border-zinc-200/60 dark:border-white/10 flex items-center gap-3">
                  {user?.avatar ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-500/30 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {formattedName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {user?.name || formattedName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user?.email || 'admin@ug.edu.gh'}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {user?.role || 'Administrator'}
                    </span>
                  </div>
                </div>

                {/* Account Links */}
                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <span>Manage Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <span>Scheduling Preferences</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>

      {/* Mobile Search Modal Overlay (< 640px) */}
      {mobileSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm sm:hidden animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
            <div className="p-3 border-b border-zinc-200/60 dark:border-white/10 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                placeholder="Search courses, halls, faculty..."
                className="w-full text-sm bg-transparent focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
              />
              <button
                onClick={() => {
                  setMobileSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto">
              {!searchQuery.trim() ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-6">
                  Type to search courses, facilities, and lecturers.
                </p>
              ) : totalResults === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-6">
                  No matches found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredCourses.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">Courses</div>
                      {filteredCourses.map(c => (
                        <div
                          key={c.courseCode}
                          onClick={() => {
                            setActiveView('courses');
                            setMobileSearchModalOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-bold text-zinc-900 dark:text-white shrink-0">{c.courseCode}</span>
                            <span className="text-zinc-500 dark:text-zinc-400 truncate">{c.courseTitle}</span>
                          </div>
                          <span className="text-xs text-zinc-500 shrink-0">L{c.level}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredFacilities.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">Facilities</div>
                      {filteredFacilities.map(f => (
                        <div
                          key={f.hallId}
                          onClick={() => {
                            setActiveView('facilities');
                            setMobileSearchModalOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-bold text-zinc-900 dark:text-white shrink-0">{f.hallName}</span>
                          </div>
                          <span className="text-xs text-zinc-500 shrink-0">{f.capacity} seats</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredLecturers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-1">Faculty</div>
                      {filteredLecturers.map(l => (
                        <div
                          key={l.lecturerId}
                          onClick={() => {
                            setActiveView('lecturers');
                            setMobileSearchModalOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span className="font-bold text-zinc-900 dark:text-white truncate">{l.fullName}</span>
                          </div>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{l.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
