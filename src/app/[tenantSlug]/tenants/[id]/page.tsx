"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Users,
  Globe,
  MapPin,
  Settings,
  Activity,
  Trash2,
  Eye, Search
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useTenant,
  useTenantUsers,
  useTenantActivityLogs,
  useToggleTenantStatus,
  useDeleteTenant,
  useToggleUserStatus,
  useResetUserPassword,
  TenantUser
} from '@/hooks/useTenantsAPI';
import TenantSkeleton from '@/components/superadmin/TenantSkeleton';
import TenantUserManagement from '@/components/superadmin/TenantUserManagement';
import AuditLogsTable from '@/components/superadmin/AuditLogsTable';
import AuditLogDetailsModal from '@/components/superadmin/AuditLogDetailsModal';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { useToast } from '@/hooks/useToast';

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const tenantId = params.id as string;

  // Debug logging for params
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Tenant Detail Page Params:', {
      params,
      tenantId,
      tenantIdType: typeof tenantId,
      tenantIdLength: tenantId?.length
    });
  }
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'activity'>('overview');

  // Users pagination and search state
  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const [isExporting, setIsExporting] = useState(false);

  // Activity logs pagination and search state
  const [activityFilters, setActivityFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    action: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Modal state for audit log details
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API hooks
  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = useTenant(tenantId);
  let { data: usersData, isLoading: usersLoading, error: usersError } = useTenantUsers(tenantId, userFilters);
  let { data: activityData, isLoading: activityLoading, error: activityError } = useTenantActivityLogs(tenantId, activityFilters);
  const toggleStatusMutation = useToggleTenantStatus();
  const deleteMutation = useDeleteTenant();
  const toggleUserStatusMutation = useToggleUserStatus();
  const resetPasswordMutation = useResetUserPassword();
  usersData = usersData?.data;
  activityData = activityData?.data;
  const tenant = tenantData?.data?.tenant;
  const users = usersData?.data?.users || [];
  const userStats = usersData?.data?.stats || { total: 0, active: 0, inactive: 0 };
  const userPagination = usersData?.meta?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 };
  
  // Ensure activities is always an array and has the correct structure
  const rawActivities = activityData?.data?.auditLogs || activityData?.auditLogs || [];
  const activities = Array.isArray(rawActivities) ? rawActivities : [];
  const activityPagination = activityData?.meta?.pagination || activityData?.pagination || { page: 1, limit: 10, totalPages: 1, totalRecords: 0 };

  // Transform tenant activity logs to match AuditLog interface
  const transformedActivities = activities.map((activity: any) => ({
    id: activity.id,
    action: activity.action,
    details: activity.details,
    ipAddress: activity.ipAddress || 'N/A',
    userAgent: activity.userAgent || 'N/A',
    createdAt: activity.createdAt,
    user: activity.user ? {
      id: activity.user.id,
      email: activity.user.email,
      name: activity.user.name
    } : undefined,
    superAdmin: undefined, // Tenant activity logs don't have superAdmin
    tenant: tenant ? {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    } : undefined
  }));

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Tenant Detail Page Debug:', {
      tenantId,
      tenantData,
      tenant,
      tenantUserCount: tenant?.userCount,
      usersData,
      users,
      userStats,
      tenantLoading,
      tenantError,
      usersLoading,
      usersError,
      activityFilters,
      activityData,
      activities: activities.length,
      transformedActivities: transformedActivities.length
    });
  }

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

  const handleEditTenant = () => {
    router.push(`/superadmin/tenants/${tenantId}/edit`);
  };

  const handleDeleteTenant = () => {
    if (tenant) {
      confirm({
        title: 'Delete Tenant',
        message: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone and will permanently remove all tenant data, users, and associated resources.`,
        confirmText: 'Delete Tenant',
        variant: 'danger',
        onConfirm: () => deleteMutation.mutate(tenantId),
      });
    }
  };

  const handleToggleStatus = () => {
    if (tenant) {
      const action = tenant.isActive ? 'suspend' : 'activate';
      confirm({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Tenant`,
        message: `Are you sure you want to ${action} "${tenant.name}"? ${tenant.isActive ? 'All users will lose access to the system until reactivated.' : 'All users will regain access to the system.'}`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        variant: tenant.isActive ? 'warning' : 'success',
        onConfirm: () => toggleStatusMutation.mutate({
          id: tenantId,
          isActive: !tenant.isActive
        }),
      });
    }
  };

  const handleToggleUserStatus = (user: TenantUser) => {
    const action = user.isActive ? 'suspend' : 'activate';
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} user "${user.name}"? ${user.isActive ? 'They will not be able to access the system until reactivated.' : 'They will regain access to the system.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: user.isActive ? 'warning' : 'success',
      onConfirm: () => toggleUserStatusMutation.mutate({
        tenantId,
        userId: user.id,
        isActive: !user.isActive
      }),
    });
  };

  const handleResetPassword = (user: TenantUser) => {
    confirm({
      title: 'Reset Password',
      message: `Are you sure you want to reset password for "${user.name}"? They will receive an email with a new temporary password.`,
      confirmText: 'Reset Password',
      variant: 'warning',
      onConfirm: () => resetPasswordMutation.mutate({
        tenantId,
        userId: user.id
      }),
    });
  };

  // User management handlers
  const handleUserFiltersChange = (newFilters: Partial<typeof userFilters>) => {
    setUserFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleUserPageChange = (page: number) => {
    setUserFilters(prev => ({ ...prev, page }));
  };

  const handleUserPageSizeChange = (limit: number) => {
    setUserFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleAddUser = () => {
    router.push(`/superadmin/tenants/${tenantId}/users/new`);
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      // Create URL with current filters
      const params = new URLSearchParams();
      Object.entries(userFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Create download link
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/users/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${tenant.slug}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Users exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Activity pagination handlers
  const handleActivityPageChange = (page: number) => {
    setActivityFilters(prev => ({ ...prev, page }));
  };

  const handleActivityPageSizeChange = (limit: number) => {
    setActivityFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleActivitySearchChange = (search: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Activity search changed:', search);
    }
    setActivityFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleActivityActionFilter = (action: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Activity action filter changed:', action);
    }
    setActivityFilters(prev => ({ ...prev, action, page: 1 }));
  };

  const handleActivitySort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Activity sort changed:', { sortBy, sortOrder });
    }
    setActivityFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  // Modal handlers for audit log details
  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  // Sort handler for AuditLogsTable (single field parameter)
  const handleActivitySortSingle = (field: string) => {
    const newSortOrder = activityFilters.sortBy === field && activityFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleActivitySort(field, newSortOrder);
  };

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-48"></div>
        </div>
        <TenantSkeleton />
      </div>
    );
  }

  // Show error state if there's an error
  if (tenantError) {
    console.error('❌ Tenant Detail Page Error:', tenantError);
  }

  if (tenantError || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Details</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading tenant
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {tenantError?.message || 'An error occurred while loading the tenant data.'}
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tenant.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tenant Details & Management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(tenant.isActive)}
          <button
            onClick={handleEditTenant}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Edit className="w-4 h-4 mr-2 inline" />
            Edit
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              tenant.isActive
                ? 'text-yellow-700 bg-yellow-100 border border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-800'
                : 'text-green-700 bg-green-100 border border-green-300 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 dark:hover:bg-green-800'
            }`}
          >
            {tenant.isActive ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={handleDeleteTenant}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700 dark:hover:bg-red-800"
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenant.userCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Region</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenant.region}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {format(new Date(tenant.createdAt), 'PPP')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tenant Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{tenant.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subdomain</dt>
                      <dd className="text-sm text-gray-900 dark:text-white font-mono">{tenant.slug}</dd>
                    </div>
                    {tenant.domain && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{tenant.domain}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Info</h3>
                  <dl className="space-y-3">
                    {tenant.description && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{tenant.description}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                      <dd>{getStatusBadge(tenant.isActive)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(tenant.createdAt), 'PPP')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(tenant.updatedAt), 'PPP')}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <TenantUserManagement
              tenantId={tenantId}
              users={users}
              userStats={userStats}
              pagination={userPagination}
              isLoading={usersLoading}
              error={usersError}
              filters={userFilters}
              onFiltersChange={handleUserFiltersChange}
              onPageChange={handleUserPageChange}
              onPageSizeChange={handleUserPageSizeChange}
              onToggleUserStatus={handleToggleUserStatus}
              onResetPassword={handleResetPassword}
              onAddUser={handleAddUser}
              onExportUsers={handleExportUsers}
              isExporting={isExporting}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tenant Settings</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Settings management will be implemented here.
              </p>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Activity Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Logs</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {activities.length} of {activityPagination.totalRecords} activities
                  </p>
                </div>
              </div>

              {/* Activity Search and Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search activities..."
                        value={activityFilters.search}
                        onChange={(e) => handleActivitySearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Action Filter */}
                  <div className="md:w-48">
                    <select
                      value={activityFilters.action}
                      onChange={(e) => handleActivityActionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Actions</option>
                      <option value="user.create">User Created</option>
                      <option value="user.update">User Updated</option>
                      <option value="user.delete">User Deleted</option>
                      <option value="tenant.update">Tenant Updated</option>
                      <option value="tenant.create">Tenant Created</option>
                      <option value="tenant.delete">Tenant Deleted</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                      <option value="password.reset">Password Reset</option>
                      <option value="role.create">Role Created</option>
                      <option value="role.update">Role Updated</option>
                      <option value="role.delete">Role Deleted</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="md:w-48">
                    <select
                      value={`${activityFilters.sortBy}-${activityFilters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleActivitySort(sortBy, sortOrder as 'asc' | 'desc');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="action-asc">Action A-Z</option>
                      <option value="action-desc">Action Z-A</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Activity Table */}
              {activityLoading ? (
                <TenantSkeleton />
              ) : activityError ? (
                <div className="text-center text-red-600 dark:text-red-400">
                  Error loading activities: {activityError.message}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No activity logs found for this tenant.</p>
                </div>
              ) : (
                <AuditLogsTable
                  logs={transformedActivities}
                  loading={activityLoading}
                  onViewLog={handleViewLog}
                  onSort={handleActivitySortSingle}
                  sortBy={activityFilters.sortBy}
                  sortOrder={activityFilters.sortOrder}
                  currentPage={activityPagination.page}
                  totalPages={activityPagination.totalPages}
                  onPageChange={handleActivityPageChange}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Details Modal */}
      <AuditLogDetailsModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
} 