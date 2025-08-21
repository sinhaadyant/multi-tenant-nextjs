"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MessageSquare,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { useSuperadminSupportTickets, SupportTicketsFilters, SupportTicket } from '@/hooks/useSuperadminSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Link from 'next/link';

interface SuperAdminTicketListProps {
  onViewTicket?: (ticket: SupportTicket) => void;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const SuperAdminTicketList: React.FC<SuperAdminTicketListProps> = ({
  onViewTicket,
  onEditTicket,
  onDeleteTicket,
  className = ''
}) => {
  const router = useRouter();
  
  const [filters, setFilters] = useState<SupportTicketsFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { success } = useToast();
  const { confirm } = useConfirmModalContext();

  // Debounced search
  const debouncedFilters = useMemo(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchValue || undefined,
        page: 1 // Reset to first page when searching
      }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  React.useEffect(() => {
    return debouncedFilters();
  }, [debouncedFilters]);

  const { data, isLoading, error } = useSuperadminSupportTickets(filters);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder }));
  };

  const handleFilterChange = (key: keyof SupportTicketsFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDeleteTicket = (ticket: SupportTicket) => {
    confirm({
      title: 'Delete Support Ticket',
      message: `Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        onDeleteTicket?.(ticket.id);
        success('Support ticket has been deleted successfully.');
      }
    });
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    if (onViewTicket) {
      onViewTicket(ticket);
    } else {
      router.push(`/superadmin/support-tickets/${ticket.id}`);
    }
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    if (onEditTicket) {
      onEditTicket(ticket);
    } else {
      router.push(`/superadmin/support-tickets/${ticket.id}?mode=edit`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading support tickets</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{error.message}</div>
        </div>
      </div>
    );
  }

  const tickets = data?.tickets || [];
  const pagination = data?.pagination;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Support Tickets</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination ? `${pagination.totalCount} tickets` : `${tickets.length} tickets`}
            </p>
          </div>
          <Link
            href="/superadmin/support-tickets/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="feature-request">Feature Request</option>
                <option value="bug-report">Bug Report</option>
              </select>

              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleSort(sortBy, sortOrder as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="priority-desc">Priority High-Low</option>
                <option value="priority-asc">Priority Low-High</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tickets List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tickets.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">No support tickets found</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              {searchValue || Object.values(filters).some(v => v && v !== '') 
                ? 'Try adjusting your search or filters'
                : 'Create your first support ticket to get started'
              }
            </div>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {ticket.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {ticket.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{ticket._count?.comments || 0} replies</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Paperclip className="w-4 h-4" />
                      <span>{ticket._count?.attachments || 0} attachments</span>
                    </div>
                    <div>
                      Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </div>
                    {ticket.tenant && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>Tenant: {ticket.tenant.name}</span>
                      </div>
                    )}
                    {ticket.user && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>User: {ticket.user.name} ({ticket.user.email})</span>
                      </div>
                    )}
                    {ticket.createdBySuperAdmin && (
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span>Created by: {ticket.createdBySuperAdmin.name} ({ticket.createdBySuperAdmin.email})</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="View ticket"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTicket(ticket)}
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Edit ticket"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTicket(ticket)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} tickets
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
