"use client";

import React from 'react';
import { SuperAdminTicketList } from '@/components/superadmin/support/SuperAdminTicketList';
import { useDeleteSuperadminSupportTicket } from '@/hooks/useSuperadminSupportTickets';
import { useToast } from '@/hooks/useToast';
import Head from 'next/head';

export default function SuperAdminSupportTicketsPage() {
  const { success, error } = useToast();
  const deleteTicketMutation = useDeleteSuperadminSupportTicket();

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      success('Support ticket deleted successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to delete ticket');
    }
  };

  return (
    <>
      <Head>
        <title>Support Tickets | SuperAdmin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <SuperAdminTicketList
          onDeleteTicket={handleDeleteTicket}
        />
      </div>
    </>
  );
}
