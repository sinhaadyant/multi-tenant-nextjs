"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EnhancedTicketList } from '@/components/support-tickets/EnhancedTicketList';
import { EnhancedTicketDetails } from '@/components/support-tickets/EnhancedTicketDetails';
import { EnhancedTicketForm } from '@/components/support-tickets/EnhancedTicketForm';
import { useSupportTicket, useDeleteSupportTicket, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/Card';
import { XCircle } from 'lucide-react';

type ViewMode = 'list' | 'details' | 'create' | 'edit';

export default function TenantSupportTicketsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { success, error } = useToast();
  const { hasAnyPermission } = usePermissions();
  const deleteTicketMutation = useDeleteSupportTicket();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Check if user has any support permissions
  if (!hasAnyPermission('support')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Access Denied
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have permission to access support tickets.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <EnhancedTicketForm
              mode="create"
            />
          </div>
        </div>
      );

    case 'edit':
      return selectedTicket ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <EnhancedTicketForm
              ticket={selectedTicket}
              mode="edit"
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'details':
      return selectedTicket ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <EnhancedTicketDetails
              ticket={selectedTicket}
              onEditTicket={handleEditTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <EnhancedTicketList
              onViewTicket={handleViewTicket}
              onEditTicket={handleEditTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          </div>
        </div>
      );
  }
}
