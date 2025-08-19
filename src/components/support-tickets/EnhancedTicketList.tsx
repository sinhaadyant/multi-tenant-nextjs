"use client";

import React, { useState, useMemo, useCallback } from 'react';
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
  MoreHorizontal,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';
import { useSupportTickets, SupportTicketsFilters, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { DataTable } from '@/components/ui/DataTable';
import Button from '@/components/ui/button/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import Link from 'next/link';

interface EnhancedTicketListProps {
  onViewTicket?: (ticket: SupportTicket) => void;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const EnhancedTicketList: React.FC<EnhancedTicketListProps> = ({
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
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const { success, error } = useToast();
  const { confirm } = useConfirmModalContext();
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Check permissions
  const canCreate = hasPermission('support', 'create');
  const canRead = hasPermission('support', 'read');
  const canUpdate = hasPermission('support', 'update');
  const canDelete = hasPermission('support', 'delete');
  const canViewAll = hasPermission('support', 'viewAll');

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

  const { data, isLoading, error: fetchError, refetch } = useSupportTickets(filters);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder }));
  }, []);

  const handleFilterChange = useCallback((key: keyof SupportTicketsFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleDeleteTicket = useCallback((ticket: SupportTicket) => {
    if (!canDelete) {
      error('You do not have permission to delete support tickets');
      return;
    }

    confirm({
      title: 'Delete Support Ticket',
      message: `Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        onDeleteTicket?.(ticket.id);
        success('Support ticket has been deleted successfully.');
      }
    });
  }, [canDelete, confirm, error, onDeleteTicket, success]);

  const handleBulkDelete = useCallback(() => {
    if (!canDelete) {
      error('You do not have permission to delete support tickets');
      return;
    }

    if (selectedTickets.length === 0) {
      error('Please select tickets to delete');
      return;
    }

    confirm({
      title: 'Delete Multiple Support Tickets',
      message: `Are you sure you want to delete ${selectedTickets.length} selected ticket(s)? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        selectedTickets.forEach(ticketId => onDeleteTicket?.(ticketId));
        setSelectedTickets([]);
        success(`${selectedTickets.length} support ticket(s) have been deleted successfully.`);
      }
    });
  }, [canDelete, confirm, error, onDeleteTicket, selectedTickets, success]);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: AlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      closed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
      urgent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge className={config.color}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  }, []);

  const getCategoryBadge = useCallback((category: string) => {
    const categoryConfig = {
      general: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      technical: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      billing: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      'feature-request': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      'bug-report': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;

    return (
      <Badge className={config.color}>
        {category.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </Badge>
    );
  }, []);

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }: any) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: any) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {row.original.title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            #{row.original.id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: any) => getPriorityBadge(row.original.priority),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => getCategoryBadge(row.original.category),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'comments',
      header: 'Replies',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-4 h-4" />
          {row.original._count?.comments || 0}
        </div>
      ),
    },
    {
      accessorKey: 'attachments',
      header: 'Files',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Paperclip className="w-4 h-4" />
          {row.original._count?.attachments || 0}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const ticket = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {canRead && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTicket?.(ticket)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Details</TooltipContent>
                </Tooltip>
              )}
              
              {canUpdate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTicket?.(ticket)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Ticket</TooltipContent>
                </Tooltip>
              )}
              
              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTicket(ticket)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Ticket</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        );
      },
    },
  ], [canRead, canUpdate, canDelete, getStatusBadge, getPriorityBadge, getCategoryBadge, handleDeleteTicket, onViewTicket, onEditTicket]);

  if (!hasAnyPermission('support')) {
    return (
      <Card className={className}>
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
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Support Tickets
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and track support requests
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedTickets.length > 0 && canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedTickets.length})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {canCreate && (
            <Link href={`/${tenantSlug}/support-tickets/new`}>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
              
              <Select
                value={filters.priority || ''}
                onValueChange={(value) => handleFilterChange('priority', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
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
              
              <Select
                value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-');
                  handleSort(sortBy, sortOrder as 'asc' | 'desc');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                  <SelectItem value="priority-desc">Priority High-Low</SelectItem>
                  <SelectItem value="priority-asc">Priority Low-High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {fetchError ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Error Loading Tickets
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {fetchError.message || 'Failed to load support tickets'}
                </p>
                <Button onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data?.tickets || []}
              isLoading={isLoading}
              pagination={{
                page: filters.page || 1,
                limit: filters.limit || 10,
                totalCount: data?.pagination.totalCount || 0,
                totalPages: data?.pagination.totalPages || 0,
                hasNextPage: data?.pagination.hasNextPage || false,
                hasPrevPage: data?.pagination.hasPrevPage || false,
              }}
              onPageChange={handlePageChange}
              onSelectionChange={setSelectedTickets}
              emptyMessage="No support tickets found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
