"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
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
import { useSupportTickets, SupportTicketsFilters, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Link from 'next/link';

interface TicketListProps {
  onViewTicket?: (ticket: SupportTicket) => void;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const TicketList: React.FC<TicketListProps> = ({
  onViewTicket,
  onEditTicket,
  onDeleteTicket,
  className = ''
}) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
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

  const { data, isLoading, error } = useSupportTickets(filters);

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Open', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      general: { label: 'General', className: 'bg-gray-100 text-gray-800' },
      technical: { label: 'Technical', className: 'bg-blue-100 text-blue-800' },
      billing: { label: 'Billing', className: 'bg-green-100 text-green-800' },
      'feature-request': { label: 'Feature Request', className: 'bg-purple-100 text-purple-800' },
      'bug-report': { label: 'Bug Report', className: 'bg-red-100 text-red-800' }
    };
    return categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className={`max-w-7xl mx-auto ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-7xl mx-auto ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Tickets</h2>
          <p className="text-red-600">
            {error.message || 'Failed to load support tickets. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const tickets = data?.tickets || [];
  const pagination = data?.pagination;

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600">
              Manage and track your support requests
            </p>
          </div>
          <Link
            href={`/${tenantSlug}/support-tickets/new`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="bug-report">Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleSort(sortBy, sortOrder as 'asc' | 'desc');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">
              {searchValue || filters.status || filters.priority || filters.category
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first support ticket'
              }
            </p>
            {!searchValue && !filters.status && !filters.priority && !filters.category && (
              <Link
                href={`/${tenantSlug}/support-tickets/new`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link
                              href={`/${tenantSlug}/support-tickets/${ticket.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {ticket.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.description.length > 100
                              ? `${ticket.description.substring(0, 100)}...`
                              : ticket.description
                            }
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            {ticket._count.comments > 0 && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {ticket._count.comments} replies
                              </span>
                            )}
                            {ticket._count.attachments > 0 && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <Paperclip className="w-3 h-3 mr-1" />
                                {ticket._count.attachments} files
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status).className}`}>
                        {getStatusBadge(ticket.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority).className}`}>
                        {getPriorityBadge(ticket.priority).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(ticket.category).className}`}>
                        {getCategoryBadge(ticket.category).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/${tenantSlug}/support-tickets/${ticket.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {onEditTicket && (
                          <button
                            onClick={() => onEditTicket(ticket)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteTicket && (
                          <button
                            onClick={() => handleDeleteTicket(ticket)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
