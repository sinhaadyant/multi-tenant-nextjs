"use client";

import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Edit, Eye, Search, Filter, X } from 'lucide-react';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import { useTenantRoles } from '@/hooks/useTenantRoles';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import Button from '@/components/ui/button/Button';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface UserManagementProps {
  tenantSlug: string;
}

interface FilterState {
  search: string;
  roleFilter: string;
  statusFilter: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ tenantSlug }) => {
  const { hasPermission } = useReduxAuth();
  const router = useRouter();
  
  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    roleFilter: '',
    statusFilter: ''
  });
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useTenantUsers(tenantSlug, {
    page: 1,
    limit: 100 // Increased limit to get all users for filtering
  });

  // Fetch roles for filtering
  const {
    roles: availableRoles,
    isLoading: rolesLoading
  } = useTenantRoles(tenantSlug);

  const users = data?.users || [];
  const stats = data?.stats;
  const permissions = data?.permissions;

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('UserManagement Debug:', {
      usersCount: users.length,
      rolesCount: availableRoles?.length || 0,
      stats: stats,
      permissions: permissions,
      filters: filters
    });
  }

  const canViewUsers = permissions?.canView || hasPermission('users', 'read');
  const canCreateUsers = permissions?.canCreate || hasPermission('users', 'create');
  const canEditUsers = permissions?.canUpdate || hasPermission('users', 'update');

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filters.roleFilter) {
        const hasRole = user.roles?.some(role => role.id === filters.roleFilter);
        if (!hasRole) return false;
      }

      // Status filter
      if (filters.statusFilter) {
        if (filters.statusFilter === 'active' && !user.isActive) return false;
        if (filters.statusFilter === 'inactive' && user.isActive) return false;
      }

      return true;
    });
  }, [users, filters]);

  // Get filtered stats
  const filteredStats = useMemo(() => {
    const activeCount = filteredUsers.filter(user => user.isActive).length;
    const inactiveCount = filteredUsers.filter(user => !user.isActive).length;
    
    return {
      total: filteredUsers.length,
      active: activeCount,
      inactive: inactiveCount,
      newThisMonth: stats?.newThisMonth || 0 // Keep original newThisMonth as it's time-based
    };
  }, [filteredUsers, stats]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      roleFilter: '',
      statusFilter: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.roleFilter || filters.statusFilter;

  if (!canViewUsers) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to view users.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading users: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users in your tenant
          </p>
        </div>
        {canCreateUsers && (
          <Button onClick={() => toast('Create user functionality coming soon')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('forms:placeholders.searchByNameOrEmail')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Role
            </label>
            <select
              value={filters.roleFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, roleFilter: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Roles</option>
              {availableRoles?.map((role: any) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filters.statusFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.roleFilter && (
                                 <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                   Role: {availableRoles?.find((r: any) => r.id === filters.roleFilter)?.name || 'Unknown'}
                 </span>
              )}
              {filters.statusFilter && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded-full">
                  Status: {filters.statusFilter}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show stats if user has view permission and stats are available */}
      {(permissions?.canView || permissions?.canViewAll) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredStats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredStats.active}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredStats.inactive}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredStats.newThisMonth}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Users ({filteredUsers.length})
            {hasActiveFilters && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                of {users.length} total
              </span>
            )}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
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
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
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
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, index) => (
                          <span
                            key={role.id}
                            className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                          >
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                          No role assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                        onClick={() => router.push(`/${tenantSlug}/users/${user.id}`)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title={t('tables:filters.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEditUsers && (
                        <button
                          onClick={() => router.push(`/${tenantSlug}/users/${user.id}?edit=true`)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          title={t('tables:filters.editUser')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Empty State */}
        {(!filteredUsers || filteredUsers.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {hasActiveFilters ? 'No Users Match Your Filters' : 'No Users Found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms to find users.'
                : error 
                  ? 'Error loading users' 
                  : 'No users have been created yet.'
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="mt-2">
                Clear All Filters
              </Button>
            )}
            {error && (
              <Button onClick={() => {
                try {
                  refetch();
                } catch (err) {
                  console.error('Error refetching:', err);
                }
              }} className="mt-2 ml-2">
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement; 