'use client';

import React, { useState, useRef } from 'react';
import { 
  User as UserIcon,
  Shield, 
  Sliders, 
  RotateCcw, 
  Building2, 
  Check, 
  AlertCircle, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Database,
  GraduationCap,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  CheckCircle2,
  Palette
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
  const { theme, setTheme, toggleTheme, mounted } = useTheme();

  // Tab State: 'account' | 'appearance' | 'security' | 'scheduling'
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'security' | 'scheduling'>('account');

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
    <div className="space-y-6 pb-12 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Settings
        </h2>
      </div>

      {/* Tabs Navigation (Text Only - No Icons) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border-white/60 dark:border-white/10 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Manage Account
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Appearance
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Security
        </button>

        <button
          onClick={() => setActiveTab('scheduling')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'scheduling'
              ? 'bg-white/80 dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Scheduling Preferences
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
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Profile Picture
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
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
                    <span>Upload Photo</span>
                  </button>

                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isSavingProfile}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  JPG, PNG, WebP up to 2MB
                </p>
              </div>
            </div>

            {/* Quick Preset Avatars Selector */}
            <div className="pt-4 border-t border-zinc-200/60 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Preset Avatars
                </label>
                {isSavingProfile && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Updating...
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
                Account Details
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Display Name *
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
                    Institution
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="p-6 rounded-3xl glass-panel space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Interface Theme
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Customize how Schedula looks on your device. Choose between high-contrast Light Mode or deep twilight Dark Mode.
              </p>
            </div>

            {/* Theme Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Mode Option */}
              <div
                onClick={() => setTheme('light')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                  theme === 'light'
                    ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                    : 'bg-white/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-white/90 dark:hover:bg-white/10'
                }`}
              >
                <div>
                  {/* Theme Preview Box */}
                  <div className="w-full h-24 rounded-xl bg-gradient-to-br from-white to-slate-100 border border-slate-200 p-2.5 flex flex-col justify-between shadow-inner mb-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <div className="w-12 h-2 rounded bg-slate-300" />
                      </div>
                      <div className="w-4 h-4 rounded bg-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-3/4 h-2 rounded bg-slate-800" />
                      <div className="w-1/2 h-1.5 rounded bg-slate-400" />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-8 h-3 rounded-md bg-blue-600" />
                      <div className="w-8 h-3 rounded-md bg-slate-200" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        Light Mode
                      </span>
                    </div>

                    {theme === 'light' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Clean, high-contrast bright theme designed for daylight clarity, optimal reading comfort, and crisp text rendering.
                  </p>
                </div>
              </div>

              {/* Dark Mode Option */}
              <div
                onClick={() => setTheme('dark')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
                    : 'bg-white/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-white/90 dark:hover:bg-white/10'
                }`}
              >
                <div>
                  {/* Theme Preview Box */}
                  <div className="w-full h-24 rounded-xl bg-gradient-to-br from-[#0B0B0E] to-[#161824] border border-white/10 p-2.5 flex flex-col justify-between shadow-inner mb-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <div className="w-12 h-2 rounded bg-zinc-700" />
                      </div>
                      <div className="w-4 h-4 rounded bg-zinc-800" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-3/4 h-2 rounded bg-white" />
                      <div className="w-1/2 h-1.5 rounded bg-zinc-500" />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-8 h-3 rounded-md bg-blue-500" />
                      <div className="w-8 h-3 rounded-md bg-zinc-800" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        Dark Mode
                      </span>
                    </div>

                    {theme === 'dark' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Deep twilight OLED theme featuring sleek frosted glass refraction, glowing neon highlights, and reduced eye strain.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Toggle Switch Row */}
            <div className="pt-2 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Quick Mode Switch
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Currently running in <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">{theme} Mode</span>
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
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
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Change Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
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
                    Confirm Password *
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
                      <span>Updating...</span>
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

      {/* TAB 3: SCHEDULING PREFERENCES */}
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
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Master Dataset
              </h3>
            </div>

            <div className="pt-1 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                <span>Restore Master Dataset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Timetable</span>
              </button>
            </div>
          </div>

          {/* Institutional Information */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Institution Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Institution
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
                  Department
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
                  Academic Year
                </label>
                <input
                  type="text"
                  readOnly
                  value="2025/2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Operating Hours
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
