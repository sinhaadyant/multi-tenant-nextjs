"use client";

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  User,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useTenantSupportTickets, SupportTicketsFilters, SupportTicket } from '@/hooks/useTenantSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { usePermissions } from '@/hooks/usePermissions';
import Button from '@/components/ui/button/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

const TenantSupportTicketList: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, hasPermission } = useReduxAuth();
  const { hasPermission: checkPermission } = usePermissions();
  const { success, error } = useToast();
  const { confirm } = useConfirmModalContext();
  
  const [filters, setFilters] = useState<SupportTicketsFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');

  // Check permissions
  const canViewAll = hasPermission('support', 'viewAll') || checkPermission('support', 'viewAll');
  const canView = hasPermission('support', 'view') || checkPermission('support', 'view');
  const canCreate = hasPermission('support', 'create') || checkPermission('support', 'create');
  const canUpdate = hasPermission('support', 'update') || checkPermission('support', 'update');
  const canDelete = hasPermission('support', 'delete') || checkPermission('support', 'delete');

  // Update filters based on view mode
  const updatedFilters = useMemo(() => {
    const newFilters = { ...filters } as any;
    
    // If user can't view all, force to 'my' view
    if (!canViewAll) {
      setViewMode('my');
    }
    
    // Add view mode to filters
    if (viewMode === 'my') {
      newFilters.userId = user?.id;
    } else {
      delete newFilters.userId;
    }
    
    return newFilters;
  }, [filters, viewMode, canViewAll, user?.id]);

  // Fetch tickets
  const { data: ticketsData, isLoading, error: fetchError, refetch } = useTenantSupportTickets(tenantSlug, updatedFilters);

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      search: searchValue.trim() || undefined,
      page: 1
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof SupportTicketsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle ticket actions
  const handleViewTicket = (ticket: SupportTicket) => {
    router.push(`/${tenantSlug}/support/${ticket.id}`);
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    if (!canUpdate) {
      error('You do not have permission to edit support tickets');
      return;
    }
    router.push(`/${tenantSlug}/support-tickets/edit/${ticket.id}`);
  };

  const handleDeleteTicket = (ticket: SupportTicket) => {
    if (!canDelete) {
      error('You do not have permission to delete support tickets');
      return;
    }

    confirm({
      title: 'Delete Support Ticket',
      message: `Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // TODO: Implement delete API call
          success('Support ticket deleted successfully');
          refetch();
        } catch (err: any) {
          error(err.message || 'Failed to delete ticket');
        }
      }
    });
  };

  const handleCreateTicket = () => {
    if (!canCreate) {
      error('You do not have permission to create support tickets');
      return;
    }
    router.push(`/${tenantSlug}/support-tickets/new`);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchValue('');
    setViewMode('my');
  };

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Category badge styling
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'billing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'feature-request':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'bug-report':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'general':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Check if user has any support permissions
  if (!canView && !canViewAll) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Support Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track support requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {canCreate && (
            <Button
              onClick={handleCreateTicket}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <div className="flex items-center gap-4">
              {/* View Mode Dropdown */}
              {canViewAll && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
                  <Select value={viewMode} onValueChange={(value: string) => setViewMode(value as 'my' | 'all')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="my">My Tickets</SelectItem>
                      <SelectItem value="all">All Tickets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <Select
                    value={filters.priority || ''}
                    onValueChange={(value) => handleFilterChange('priority', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <Select
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="feature-request">Feature Request</SelectItem>
                      <SelectItem value="bug-report">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {ticketsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{ticketsData.stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{ticketsData.stats.open}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{ticketsData.stats.pending}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Closed</p>
                  <p className="text-2xl font-bold text-gray-600">{ticketsData.stats.closed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading support tickets...</p>
              </div>
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {fetchError?.response?.status === 401 
                    ? 'Authentication required. Please log in again.' 
                    : 'Error loading tickets'
                  }
                </p>
                {fetchError?.response?.status === 401 ? (
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="mt-2"
                  >
                    Reload Page
                  </Button>
                ) : (
                  <Button onClick={() => refetch()} variant="outline" className="mt-2">
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Comments
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {ticketsData?.tickets?.map((ticket) => {
                      // Permission check: show ticket if user can view all OR if it's their own ticket
                      const canViewTicket = canViewAll || ticket.createdBy.id === user?.id;
                      const canEditTicket = canUpdate && (canViewAll || ticket.createdBy.id === user?.id);
                      const canDeleteTicket = canDelete && (canViewAll || ticket.createdBy.id === user?.id);
                      
                      if (!canViewTicket) return null;

                      return (
                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {ticket.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {ticket.description}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Created by: {ticket.createdBy.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(ticket.category)}`}>
                              {ticket.category.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {ticket.comments?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => handleViewTicket(ticket)}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Ticket</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {canEditTicket && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        onClick={() => handleEditTicket(ticket)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Ticket</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {canDeleteTicket && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        onClick={() => handleDeleteTicket(ticket)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Ticket</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {(!ticketsData?.tickets || ticketsData.tickets.length === 0) && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No support tickets found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchValue || Object.values(filters).some(v => v && v !== '') 
                        ? 'No tickets match your current filters.'
                        : 'Get started by creating your first support ticket.'
                      }
                    </p>
                    {canCreate && (
                      <Button onClick={handleCreateTicket}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Ticket
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {ticketsData?.pagination && ticketsData.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                                         <div className="text-sm text-gray-700 dark:text-gray-300">
                       Showing {((ticketsData.pagination.page - 1) * ticketsData.pagination.limit) + 1} to{' '}
                       {Math.min(ticketsData.pagination.page * ticketsData.pagination.limit, ticketsData.pagination.total)} of{' '}
                       {ticketsData.pagination.total} results
                     </div>
                   <div className="flex items-center gap-2">
                     <Button
                       onClick={() => handlePageChange(ticketsData.pagination.page - 1)}
                       disabled={!ticketsData.pagination.hasPrev}
                       variant="outline"
                       size="sm"
                     >
                       <ChevronLeft className="w-4 h-4" />
                       Previous
                     </Button>
                     <span className="text-sm text-gray-700 dark:text-gray-300">
                       Page {ticketsData.pagination.page} of {ticketsData.pagination.totalPages}
                     </span>
                     <Button
                       onClick={() => handlePageChange(ticketsData.pagination.page + 1)}
                       disabled={!ticketsData.pagination.hasNext}
                       variant="outline"
                       size="sm"
                     >
                       Next
                       <ChevronRight className="w-4 h-4" />
                     </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantSupportTicketList;
