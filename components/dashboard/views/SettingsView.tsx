'use client';

import React, { useState, useRef } from 'react';
import { 
  User as UserIcon,
  Shield, 
  Palette, 
  Sliders, 
  RotateCcw, 
  Building2, 
  Check, 
  AlertCircle, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Database,
  GraduationCap,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';

const PRESET_AVATARS = [
  {
    id: 'avatar-1',
    label: 'Academic Director',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(%23g1)"/><circle cx="60" cy="45" r="20" fill="%23ffffff"/><path d="M 22,102 C 22,76 38,68 60,68 C 82,68 98,76 98,102 Z" fill="%23ffffff"/></svg>'
  },
  {
    id: 'avatar-2',
    label: 'CS Professor',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%234338ca"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(%23g2)"/><circle cx="60" cy="45" r="20" fill="%23ffffff"/><path d="M 22,102 C 22,76 38,68 60,68 C 82,68 98,76 98,102 Z" fill="%23ffffff"/></svg>'
  },
  {
    id: 'avatar-3',
    label: 'Lead Administrator',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(%23g3)"/><circle cx="60" cy="45" r="20" fill="%23ffffff"/><path d="M 22,102 C 22,76 38,68 60,68 C 82,68 98,76 98,102 Z" fill="%23ffffff"/></svg>'
  },
  {
    id: 'avatar-4',
    label: 'Faculty Convenor',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%236d28d9"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(%23g4)"/><circle cx="60" cy="45" r="20" fill="%23ffffff"/><path d="M 22,102 C 22,76 38,68 60,68 C 82,68 98,76 98,102 Z" fill="%23ffffff"/></svg>'
  },
  {
    id: 'avatar-5',
    label: 'Research Fellow',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(%23g5)"/><circle cx="60" cy="45" r="20" fill="%23ffffff"/><path d="M 22,102 C 22,76 38,68 60,68 C 82,68 98,76 98,102 Z" fill="%23ffffff"/></svg>'
  },
  {
    id: 'avatar-6',
    label: 'Tech Specialist',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%230e7490"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(%23g6)"/><circle cx="60" cy="45" r="20" fill="%23ffffff"/><path d="M 22,102 C 22,76 38,68 60,68 C 82,68 98,76 98,102 Z" fill="%23ffffff"/></svg>'
  }
];

export function SettingsView() {
  const { 
    courses, 
    facilities, 
    lecturers, 
    timeSlots, 
    resetToDefaultDataset, 
    clearSchedules 
  } = useTimetable();
  const { user, updateUserProfile, changePassword, removeProfilePicture } = useAuth();
  const { theme, setTheme, mounted } = useTheme();

  // Tab State: 'account' | 'security' | 'appearance' | 'scheduling'
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'appearance' | 'scheduling'>('account');

  // Account form state
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security / Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dataset confirmation modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [datasetSuccess, setDatasetSuccess] = useState<string | null>(null);

  // Helper function to compress image client-side to an ultra-compact Base64 string under 2,048 characters
  // This ensures the image can be stored directly inside Firebase Auth's photoURL property,
  // making it completely persistent across sessions and devices without any external database.
  const compressToCompactBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const attemptCompress = (size: number, quality: number) => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve('');
              return;
            }
            // Draw cropped & centered square
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            
            const base64 = canvas.toDataURL('image/jpeg', quality);
            // Firebase Auth photoURL limit is 2,048 chars. We target <= 2000 chars safely.
            if (base64.length <= 2000 || size <= 32) {
              resolve(base64);
            } else {
              // Iteratively reduce dimensions and quality to fit the length limit
              attemptCompress(Math.max(32, size - 8), Math.max(0.15, quality - 0.1));
            }
          };
          // Start with a highly optimized 64x64 size and 0.5 quality
          attemptCompress(64, 0.5);
        };
        img.onerror = () => resolve('');
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle Profile Picture Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported image types validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setProfileError('Please upload a valid image file (JPG, PNG, WebP, or GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // Max 10MB original size supported since we compress
      setProfileError('Image file size must be less than 10MB.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      // Compress the image to compact base64 guaranteed to fit in Firebase Auth's photoURL
      const compactBase64 = await compressToCompactBase64(file);
      if (!compactBase64) {
        throw new Error('Failed to process and compress profile image.');
      }
      
      const res = await updateUserProfile(displayName || user?.name || 'Administrator', compactBase64);
      if (res.success) {
        setProfileSuccess('Profile picture updated successfully!');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(res.error || 'Failed to upload photo.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'An error occurred during photo processing.');
    } finally {
      setIsSavingProfile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input to allow uploading the same file again
      }
    }
  };

  // Handle Remove Profile Picture
  const handleRemovePhoto = async () => {
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const res = await removeProfilePicture();
      if (res.success) {
        setProfileSuccess('Profile picture removed.');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(res.error || 'Failed to remove photo.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to remove photo.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Select Preset Avatar
  const handleSelectPresetAvatar = async (avatarUrl: string) => {
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const res = await updateUserProfile(displayName || user?.name || 'Administrator', avatarUrl);
      if (res.success) {
        setProfileSuccess('Profile picture updated successfully!');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(res.error || 'Failed to set avatar.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to set avatar.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileError('Display name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const res = await updateUserProfile(displayName.trim(), user?.avatar);
      if (res.success) {
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(res.error || 'Failed to save profile changes.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify and retype.');
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordSuccess(res.error || 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.error || 'Failed to change password. Please check your credentials.');
    }
  };

  const handleConfirmReset = () => {
    resetToDefaultDataset();
    setDatasetSuccess('Successfully restored master University of Ghana DCIT dataset.');
    setTimeout(() => setDatasetSuccess(null), 4000);
  };

  const handleConfirmClear = () => {
    clearSchedules();
    setDatasetSuccess('All timetable grid allocations have been cleared.');
    setTimeout(() => setDatasetSuccess(null), 4000);
  };

  const userInitial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Manage your administrator account, security credentials, display theme, and university scheduling parameters
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border-white/60 dark:border-white/10 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <UserIcon className="w-4 h-4 text-blue-500" />
          <span>Manage Account</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Security</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-500" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduling')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'scheduling'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-500" />
          <span>Scheduling Preferences</span>
        </button>
      </div>

      {/* TAB 1: ACCOUNT & PROFILE */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Profile Feedback Notifications */}
          {profileSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Profile Picture Card */}
          <div className="p-6 rounded-3xl glass-panel space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-500" />
                Profile Picture
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload a customized photo from your device. This image will appear on the dashboard header, welcome banners, and activity logs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              <div className="relative">
                {user?.avatar ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/40 shadow-lg ring-2 ring-white/60 dark:ring-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg ring-2 ring-white/60 dark:ring-white/10 shrink-0">
                    {userInitial}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />

                <div className="flex items-center flex-wrap gap-2.5 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSavingProfile}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </button>

                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isSavingProfile}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Accepted formats: JPG, PNG, WebP (Max size 2MB)
                </p>
              </div>
            </div>

            {/* Quick Preset Avatars Selector */}
            <div className="pt-4 border-t border-zinc-200/60 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Or Choose an Official University Profile Avatar
                </label>
                {isSavingProfile && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Updating profile...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = user?.avatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      disabled={isSavingProfile}
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500/30'
                          : 'border-zinc-200/80 dark:border-white/10 hover:border-blue-500/50 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      title={`Select ${preset.label}`}
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-white/60 dark:border-white/10 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 truncate w-full text-center">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account Details Form */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Personal & Account Details
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Update your administrative display name and view account information
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Display Name / Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Dr. Charleston Kyeremeh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || 'admin@ug.edu.gh'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.role || 'Lead Timetable Administrator'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Affiliation / Institution
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.institution || 'University of Ghana, Legon'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-500 dark:text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {passwordSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Change Password
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Update your authentication password using Firebase secure authentication. Minimum 6 characters required.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Confirm New Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-500" />
                Theme & Interface Appearance
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Choose between Light and Dark modes. The system maintains high-contrast typography and subtle glassmorphic surfaces across both themes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Light Theme Card */}
              <div
                onClick={() => setTheme('light')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  mounted && theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                    : 'border-zinc-200/60 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Light Mode</h4>
                      <p className="text-[11px] text-zinc-500">Crisp, high-contrast academic aesthetic</p>
                    </div>
                  </div>
                  {mounted && theme === 'light' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="h-16 rounded-xl bg-zinc-100 border border-zinc-200 p-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-zinc-300" />
                  <div className="flex-1 space-y-1">
                    <div className="w-3/4 h-2 rounded bg-zinc-400" />
                    <div className="w-1/2 h-2 rounded bg-zinc-300" />
                  </div>
                </div>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => setTheme('dark')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  mounted && theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                    : 'border-zinc-200/60 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Dark Mode</h4>
                      <p className="text-[11px] text-zinc-500">Deep neutral palette with glowing accents</p>
                    </div>
                  </div>
                  {mounted && theme === 'dark' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="h-16 rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-zinc-700" />
                  <div className="flex-1 space-y-1">
                    <div className="w-3/4 h-2 rounded bg-zinc-600" />
                    <div className="w-1/2 h-2 rounded bg-zinc-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULING PREFERENCES */}
      {activeTab === 'scheduling' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {datasetSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{datasetSuccess}</span>
            </div>
          )}

          {/* Master Dataset Control */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                University Master Dataset & Backup
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Current baseline dataset includes {courses.length} courses, {facilities.length} lecture facilities, {lecturers.length} faculty members, and {timeSlots.length} standard period blocks.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                <span>Restore Master UG DCIT Dataset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Current Timetable Grid</span>
              </button>
            </div>
          </div>

          {/* Institutional Information */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                Institution & Academic Unit Profiles
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Academic unit parameters reflected on official schedule printouts and compliance exports
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  readOnly
                  value="University of Ghana, Legon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Academic Department
                </label>
                <input
                  type="text"
                  readOnly
                  value="Department of Computer Science (UGCS)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Academic Calendar
                </label>
                <input
                  type="text"
                  readOnly
                  value="2025/2026 Academic Year"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Operating Period Hours
                </label>
                <input
                  type="text"
                  readOnly
                  value="Monday – Friday (07:30 AM – 05:30 PM)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Restore Master Dataset?"
        itemType="custom changes"
        description="Are you sure you want to restore the default University of Ghana DCIT master dataset? All manual edits will be reverted to the original accredited curriculum workbook."
      />

      {/* Clear Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear Timetable Grid?"
        itemType="allocations"
        description="Are you sure you want to unassign all scheduled sessions? This will empty the active timetable matrix."
      />
    </div>
  );
}
