"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { SuperAdminTicketDetails } from '@/components/superadmin/support/SuperAdminTicketDetails';
import { SuperAdminTicketForm } from '@/components/superadmin/support/SuperAdminTicketForm';
import { useSuperadminSupportTicket, useDeleteSuperadminSupportTicket, SupportTicket } from '@/hooks/useSuperadminSupportTickets';
import { useToast } from '@/hooks/useToast';
import Head from 'next/head';

type ViewMode = 'details' | 'edit';

export default function SuperAdminSupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const ticketId = params.id as string;
  const { success, error } = useToast();
  const deleteTicketMutation = useDeleteSuperadminSupportTicket();

  const [viewMode, setViewMode] = useState<ViewMode>('details');

  // Check URL query parameter for edit mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'edit') {
      setViewMode('edit');
    }
  }, [searchParams]);

  // Fetch ticket data
  const { data: ticketData, isLoading, error: ticketError } = useSuperadminSupportTicket(ticketId);

  const handleEditTicket = (ticket: SupportTicket) => {
    setViewMode('edit');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      success('Support ticket deleted successfully!');
      router.push('/superadmin/support-tickets');
    } catch (err: any) {
      error(err.message || 'Failed to delete ticket');
    }
  };

  const handleBackToList = () => {
    router.push('/superadmin/support-tickets');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (ticketError || !ticketData?.ticket) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Ticket Not Found</h1>
              <p className="text-gray-600 mb-4">The support ticket you're looking for doesn't exist or you don't have permission to view it.</p>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

  // Render based on view mode
  switch (viewMode) {
    case 'edit':
      return (
        <>
          <Head>
            <title>Edit Support Ticket | SuperAdmin</title>
          </Head>
          <div className="min-h-screen bg-gray-50 py-8">
            <SuperAdminTicketForm
              ticket={ticket}
              mode="edit"
            />
          </div>
        </>
      );

    default:
      return (
        <>
          <Head>
            <title>Support Ticket Details | SuperAdmin</title>
          </Head>
          <div className="min-h-screen bg-gray-50 py-8">
            <SuperAdminTicketDetails
              ticket={ticket}
              onEditTicket={handleEditTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          </div>
        </>
      );
  }
}
