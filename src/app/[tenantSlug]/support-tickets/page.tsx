"use client";

import React from 'react';
import TenantSupportTicketList from '@/components/tenant/support/TenantSupportTicketList';

type ViewMode = 'list' | 'details' | 'create' | 'edit';

export default function TenantSupportTicketsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <TenantSupportTicketList />
      </div>
    </div>
  );
}
