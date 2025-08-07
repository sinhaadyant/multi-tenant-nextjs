"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Filter, Search } from 'lucide-react';
import { useSupportTickets, useDeleteSupportTicket, SupportTicketFilters } from '@/hooks/useSupportTickets';
import SupportTicketTable from '@/components/superadmin/support/SupportTicketTable';
import SupportTicketFiltersComponent from '@/components/superadmin/support/SupportTicketFilters';
import CreateTicketModal from '@/components/superadmin/support/CreateTicketModal';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { SupportTicket } from '@/types/support';

export default function SupportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  
  // State management
  const [filters, setFilters] = useState<SupportTicketFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    priority: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // API hooks
  const { data, isLoading, error, refetch } = useSupportTickets(filters);
  const deleteMutation = useDeleteSupportTicket();

  const handleFiltersChange = (newFilters: Partial<SupportTicketFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (field: string) => {
    const newSortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: newSortOrder }));
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    router.push(`/superadmin/support/${ticket.id}`);
  };

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    confirm({
      title: 'Delete Support Ticket',
      message: `Are you sure you want to delete ticket "${ticket.title}"? This action cannot be undone and will permanently remove all ticket data and responses.`,
      confirmText: 'Delete Ticket',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(ticket.id);
          toast.success('Support ticket deleted successfully');
        } catch (error) {
          toast.error('Failed to delete support ticket');
        }
      },
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const tickets = data?.tickets || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Support Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and respond to support requests from tenants and users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      <SupportTicketFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination?.total || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Forwarded</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {tickets.filter(t => t.isForwarded).length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <SupportTicketTable
        tickets={tickets}
        isLoading={isLoading}
        pagination={pagination}
        onView={handleViewTicket}
        onDelete={handleDeleteTicket}
        onSort={handleSort}
        onPageChange={handlePageChange}
        currentSort={filters.sortBy}
        currentSortOrder={filters.sortOrder}
      />

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
} 