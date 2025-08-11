"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Users, UserCheck, UserX, AlertTriangle, X, UserPlus } from 'lucide-react';
import { SortingState } from '@tanstack/react-table';
import { useUsers, useToggleUserStatus, useDeleteUser, useResetUserPassword, useExportUsers, UserFilters } from '@/hooks/useUsers';
import UserTable from './UserTable';
import UserFilterBar from './UserFilterBar';
import CreateUserModal from './CreateUserModal';
import { UserErrorBoundaryWrapper } from './UserErrorBoundary';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

const UserPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [filters, setFilters] = useState<UserFilters>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    tenantId: searchParams.get('tenantId') || '',
    roleId: searchParams.get('roleId') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Hooks
  const { data: usersData, isLoading, error, refetch } = useUsers(filters);
  const toggleStatusMutation = useToggleUserStatus();
  const deleteUserMutation = useDeleteUser();
  const resetPasswordMutation = useResetUserPassword();
  const exportUsersMutation = useExportUsers();
  const { confirm } = useConfirmModalContext();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Handlers
  const handleFiltersChange = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: '',
      tenantId: '',
      roleId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      setFilters(prev => ({
        ...prev,
        sortBy: id,
        sortOrder: desc ? 'desc' : 'asc',
        page: 1,
      }));
    }
  }, []);

  const handleViewUser = useCallback((user: any) => {
    // TODO: Navigate to user details page or open modal
    console.log('View user:', user);
  }, []);

  const handleEditUser = useCallback((user: any) => {
    // TODO: Open edit user modal
    console.log('Edit user:', user);
  }, []);

  const handleDeleteUser = useCallback((user: any) => {
    confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone and will permanently remove all user data.`,
      confirmText: 'Delete User',
      variant: 'danger',
      onConfirm: () => deleteUserMutation.mutate(user.id),
    });
  }, [confirm, deleteUserMutation]);

  const handleToggleStatus = useCallback((user: any) => {
    const action = user.isActive ? 'suspend' : 'activate';
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} user "${user.name}"? ${user.isActive ? 'They will not be able to access the system until reactivated.' : 'They will regain access to the system.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: user.isActive ? 'warning' : 'success',
      onConfirm: () => toggleStatusMutation.mutate({
        id: user.id,
        isActive: !user.isActive,
      }),
    });
  }, [confirm, toggleStatusMutation]);

  const handleResetPassword = useCallback((user: any) => {
    confirm({
      title: 'Reset Password',
      message: `Are you sure you want to reset the password for "${user.name}"? They will receive an email with a new temporary password.`,
      confirmText: 'Reset Password',
      variant: 'warning',
      onConfirm: () => resetPasswordMutation.mutate(user.id),
    });
  }, [confirm, resetPasswordMutation]);

  const handleExportData = useCallback(() => {
    exportUsersMutation.mutate(filters);
  }, [exportUsersMutation, filters]);

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Failed to load users
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {error.message || 'An error occurred while fetching users.'}
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const users = usersData?.data?.users || [];
  const stats = usersData?.data?.stats || { total: 0, active: 0, inactive: 0 };
  const pagination = usersData?.meta?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 };

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 UserPage Data:', {
      rawData: usersData,
      users: users,
      stats: stats,
      pagination: pagination,
      usersLength: users.length
    });
  }

  return (
    <UserErrorBoundaryWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.tenantId 
                ? `Managing users for specific tenant`
                : 'Manage all users across all tenants'
              }
            </p>
          </div>
          <div className="flex gap-3">
            {filters.tenantId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  🏢 Tenant Filter Active
                </span>
                <button
                  onClick={() => handleFiltersChange({ tenantId: '' })}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exportUsersMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportUsersMutation.isPending ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tenant Filter Summary */}
          {filters.tenantId && (
            <div className="col-span-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏢</span>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Filtered by Tenant
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Showing users from specific tenant only
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFiltersChange({ tenantId: '' })}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Showing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <UserFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          loading={isLoading}
        />

        {/* Results Summary */}
        {users.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {users.length} of {pagination.totalRecords} users
              {filters.search && (
                <span className="ml-2">
                  for "<span className="font-medium">{filters.search}</span>"
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {filters.status && (
                <Badge variant="light" color="info">
                  Status: {filters.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              )}
              {filters.tenantId && (
                <Badge variant="light" color="primary">
                  Tenant Filtered
                </Badge>
              )}
              {filters.roleId && (
                <Badge variant="light" color="warning">
                  Role Filtered
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Data Table */}
        <UserTable
          users={users}
          loading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortingChange={handleSortingChange}
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
        />

        {/* Empty State */}
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filters.search || filters.status || filters.tenantId || filters.roleId
                ? 'Try adjusting your filters to find more users.'
                : 'No users have been created yet.'}
            </p>
            {filters.search || filters.status || filters.tenantId || filters.roleId ? (
              <div className="mt-6">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refetch();
            setShowCreateModal(false);
          }}
        />
      </div>
    </UserErrorBoundaryWrapper>
  );
};

export default UserPage; 