"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketList } from '@/components/support-tickets/TicketList';
import { TicketDetails } from '@/components/support-tickets/TicketDetails';
import { TicketForm } from '@/components/support-tickets/TicketForm';
import { useSupportTicket, useDeleteSupportTicket, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';

type ViewMode = 'list' | 'details' | 'create' | 'edit';

export default function TenantSupportTicketsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const deleteTicketMutation = useDeleteSupportTicket();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setViewMode('details');
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setViewMode('edit');
  };

  const handleCreateTicket = () => {
    setViewMode('create');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      success('Support ticket deleted successfully!');
      
      // If we're viewing the deleted ticket, go back to list
      if (viewMode === 'details' && selectedTicket?.id === ticketId) {
        setViewMode('list');
        setSelectedTicket(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete ticket');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTicket(null);
  };

  // Render based on view mode
  switch (viewMode) {
    case 'create':
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <TicketForm
            mode="create"
          />
        </div>
      );

    case 'edit':
      return selectedTicket ? (
        <div className="min-h-screen bg-gray-50 py-8">
          <TicketForm
            ticket={selectedTicket}
            mode="edit"
          />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto">
            <p>Loading...</p>
          </div>
        </div>
      );

    case 'details':
      return selectedTicket ? (
        <div className="min-h-screen bg-gray-50 py-8">
          <TicketDetails
            ticket={selectedTicket}
            onEditTicket={handleEditTicket}
            onDeleteTicket={handleDeleteTicket}
          />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto">
            <p>Loading...</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <TicketList
            onViewTicket={handleViewTicket}
            onEditTicket={handleEditTicket}
            onDeleteTicket={handleDeleteTicket}
          />
        </div>
      );
  }
}
