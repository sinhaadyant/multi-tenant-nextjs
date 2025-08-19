"use client";

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { TicketDetails } from '@/components/support-tickets/TicketDetails';
import { TicketForm } from '@/components/support-tickets/TicketForm';
import { useSupportTicket, useDeleteSupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';

type ViewMode = 'details' | 'edit';

export default function TenantSupportTicketDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error } = useToast();
  const deleteTicketMutation = useDeleteSupportTicket();

  const tenantSlug = params.tenantSlug as string;
  const ticketId = params.id as string;
  const initialMode = searchParams.get('mode') as ViewMode || 'details';
  const [viewMode, setViewMode] = React.useState<ViewMode>(initialMode);

  const { data: ticketData, isLoading, error: ticketError } = useSupportTicket(ticketId);

  const handleEditTicket = () => {
    setViewMode('edit');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      success('Support ticket deleted successfully!');
      router.push(`/${tenantSlug}/support-tickets`);
    } catch (err: any) {
      error(err.message || 'Failed to delete ticket');
    }
  };

  const handleBackToDetails = () => {
    setViewMode('details');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading ticket...</span>
          </div>
        </div>
      </div>
    );
  }

  if (ticketError || !ticketData?.ticket) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Ticket</h2>
            <p className="text-red-600">
              {ticketError?.message || 'Failed to load support ticket. Please try again.'}
            </p>
            <button
              onClick={() => router.push(`/${tenantSlug}/support-tickets`)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ticket = ticketData.ticket;

  if (viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <TicketForm
          ticket={ticket}
          mode="edit"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TicketDetails
        ticket={ticket}
        onEditTicket={handleEditTicket}
        onDeleteTicket={handleDeleteTicket}
      />
    </div>
  );
}
