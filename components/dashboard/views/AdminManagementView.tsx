'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building, 
  Mail, 
  Lock, 
  Shield, 
  Key,
  Check,
  Trash2,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminUserRecord } from '@/lib/adminAuthService';
import { DeleteConfirmationModal } from '@/components/dashboard/modals/DeleteConfirmationModal';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';

export function AdminManagementView() {
  const { user, createAdmin, updateAdminRole, deleteAdminAccount, getAdministrators } = useAuth();
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Form State for Provisioning Admin
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [institution, setInstitution] = useState('University of Ghana');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Updating role state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Delete Admin State
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fetchAdminList = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const records = await getAdministrators();
      setAdmins(records);
    } catch (err: any) {
      setListError(err?.message || 'Failed to load administrator records.');
    } finally {
      setIsLoadingList(false);
    }
  }, [getAdministrators]);

  useEffect(() => {
    fetchAdminList();
  }, [fetchAdminList]);

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!fullName.trim()) {
      setFormError('Please provide the administrator’s full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid academic or institutional email address.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters in length.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAdmin({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        institution: institution.trim() || 'University of Ghana'
      });

      if (result.success) {
        setFormSuccess(`Administrator account for ${fullName} (${email}) provisioned successfully.`);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('admin');
        await fetchAdminList();
        setTimeout(() => {
          setShowProvisionModal(false);
          setFormSuccess(null);
        }, 2000);
      } else {
        setFormError(result.error || 'Failed to create administrator account.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Unexpected error creating administrator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRole = async (targetAdmin: AdminUserRecord) => {
    const isPrimarySuperAdmin = targetAdmin.email.toLowerCase() === 'charlestonkyeremeh6@gmail.com';
    if (isPrimarySuperAdmin) {
      setDeleteError('The primary system Super Administrator privilege cannot be modified.');
      setTimeout(() => setDeleteError(null), 4000);
      return;
    }

    const nextRole: 'admin' | 'super_admin' = targetAdmin.role === 'super_admin' ? 'admin' : 'super_admin';
    setUpdatingId(targetAdmin.id);
    try {
      const res = await updateAdminRole(targetAdmin.id, nextRole);
      if (res.success) {
        await fetchAdminList();
      } else {
        setDeleteError(res.error || 'Failed to update administrator role.');
        setTimeout(() => setDeleteError(null), 4000);
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Error modifying administrator role.');
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteAdminAccount(deletingAdmin.id);
      if (res.success) {
        setDeleteSuccess(`Administrator ${deletingAdmin.name} (${deletingAdmin.email}) deleted successfully.`);
        setAdmins(prev => prev.filter(a => a.id !== deletingAdmin.id));
        setTimeout(() => setDeleteSuccess(null), 4000);
      } else {
        setDeleteError(res.error || 'Failed to delete administrator account.');
        setTimeout(() => setDeleteError(null), 4000);
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Error deleting administrator account.');
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setIsDeleting(false);
      setDeletingAdmin(null);
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Restricted Access</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
          Administrator management is restricted to Super Administrators. Please contact the lead university scheduling administrator if you require elevated privileges.
        </p>
      </div>
    );
  }

  const superAdminCount = admins.filter(a => a.role === 'super_admin').length;
  const standardAdminCount = admins.filter(a => a.role === 'admin').length;

  return (
    <div className="w-full space-y-6">
      {/* 1. Centered Bold Page Heading (Requirement 12, 13, 14) */}
      <div className="text-center py-2 shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center">
          Administrators
        </h1>
      </div>

      {/* Controls and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Manage administrative access, privilege levels, and provision secure institutional accounts
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="refresh-admins-btn"
            onClick={fetchAdminList}
            disabled={isLoadingList}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="open-create-admin-btn"
            onClick={() => {
              setShowProvisionModal(true);
              setFormError(null);
              setFormSuccess(null);
            }}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
            title="Add Administrator"
            aria-label="Add Administrator"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total Administrators</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {admins.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Super Administrators</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {superAdminCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Standard Administrators</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {standardAdminCount}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {deleteSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {deleteError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Administrators Table Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Active Administrators</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Super administrators can create accounts, adjust privilege tiers, and manage identities
          </p>
        </div>

        {listError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{listError}</span>
          </div>
        )}

        {isLoadingList ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600 dark:text-zinc-400 mb-2" />
            <p className="text-xs font-medium">Loading administrator directory...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No administrators found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 px-3">Administrator</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Institution</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {admins.map((adm) => {
                  const isPrimary = adm.email.toLowerCase() === 'charlestonkyeremeh6@gmail.com';
                  const isSelf = user?.id === adm.id;
                  const isUpdating = updatingId === adm.id;

                  return (
                    <tr key={adm.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-semibold text-xs text-zinc-800 dark:text-zinc-200 shrink-0">
                            {adm.name ? adm.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 dark:text-white truncate">
                                {adm.name}
                              </span>
                              {isPrimary && (
                                <span className="text-[10px] text-zinc-500 font-medium">
                                  (Primary)
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  (You)
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                              {adm.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {adm.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-xs text-zinc-600 dark:text-zinc-400">
                        {adm.institution || 'University of Ghana'}
                      </td>

                      <td className="py-3 px-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPrimary ? (
                            <span className="text-xs text-zinc-400 italic">Protected</span>
                          ) : (
                            <>
                              <button
                                id={`toggle-role-${adm.id}`}
                                onClick={() => handleToggleRole(adm)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <span className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Updating...
                                  </span>
                                ) : adm.role === 'super_admin' ? (
                                  'Demote to Admin'
                                ) : (
                                  'Promote to Super Admin'
                                )}
                              </button>

                              {!isSelf && (
                                <button
                                  id={`delete-admin-${adm.id}`}
                                  onClick={() => setDeletingAdmin(adm)}
                                  className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                  title={`Delete administrator ${adm.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Admin Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Provision Administrator</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Create an institutional administrator account with secure Firebase credentials.
                  </p>
                </div>
              </div>
              <button
                id="close-provision-modal-btn"
                onClick={() => setShowProvisionModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Kwesi Mensah"
                    className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Academic Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ug.edu.gh"
                    className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Temporary Password (Min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-password-input"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Institution / Affiliation
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-institution-input"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="University of Ghana"
                    className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Privilege Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      role === 'admin'
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">Admin</span>
                      {role === 'admin' && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Schedules, lecture halls, courses, and timetables.
                    </p>
                  </div>

                  <div
                    onClick={() => setRole('super_admin')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      role === 'super_admin'
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">Super Admin</span>
                      {role === 'super_admin' && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      All privileges plus administrator management.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-provision-admin-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 rounded-xl transition-all cursor-pointer disabled:opacity-75 select-none"
                >
                  <LoadingButtonContent
                    loading={isSubmitting}
                    loadingText="Provisioning"
                    defaultText="Create Administrator"
                    icon={<Key className="w-3.5 h-3.5" />}
                  />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {deletingAdmin && (
        <DeleteConfirmationModal
          isOpen={!!deletingAdmin}
          onClose={() => setDeletingAdmin(null)}
          onConfirm={handleConfirmDeleteAdmin}
          title="Delete Administrator Account"
          itemName={`${deletingAdmin.name} (${deletingAdmin.email})`}
          itemType="administrator"
          description={`Are you sure you want to permanently delete the administrator account for ${deletingAdmin.name}? Their authentication access and administrative privileges will be revoked immediately.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
