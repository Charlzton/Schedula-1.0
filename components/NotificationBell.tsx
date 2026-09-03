'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  DoorOpen, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Clock 
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationItem } from '@/lib/lecturerTypes';

interface NotificationBellProps {
  onNavigateToRequests?: () => void;
  variant?: 'admin' | 'lecturer';
}

export function NotificationBell({ onNavigateToRequests, variant }: NotificationBellProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useTimetable();
  const { user, lecturerProfile } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = variant === 'admin' || userRole.includes('admin');
  const lecturerId = lecturerProfile?.lecturerId || user?.lecturerId;
  const userEmail = user?.email?.toLowerCase();

  // Filter notifications relevant to current user role / ID
  const userNotifications = useMemo(() => {
    if (!notifications) return [];

    return notifications.filter(n => {
      if (isAdmin) {
        if (n.recipientRole === 'admin' || n.recipientRole === 'all') return true;
        if (n.recipientId === user?.id || n.recipientEmail?.toLowerCase() === userEmail) return true;
        return false;
      } else {
        if (n.recipientRole === 'lecturer' || n.recipientRole === 'all') return true;
        if (lecturerId && n.recipientId === lecturerId) return true;
        if (userEmail && n.recipientEmail?.toLowerCase() === userEmail) return true;
        return false;
      }
    });
  }, [notifications, isAdmin, lecturerId, user?.id, userEmail]);

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'booking_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'booking_rejected':
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'booking_request':
        return <DoorOpen className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'schedule_update':
      case 'system':
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-zinc-400 shrink-0" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl glass-modal border border-zinc-200/80 dark:border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[min(75vh,480px)]"
        >
          {/* Dropdown Header */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-zinc-200/50 dark:divide-white/5">
            {userNotifications.length > 0 ? (
              userNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) {
                      markNotificationRead(notification.id);
                    }
                    if (onNavigateToRequests) {
                      onNavigateToRequests();
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 sm:p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    notification.isRead 
                      ? 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02] opacity-75' 
                      : 'bg-blue-500/[0.04] dark:bg-blue-500/[0.08] hover:bg-blue-500/[0.08] dark:hover:bg-blue-500/[0.12]'
                  }`}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                      {notification.message}
                    </p>

                    {!notification.isRead && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          Unread
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(notification.id);
                          }}
                          className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-400 flex items-center justify-center mx-auto">
                  <Bell className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  No notifications
                </p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Updates on room reservations and scheduling notices will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          {userNotifications.length > 0 && (
            <div className="p-2.5 border-t border-zinc-200/60 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  userNotifications.forEach(n => deleteNotification(n.id));
                }}
                className="text-[11px] text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear list
              </button>

              {onNavigateToRequests && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToRequests();
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View all requests →
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
