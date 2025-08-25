"use client";

import React, { useState, useCallback, useTransition, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Download, RefreshCw } from '@/icons';
import { useTenants, useDeleteTenant, useToggleTenantStatus, useExportTenants, TenantFilters as TenantFiltersType, Tenant } from '@/hooks/useTenantsAPI';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import TenantTable from '@/components/superadmin/TenantTable';
import TenantFilters from '@/components/superadmin/TenantFilters';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Button from '@/components/ui/button/Button';
import TenantSkeleton from '@/components/superadmin/TenantSkeleton';

import { CountCard } from '@/components/ui/CountCard';
import { CountCardsGridSkeleton } from '@/components/ui/CountCardSkeleton';
import { CheckCircle, XCircle, Building2, Users } from 'lucide-react';

// Memoized stats cards component for better performance
const StatsCards = memo(({ stats, totalUsers }: { stats: any; totalUsers: number }) => {
  const { t } = useTranslation('tenants');
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CountCard
        title={t('activeTenants')}
        value={stats.active}
        icon={CheckCircle}
        bgColor="bg-green-100 dark:bg-green-900"
        iconColor="text-green-600 dark:text-green-400"
      />
      
      <CountCard
        title={t('suspendedTenants')}
        value={stats.inactive}
        icon={XCircle}
        bgColor="bg-red-100 dark:bg-red-900"
        iconColor="text-red-600 dark:text-red-400"
      />
      
      <CountCard
        title={t('totalTenants')}
        value={stats.total}
        icon={Building2}
        bgColor="bg-blue-100 dark:bg-blue-900"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      
      <CountCard
        title={t('totalUsers')}
        value={totalUsers}
        icon={Users}
        bgColor="bg-purple-100 dark:bg-purple-900"
        iconColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

const TenantsPage: React.FC = () => {
  const { t } = useTranslation(['tenants', 'common', 'forms']);
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
      title: t('tenants:deleteTenant'),
      message: t('tenants:deleteTenantConfirm', { name: tenant.name }),
      confirmText: t('tenants:deleteTenantButton'),
      variant: 'danger',
      onConfirm: () => deleteTenantMutation.mutate(tenant.id),
    });
  }, [confirm, deleteTenantMutation, t]);

  const handleToggleStatus = useCallback((tenant: Tenant) => {
    const isCurrentlyActive = tenant.status === 'active';
    const action = isCurrentlyActive ? 'suspend' : 'activate';
    const titleKey = isCurrentlyActive ? 'suspendTenant' : 'activateTenant';
    const messageKey = isCurrentlyActive ? 'suspendTenantConfirm' : 'activateTenantConfirm';
    const confirmKey = isCurrentlyActive ? 'suspend' : 'activate';
    
    confirm({
      title: t(`tenants:${titleKey}`),
      message: t(`tenants:${messageKey}`, { name: tenant.name }),
      confirmText: t(`tenants:${confirmKey}`),
      variant: isCurrentlyActive ? 'warning' : 'success',
      onConfirm: () => toggleStatusMutation.mutate({
        id: tenant.id,
        isActive: !isCurrentlyActive
      }),
    });
  }, [confirm, toggleStatusMutation, t]);

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
            {t('tenants:tenantManagement')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('tenants:manageAllTenants')}
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
            {t('common:refresh')}
          </Button>
          <Button
            onClick={handleExportData}
            disabled={isLoading || isPending || exportTenantsMutation.isPending}
            variant="outline"
            size="sm"
          >
            <Download className={`w-4 h-4 mr-2 inline ${exportTenantsMutation.isPending ? 'animate-spin' : ''}`} />
            {exportTenantsMutation.isPending ? t('common:exporting') : t('common:export')}
          </Button>
          <Button
            onClick={handleCreateTenant}
            variant="outline"
            size="sm"
            disabled={isPending}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            {t('tenants:createTenant')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <CountCardsGridSkeleton count={4} />
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