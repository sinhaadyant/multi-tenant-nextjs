"use client";

import React from 'react';
import TenantSupportTicketForm from '@/components/tenant/support/TenantSupportTicketForm';

export default function NewSupportTicketPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <TenantSupportTicketForm mode="create" />
      </div>
    </div>
  );
}
