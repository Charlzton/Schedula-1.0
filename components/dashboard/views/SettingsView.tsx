'use client';

import React, { useState, useRef } from 'react';
import { 
  User as UserIcon,
  RotateCcw, 
  Check, 
  AlertCircle, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  Sun,
  Moon,
  Shield
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
    resetToDefaultDataset, 
    clearSchedules 
  } = useTimetable();
  const { user, updateUserProfile, changePassword, removeProfilePicture, deleteCurrentUserAccount } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();

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

  // Delete account modal state
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Dataset confirmation modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [datasetSuccess, setDatasetSuccess] = useState<string | null>(null);

  // Handle Profile Picture Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setProfileError('Please upload a valid image file (JPG, PNG, WebP, or GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileError('Image file size must be less than 10MB.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const res = await updateUserProfile(displayName || user?.name || 'Administrator', file);
      if (res.success) {
        setProfileSuccess('Profile picture updated and stored securely in Cloud Storage.');
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(res.error || 'Failed to upload photo.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'An error occurred during photo upload.');
    } finally {
      setIsSavingProfile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
        setProfileSuccess('Profile picture updated successfully');
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
        setProfileSuccess('Profile updated successfully');
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
      setPasswordSuccess(res.error || 'Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.error || 'Failed to change password.');
    }
  };

  const handleConfirmDeleteSelf = async () => {
    const isPrimarySuperAdmin = user?.email?.toLowerCase() === 'charlestonkyeremeh6@gmail.com';
    if (isPrimarySuperAdmin) {
      setDeleteAccountError('The primary system Super Administrator account cannot be deleted.');
      setIsDeleteAccountModalOpen(false);
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      const res = await deleteCurrentUserAccount();
      if (!res.success) {
        setDeleteAccountError(res.error || 'Failed to delete account.');
        setIsDeletingAccount(false);
        setIsDeleteAccountModalOpen(false);
      }
    } catch (err: any) {
      setDeleteAccountError(err?.message || 'Error deleting account.');
      setIsDeletingAccount(false);
      setIsDeleteAccountModalOpen(false);
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
  const isPrimaryAdmin = user?.email?.toLowerCase() === 'charlestonkyeremeh6@gmail.com';

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Settings
        </h2>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Manage Account
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Appearance
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Security
        </button>

        <button
          onClick={() => setActiveTab('scheduling')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'scheduling'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Scheduling Preferences
        </button>
      </div>

      {/* TAB 1: ACCOUNT & PROFILE */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Feedback Notifications */}
          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Profile Picture Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Profile Picture
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
              <div className="relative">
                {user?.avatar ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xl shrink-0">
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

                <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSavingProfile}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>

                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isSavingProfile}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  JPG, PNG, WebP up to 10MB
                </p>
              </div>
            </div>

            {/* Quick Preset Avatars Selector */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Preset Avatars
                </label>
                {isSavingProfile && (
                  <span className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1">
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
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                      title={`Select ${preset.label}`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 truncate w-full text-center">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account Details Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
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
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.role === 'super_admin' ? 'Super Administrator' : user?.role === 'admin' ? 'Academic Administrator' : 'Faculty Member'}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Institution
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.institution || 'University of Ghana'}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
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
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Interface Theme
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Customize how Schedula looks on your device. Choose between light mode and dark mode.
              </p>
            </div>

            {/* Theme Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 font-semibold'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-zinc-900 dark:text-white" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      Light Mode
                    </span>
                  </div>
                  {theme === 'light' && (
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Clean, high-contrast bright theme designed for daylight clarity and crisp text rendering.
                </p>
              </div>

              <div
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 font-semibold'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-zinc-900 dark:text-white" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      Dark Mode
                    </span>
                  </div>
                  {theme === 'dark' && (
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Deep dark theme featuring high legibility and reduced eye strain.
                </p>
              </div>
            </div>

            {/* Quick Toggle */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Quick Switch
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Currently running in <span className="font-semibold text-zinc-900 dark:text-white capitalize">{theme} Mode</span>
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all cursor-pointer"
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {deleteAccountError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{deleteAccountError}</span>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
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
                      className="w-full px-3.5 py-2 pr-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
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

          {/* Account Deletion Danger Zone */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200/60 dark:border-red-950/60 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Account Deletion
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Permanently delete your user credentials and authentication profile from the system.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                {isPrimaryAdmin ? (
                  <p className="text-xs text-zinc-400 italic">
                    The primary institutional Super Administrator account is protected from deletion.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This action will remove your authentication account immediately.
                  </p>
                )}
              </div>

              {!isPrimaryAdmin && (
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULING PREFERENCES */}
      {activeTab === 'scheduling' && (
        <div className="space-y-6">
          {datasetSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{datasetSuccess}</span>
            </div>
          )}

          {/* Master Dataset Control */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Master Dataset
              </h3>
            </div>

            <div className="pt-1 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Master Dataset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Timetable</span>
              </button>
            </div>
          </div>

          {/* Institutional Information */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
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
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  readOnly
                  value="2026/2027"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleConfirmDeleteSelf}
        title="Delete Your Account"
        itemName={user?.email || 'User Account'}
        itemType="account"
        description="Are you sure you want to delete your account? Your credentials will be permanently removed and you will be signed out immediately."
        isDeleting={isDeletingAccount}
      />

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
