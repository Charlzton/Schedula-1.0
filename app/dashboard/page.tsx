'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, isSigningOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !isSigningOut) {
      router.replace('/login');
    }
  }, [user, isLoading, isSigningOut, router]);

  if (isLoading && !isSigningOut) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0B0E] flex flex-col items-center justify-center text-[#121212] dark:text-[#F4F4F6]">
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#121318] shadow-lg border border-gray-200/80 dark:border-[#222430]">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Loading Schedula dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user && !isSigningOut) {
    return null; // Redirecting to login
  }

  return <AdminDashboard />;
}
