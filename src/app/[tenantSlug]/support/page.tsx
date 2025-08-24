"use client";

import React from 'react';
import TenantSupportTicketList from '@/components/tenant/support/TenantSupportTicketList';
import { useToast } from '@/hooks/useToast';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';

export default function TenantSupportTicketsPage() {
  const { success, error } = useToast();
  const { isLoggedIn, isLoading, isFullyLoaded } = useTenantAuth();

  // Show loading state while authentication is being checked
  if (isLoading || !isFullyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show message (this should be handled by layout, but just in case)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to access support tickets.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Support Tickets | Tenant Dashboard</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <TenantSupportTicketList />
      </div>
    </>
  );
}
