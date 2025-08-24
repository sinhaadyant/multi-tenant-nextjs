"use client";

import React from 'react';
import TenantSupportTicketList from '@/components/tenant/support/TenantSupportTicketList';
import { useToast } from '@/hooks/useToast';
import Head from 'next/head';

export default function TenantSupportTicketsPage() {
  const { success, error } = useToast();

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
