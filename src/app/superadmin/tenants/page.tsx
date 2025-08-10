"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Download, RefreshCw } from '@/icons';
import { useTenants, useDeleteTenant, useToggleTenantStatus, useExportTenants, TenantFilters as TenantFiltersType, Tenant } from '@/hooks/useTenantsAPI';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import TenantTable from '@/components/superadmin/TenantTable';
import TenantFilters from '@/components/superadmin/TenantFilters';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Button from '@/components/ui/button/Button';
import TenantSkeleton from '@/components/superadmin/TenantSkeleton';

// Memoized stats cards component for better performance
const StatsCards = memo(({ stats, totalUsers }: { stats: any; totalUsers: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tenants</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.active}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspended Tenants</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.inactive}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenants</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center">
        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalUsers}
          </p>
        </div>
      </div>
    </div>
  </div>
));

StatsCards.displayName = 'StatsCards';

const TenantsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm } = useConfirmModalContext();
  const [isPending, startTransition] = useTransition();
  
  // State management with optimized initialization
  const [filters, setFilters] = useState<TenantFiltersType>(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
     region: searchParams.get('region') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  }));

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // API hooks
  const { data: tenantsData, isLoading, error, refetch } = useTenants(filters);
  const deleteTenantMutation = useDeleteTenant();
  const toggleStatusMutation = useToggleTenantStatus();
  const exportTenantsMutation = useExportTenants();

  // Optimized data extraction with memoization
  const { tenants, stats, pagination, totalUsers } = React.useMemo(() => {
    const tenants = tenantsData?.data?.tenants || [];
    const stats = tenantsData?.data?.stats || { total: 0, active: 0, inactive: 0 };
    const pagination = tenantsData?.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 };
    const totalUsers = tenants.reduce((sum: number, t: Tenant) => sum + (t.userCount || 0), 0);
    
    return { tenants, stats, pagination, totalUsers };
  }, [tenantsData]);

  // Memoized filter handlers with transitions
  const handleFiltersChange = useCallback((newFilters: TenantFiltersType) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setFilters({
        page: 1,
        limit: 10,
        search: '',
        status: '',
        region: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });
  }, []);

  // Memoized action handlers with transitions
  const handleViewTenant = useCallback((tenant: Tenant) => {
    startTransition(() => {
      router.push(`/superadmin/tenants/${tenant.id}`);
    });
  }, [router]);

  const handleEditTenant = useCallback((tenant: Tenant) => {
    startTransition(() => {
      router.push(`/superadmin/tenants/${tenant.id}/edit`);
    });
  }, [router]);

  const handleDeleteTenant = useCallback((tenant: Tenant) => {
    confirm({
      title: 'Delete Tenant',
      message: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone and will permanently remove all tenant data, users, and associated resources.`,
      confirmText: 'Delete Tenant',
      variant: 'danger',
      onConfirm: () => deleteTenantMutation.mutate(tenant.id),
    });
  }, [confirm, deleteTenantMutation]);

  const handleToggleStatus = useCallback((tenant: Tenant) => {
    const action = tenant.isActive ? 'suspend' : 'activate';
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Tenant`,
      message: `Are you sure you want to ${action} "${tenant.name}"? ${tenant.isActive ? 'All users will lose access to the system until reactivated.' : 'All users will regain access to the system.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: tenant.isActive ? 'warning' : 'success',
      onConfirm: () => toggleStatusMutation.mutate({
        id: tenant.id,
        isActive: !tenant.isActive
      }),
    });
  }, [confirm, toggleStatusMutation]);

  const handleCreateTenant = useCallback(() => {
    startTransition(() => {
      router.push('/superadmin/tenants/new');
    });
  }, [router]);

  const handleExportData = useCallback(() => {
    exportTenantsMutation.mutate(filters);
  }, [exportTenantsMutation, filters]);

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      refetch();
    });
  }, [refetch]);

  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, page }));
    });
  }, []);

  const handleSort = useCallback((field: string) => {
    startTransition(() => {
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
      }));
    });
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, limit: size, page: 1 }));
    });
  }, []);

  const handleRetry = useCallback(() => {
    startTransition(() => {
      refetch();
    });
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tenant Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all tenants in the system
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isLoading || isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 inline ${isLoading || isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportData}
            disabled={isLoading || isPending || exportTenantsMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Download className={`w-4 h-4 mr-2 inline ${exportTenantsMutation.isPending ? 'animate-spin' : ''}`} />
            {exportTenantsMutation.isPending ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            onClick={handleCreateTenant}
            variant="outline"
            size="sm"
            disabled={isPending}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Create Tenant
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <TenantSkeleton type="stats" />
      ) : (
        <StatsCards stats={stats} totalUsers={totalUsers} />
      )}

      {/* Enhanced Filters */}
      <TenantFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={isLoading || isPending}
      />

      {/* Enhanced Data Table */}
      <TenantTable
        tenants={tenants}
        loading={isLoading || isPending}
        onView={handleViewTenant}
        onEdit={handleEditTenant}
        onDelete={handleDeleteTenant}
        onToggleStatus={handleToggleStatus}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
      />
    </div>
  );
};

export default TenantsPage; 