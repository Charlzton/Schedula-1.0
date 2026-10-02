'use client';

import React, { useState, useRef } from 'react';
import { 
  User as UserIcon,
  Shield, 
  Check, 
  AlertCircle, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  GraduationCap,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  CheckCircle2,
  Palette,
  Building,
  Mail,
  Hash,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';
import { useTheme } from '@/context/ThemeContext';

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

export function LecturerSettingsView() {
  const { user, lecturerProfile, updateLecturerProfile, updateUserProfile, changePassword, removeProfilePicture } = useAuth();
  const { theme, setTheme, toggleTheme, mounted } = useTheme();

  // Tab State: 'account' | 'appearance' | 'security'
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'security'>('account');

  // Account form state
  const [fullName, setFullName] = useState(lecturerProfile?.fullName || user?.name || '');
  const [title, setTitle] = useState(lecturerProfile?.title || 'Lecturer');
  const [department, setDepartment] = useState(lecturerProfile?.department || 'Computer Science');
  const [officeLocation, setOfficeLocation] = useState(lecturerProfile?.officeLocation || 'Academic Block A, Room 304');
  const [lecturerId, setLecturerId] = useState(lecturerProfile?.lecturerId || user?.lecturerId || '');
  
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

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileError('Image must be smaller than 10MB.');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const res = await updateUserProfile({ avatar: file });
      if (res.success) {
        setProfileSuccess('Profile photo uploaded and stored in Cloud Storage.');
      } else {
        setProfileError(res.error || 'Failed to upload photo.');
      }
    } catch (err: unknown) {
      console.error('Failed to update avatar image:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to update photo.');
    } finally {
      setIsSavingProfile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    try {
      setIsSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      await updateUserProfile({ avatar: url });
      setProfileSuccess('Profile avatar updated.');
    } catch (err: unknown) {
      console.error('Failed to select preset avatar:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to select avatar.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      await removeProfilePicture();
      setProfileSuccess('Profile picture removed.');
    } catch (err: unknown) {
      console.error('Failed to remove profile picture:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to remove picture.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAccountProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      await updateUserProfile({ name: fullName.trim() });
      if (updateLecturerProfile) {
        await updateLecturerProfile({
          fullName: fullName.trim(),
          title: title.trim(),
          department: department.trim(),
          officeLocation: officeLocation.trim(),
          lecturerId: lecturerId.trim() || undefined
        });
      }

      setProfileSuccess('Profile information saved successfully.');
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      await changePassword(newPassword);
      setPasswordSuccess('Password successfully changed.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      console.error('Password change error:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Faculty Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your faculty profile, appearance preferences, and account security.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'account'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Faculty Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'appearance'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FACULTY PROFILE                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Avatar & Photo Card */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-white/10 p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Profile Photo
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select an academic avatar or upload your own custom photo.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Current Active Avatar */}
              <div className="relative group shrink-0">
                {user?.avatar ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'User avatar'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                {user?.avatar && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={isSavingProfile}
                    title="Remove Photo"
                    className="absolute -top-1 -right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCustomImageUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSavingProfile}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-75 select-none"
                  >
                    <LoadingButtonContent
                      loading={isSavingProfile}
                      loadingText="Uploading"
                      defaultText="Upload Custom Image"
                      icon={<Upload className="w-3.5 h-3.5" />}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Supported formats: JPG, PNG, WEBP (Max 5MB). Photo is compressed and synced across devices.
                </p>
              </div>
            </div>

            {/* Preset Avatars Selection */}
            <div className="mt-6 pt-5 border-t border-zinc-200/60 dark:border-white/10">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-3">
                Or choose an Academic Preset:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isCurrent = user?.avatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      disabled={isSavingProfile}
                      className={`relative group p-2 rounded-xl border transition-all flex flex-col items-center gap-2 text-center cursor-pointer ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-600/30'
                          : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-black/[0.01] dark:bg-white/[0.01]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 line-clamp-1">
                        {preset.label}
                      </span>
                      {isCurrent && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Profile Details Form Card */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-white/10 p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Faculty Profile Information
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Update your academic title, full name, department, and office location.
            </p>

            {profileSuccess && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccountProfile} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jane Smith"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Academic Title */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Academic Title
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Associate Professor / Senior Lecturer"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Staff / Lecturer ID */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Staff / Faculty ID
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={lecturerId}
                      onChange={(e) => setLecturerId(e.target.value)}
                      placeholder="e.g. LEC-001"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Office Location */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Office Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                      placeholder="e.g. Academic Block A, Room 304"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Email Address (Read-only) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Your institutional email is tied to your university SSO login.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-75 select-none"
                >
                  <LoadingButtonContent
                    loading={isSavingProfile}
                    loadingText="Saving"
                    defaultText="Save Faculty Profile"
                    icon={<Check className="w-4 h-4" />}
                  />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPEARANCE & THEME                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-white/10 p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Theme Mode
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select your interface visual theme. Your choice is saved locally.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  mounted && theme === 'light'
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/20 ring-2 ring-blue-600/30'
                    : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 bg-white/50 dark:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Light Mode</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Crisp high-contrast daylight layout</p>
                    </div>
                  </div>
                  {mounted && theme === 'light' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  mounted && theme === 'dark'
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/20 ring-2 ring-blue-600/30'
                    : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 bg-white/50 dark:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Dark Mode</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Deep obsidian night layout</p>
                    </div>
                  </div>
                  {mounted && theme === 'dark' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SECURITY & PASSWORD                                                */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-white/10 p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Update Password
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Ensure your faculty account is secured with a strong password.
            </p>

            {passwordSuccess && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-75 select-none"
                >
                  <LoadingButtonContent
                    loading={isChangingPassword}
                    loadingText="Updating"
                    defaultText="Update Password"
                    icon={<Shield className="w-4 h-4" />}
                  />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
