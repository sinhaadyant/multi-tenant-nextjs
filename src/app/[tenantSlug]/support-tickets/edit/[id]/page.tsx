"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import TenantSupportTicketForm from '@/components/tenant/support/TenantSupportTicketForm';

export default function EditSupportTicketPage() {
  const params = useParams();
  const ticketId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <TenantSupportTicketForm ticketId={ticketId} mode="edit" />
      </div>
    </div>
  );
}
