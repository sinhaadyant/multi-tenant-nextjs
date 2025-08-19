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
import UserSkeleton from './UserSkeleton';
import { CountCard } from '@/components/ui/CountCard';
import { CountCardsGridSkeleton } from '@/components/ui/CountCardSkeleton';

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

  // Calculate stats from users data
  const stats = React.useMemo(() => {
    if (!usersData?.users) return { total: 0, active: 0, inactive: 0, pending: 0 };
    
    const users = usersData.users;
    return {
      total: usersData.totalRecords || users.length,
      active: users.filter((user: any) => user.status === 'active').length,
      inactive: users.filter((user: any) => user.status === 'inactive').length,
      pending: users.filter((user: any) => user.status === 'pending').length,
    };
  }, [usersData]);

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
    router.push(`/superadmin/users/${user.id}`);
  }, [router]);

  const handleEditUser = useCallback((user: any) => {
    // TODO: Open edit user modal
    console.log('Edit user:', user);
  }, []);

  const handleDeleteUser = useCallback(async (user: any) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      try {
        await deleteUserMutation.mutateAsync(user.id);
        refetch();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  }, [confirm, deleteUserMutation, refetch]);

  const handleToggleStatus = useCallback(async (user: any) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} ${user.name || user.email}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await toggleStatusMutation.mutateAsync({ userId: user.id, status: newStatus });
        refetch();
      } catch (error) {
        console.error(`Failed to ${action} user:`, error);
      }
    }
  }, [confirm, toggleStatusMutation, refetch]);

  const handleResetPassword = useCallback(async (user: any) => {
    const confirmed = await confirm({
      title: 'Reset Password',
      message: `Are you sure you want to reset the password for ${user.name || user.email}?`,
      confirmText: 'Reset',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await resetPasswordMutation.mutateAsync(user.id);
      } catch (error) {
        console.error('Failed to reset password:', error);
      }
    }
  }, [confirm, resetPasswordMutation]);

  const handleExportUsers = useCallback(async () => {
    try {
      await exportUsersMutation.mutateAsync(filters);
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  }, [exportUsersMutation, filters]);

  // Handle loading state
  if (isLoading) {
    return <UserSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all users across all tenants
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">
              Error loading users: {error.message}
            </span>
          </div>
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
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all users across all tenants
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportUsers}
            disabled={exportUsersMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Download className={`w-4 h-4 mr-2 ${exportUsersMutation.isPending ? 'animate-spin' : ''}`} />
            {exportUsersMutation.isPending ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="outline"
            size="sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          bgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        
        <CountCard
          title="Active Users"
          value={stats.active}
          icon={UserCheck}
          bgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-400"
        />
        
        <CountCard
          title="Inactive Users"
          value={stats.inactive}
          icon={UserX}
          bgColor="bg-red-100 dark:bg-red-900"
          iconColor="text-red-600 dark:text-red-400"
        />
        
        <CountCard
          title="Pending Users"
          value={stats.pending}
          icon={AlertTriangle}
          bgColor="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-600 dark:text-yellow-400"
        />
      </div>

      {/* Filters */}
      <UserFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={isLoading}
      />

      {/* Users Table */}
      <UserTable
        users={usersData?.users || []}
        loading={isLoading}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        currentPage={filters.page}
        totalPages={usersData?.totalPages || 1}
        totalRecords={usersData?.totalRecords || 0}
        pageSize={filters.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortingChange={handleSortingChange}
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default UserPage; 