"use client";

import React from 'react';
import { TicketForm } from '@/components/support-tickets/TicketForm';

export default function TenantNewSupportTicketPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TicketForm mode="create" />
    </div>
  );
}
