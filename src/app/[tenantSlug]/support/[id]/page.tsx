"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TenantSupportTicketDetails from '@/components/tenant/support/TenantSupportTicketDetails';
import { useTenantSupportTicket } from '@/hooks/useTenantSupportTickets';
import { useToast } from '@/hooks/useToast';
import Head from 'next/head';
import { Loader2, AlertCircle } from 'lucide-react';

export default function TenantSupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const tenantSlug = params.tenantSlug as string;
  const { success, error } = useToast();

  // Fetch ticket data
  const { data: ticketData, isLoading, error: ticketError } = useTenantSupportTicket(tenantSlug, ticketId);

  const handleBackToList = () => {
    router.push(`/${tenantSlug}/support`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading support ticket...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (ticketError || !ticketData?.ticket) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ticket Not Found</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The support ticket you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Support Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ticket = ticketData.ticket;

  return (
    <>
      <Head>
        <title>Support Ticket Details | Tenant Dashboard</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <TenantSupportTicketDetails
          ticket={ticket}
          onBackToList={handleBackToList}
        />
      </div>
    </>
  );
}
