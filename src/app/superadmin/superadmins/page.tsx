"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Download, RefreshCw, Search, Filter, Users, UserCheck, UserX } from 'lucide-react';
import { useSuperadmins, useToggleSuperAdminStatus, useCreateSuperAdminInvite, SuperAdminFilters, SuperAdmin } from '@/hooks/useSuperadminsAPI';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { format } from 'date-fns';
import InviteSuperadminModal from '@/components/superadmin/InviteSuperadminModal';
import { useTranslation } from 'next-i18next';

// Memoized stats cards component for better performance
const StatsCards = memo(({ stats, totalSuperadmins }: { stats: any; totalSuperadmins: number }) => {
  const { t } = useTranslation('superadmin');
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('stats.totalSuperadmins')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
            <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.active')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.active}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
            <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.inactive')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.inactive}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
            <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalSuperadmins}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default function SuperadminsPage() {
  const { t } = useTranslation('superadmin');
  const router = useRouter();
  const { confirm } = useConfirmModalContext();
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<SuperAdminFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Search state
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useDebouncedSearch(300);

  // API hooks
  const { data, isLoading, error, refetch } = useSuperadmins(filters);
  const toggleStatusMutation = useToggleSuperAdminStatus();
  const createInviteMutation = useCreateSuperAdminInvite();

  // Extract data
  const superadmins = data?.data?.superadmins || [];
  const stats = data?.data?.stats || { total: 0, active: 0, inactive: 0 };
  const pagination = data?.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 };

  // Update search when debounced search changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearchTerm, page: 1 }));
  }, [debouncedSearchTerm]);

  const handleFiltersChange = useCallback((newFilters: Partial<SuperAdminFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleSort = useCallback((field: string) => {
    const newSortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: newSortOrder, page: 1 }));
  }, [filters.sortBy, filters.sortOrder]);

  const handleToggleStatus = useCallback((superadmin: SuperAdmin) => {
    const isCurrentlyActive = superadmin.isActive;
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Superadmin`,
      message: `Are you sure you want to ${action} "${superadmin.name}"? ${isCurrentlyActive ? 'They will lose access to the system until reactivated.' : 'They will regain access to the system.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: isCurrentlyActive ? 'warning' : 'success',
      onConfirm: () => toggleStatusMutation.mutate({
        id: superadmin.id,
        isActive: !isCurrentlyActive
      }),
    });
  }, [confirm, toggleStatusMutation]);

  const handleCreateInvite = useCallback(() => {
    setShowInviteModal(true);
  }, []);

  const handleInviteSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (error) {
    console.error('Superadmins error:', error);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Superadmin Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage superadmin accounts and permissions
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading superadmins
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('superadmins.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage superadmin accounts and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateInvite}
            disabled={createInviteMutation.isPending}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('superadmins.inviteSuperadmin')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} totalSuperadmins={superadmins.length} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search superadmins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filters.status}
              onChange={(e) => handleFiltersChange({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Superadmins Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Superadmins ({pagination.totalRecords})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : superadmins.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No superadmins found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filters.search || filters.status !== '' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Invite a new superadmin to get started.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Superadmin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Activity Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {superadmins.map((superadmin) => (
                  <tr key={superadmin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {superadmin.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {superadmin.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {superadmin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(superadmin.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-4">
                        <span>Audit: {superadmin.stats.auditLogs}</span>
                        <span>Backups: {superadmin.stats.backups}</span>
                        <span>Reports: {superadmin.stats.reports}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(superadmin.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(superadmin)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {superadmin.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} results
              </span>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Superadmin Modal */}
      <InviteSuperadminModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
