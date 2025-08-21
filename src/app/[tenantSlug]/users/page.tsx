"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Download, RefreshCw, Users, UserCheck, UserX } from 'lucide-react';
import { useTenantUsers, useBulkUserOperations, useToggleUserStatus, useDeleteTenantUser, useExportUsers } from '@/hooks/useTenantUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/button/Button';
import { CountCard } from '@/components/ui/CountCard';
import { CountCardsGridSkeleton } from '@/components/ui/CountCardSkeleton';
import TenantUserTable from '@/components/tenant/TenantUserTable';
import TenantUserSkeleton from '@/components/tenant/TenantUserSkeleton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Memoized stats cards component for better performance
const StatsCards = memo(({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  </div>
));

StatsCards.displayName = 'StatsCards';

const TenantUsersPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const { hasPermission } = usePermissions();
  const tenantSlug = params.tenantSlug as string;

  // State for filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  // API hooks
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    error: usersError,
    refetch 
  } = useTenantUsers(tenantSlug, filters);

  const bulkOperationsMutation = useBulkUserOperations(tenantSlug);
  const toggleStatusMutation = useToggleUserStatus(tenantSlug);
  const deleteUserMutation = useDeleteTenantUser(tenantSlug);
  const exportUsersMutation = useExportUsers(tenantSlug);

  // Extract data
  const users = usersData?.users || [];
  const userStats = usersData?.stats || { total: 0, active: 0, inactive: 0 };
  const pagination = usersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Permission checks
  const canCreateUser = hasPermission('users', 'create');
  const canUpdateUser = hasPermission('users', 'update');
  const canDeleteUser = hasPermission('users', 'delete');
  const canViewUsers = hasPermission('users', 'view');

  // Handlers
  const handleFiltersChange = useCallback((newFilters: Partial<typeof filters>) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, page }));
    });
  }, []);

  const handlePageSizeChange = useCallback((limit: number) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, limit, page: 1 }));
    });
  }, []);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      refetch();
    });
  }, [refetch]);

  const handleAddUser = useCallback(() => {
    if (!canCreateUser) {
      toast.error('You don\'t have permission to create users');
      return;
    }
    router.push(`/${tenantSlug}/users/new`);
  }, [canCreateUser, router, tenantSlug, toast]);

  const handleExportUsers = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportUsersMutation.mutateAsync(filters);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [exportUsersMutation, filters, toast]);

  const handleToggleUserStatus = useCallback((user: any) => {
    if (!canUpdateUser) {
      toast.error('You don\'t have permission to update users');
      return;
    }

    const action = user.isActive ? 'suspend' : 'activate';
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} "${user.name}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: 'warning',
      onConfirm: () => {
        toggleStatusMutation.mutate({
          userId: user.id,
          isActive: !user.isActive
        });
      },
    });
  }, [canUpdateUser, confirm, toggleStatusMutation, toast]);

  const handleDeleteUser = useCallback((user: any) => {
    if (!canDeleteUser) {
      toast.error('You don\'t have permission to delete users');
      return;
    }

    confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deleteUserMutation.mutate(user.id);
      },
    });
  }, [canDeleteUser, confirm, deleteUserMutation, toast]);

  const handleBulkAction = useCallback((action: 'activate' | 'deactivate' | 'delete', userIds: string[]) => {
    if (userIds.length === 0) {
      toast.error('Please select users to perform bulk action');
      return;
    }

    let hasPermission = false;
    switch (action) {
      case 'activate':
      case 'deactivate':
        hasPermission = canUpdateUser;
        break;
      case 'delete':
        hasPermission = canDeleteUser;
        break;
    }

    if (!hasPermission) {
      toast.error(`You don't have permission to ${action} users`);
      return;
    }

    const actionText = action === 'delete' ? 'delete' : action;
    confirm({
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Users`,
      message: `Are you sure you want to ${actionText} ${userIds.length} selected user(s)?`,
      confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      variant: action === 'delete' ? 'danger' : 'warning',
      onConfirm: () => {
        bulkOperationsMutation.mutate({
          userIds,
          action
        });
      },
    });
  }, [canUpdateUser, canDeleteUser, confirm, bulkOperationsMutation, toast]);

  return (
    <ProtectedRoute 
      requireAuth={true}
      requirePermissions={['users:read']}
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don't have permission to access the Users module.
            </p>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage tenant users, their roles, and permissions
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {hasPermission('users', 'create') && (
                <Button
                  onClick={handleAddUser}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              )}
              
              {hasPermission('users', 'read') && (
                <Button
                  onClick={handleExportUsers}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              )}
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isPending}
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {usersLoading ? (
            <CountCardsGridSkeleton />
          ) : (
            <StatsCards stats={userStats} />
          )}

          {/* User Table */}
          {usersLoading ? (
            <TenantUserSkeleton />
          ) : usersError ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">
                Error loading users: {usersError?.message || 'Unknown error occurred'}
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <TenantUserTable
              users={users}
              pagination={pagination}
              isLoading={isPending}
              error={usersError}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              onBulkAction={handleBulkAction}
              permissions={{
                canCreate: canCreateUser,
                canUpdate: canUpdateUser,
                canDelete: canDeleteUser,
                canView: canViewUsers
              }}
            />
          )}
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
};

export default TenantUsersPage; 