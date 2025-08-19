"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Download, RefreshCw, Users, UserCheck, UserX, Search } from 'lucide-react';
import { 
  useSuperadminUsers, 
  useDeleteSuperadminUser, 
  useToggleSuperadminUserStatus, 
  useExportSuperadminUsers, 
  SuperadminUserFilters, 
  SuperadminUser 
} from '@/hooks/useSuperadminUsers';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/hooks/useToast';

// Memoized stats cards component for better performance
const StatsCards = memo(({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.inactive}
          </p>
        </div>
      </div>
    </div>
  </div>
));

StatsCards.displayName = 'StatsCards';

const UsersPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm } = useConfirmModalContext();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // State management with optimized initialization
  const [filters, setFilters] = useState<SuperadminUserFilters>(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    tenantId: searchParams.get('tenantId') || '',
    roleId: searchParams.get('roleId') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  }));

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // API hooks
  const { data: usersData, isLoading, error, refetch } = useSuperadminUsers(filters);
  const deleteUserMutation = useDeleteSuperadminUser();
  const toggleStatusMutation = useToggleSuperadminUserStatus();
  const exportUsersMutation = useExportSuperadminUsers();

  // Optimized data extraction
  const users = usersData?.data?.users || [];
  const stats = usersData?.data?.stats || { total: 0, active: 0, inactive: 0 };
  const pagination = usersData?.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 };

  // Optimized handlers with useCallback
  const handleViewUser = useCallback((user: SuperadminUser) => {
    startTransition(() => {
      router.push(`/superadmin/users/${user.id}`);
    });
  }, [router]);

  const handleEditUser = useCallback((user: SuperadminUser) => {
    startTransition(() => {
      router.push(`/superadmin/users/${user.id}/edit`);
    });
  }, [router]);

  const handleDeleteUser = useCallback((user: SuperadminUser) => {
    confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.name}"? This action cannot be undone and will permanently remove the user and all associated data.`,
      confirmText: 'Delete User',
      variant: 'danger',
      onConfirm: () => deleteUserMutation.mutate(user.id),
    });
  }, [confirm, deleteUserMutation]);

  const handleToggleStatus = useCallback((user: SuperadminUser) => {
    const action = user.isActive ? 'suspend' : 'activate';
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} "${user.name}"? ${user.isActive ? 'They will not be able to access the system until reactivated.' : 'They will regain access to the system.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: user.isActive ? 'warning' : 'success',
      onConfirm: () => toggleStatusMutation.mutate({
        id: user.id,
        isActive: !user.isActive
      }),
    });
  }, [confirm, toggleStatusMutation]);

  const handleCreateUser = useCallback(() => {
    startTransition(() => {
      router.push('/superadmin/users/new');
    });
  }, [router]);

  const handleExportData = useCallback(() => {
    exportUsersMutation.mutate(filters);
  }, [exportUsersMutation, filters]);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      refetch();
    });
  }, [refetch]);

  const handleFiltersChange = useCallback((newFilters: Partial<SuperadminUserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Search functionality
  const { searchTerm, setSearchTerm, debouncedSearchTerm, isPending: isSearchPending } = useDebouncedSearch(300);

  React.useEffect(() => {
    if (debouncedSearchTerm !== filters.search) {
      handleFiltersChange({ search: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm, handleFiltersChange, filters.search]);

  // Error handling
  React.useEffect(() => {
    if (error) {
      console.error('❌ Users page error:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Authentication failed. Please log in again.');
        router.push('/superadmin/login');
      } else {
        toast.error('Failed to load users. Please try again.');
      }
    }
  }, [error, toast, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all users across all tenants
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportData}
            disabled={isLoading || exportUsersMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleCreateUser}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name, email, tenant, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={filters.status}
              onChange={(e) => handleFiltersChange({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="md:w-48">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFiltersChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load users. Please try again.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No users found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user: SuperadminUser) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user.tenant?.name || 'No Tenant'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user.role?.name || 'No Role'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`${
                              user.isActive 
                                ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                                : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                            }`}
                          >
                            {user.isActive ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage; 