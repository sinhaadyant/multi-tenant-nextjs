"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreHorizontal,
  Key, 
  Calendar,
  Building2,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { TenantUser } from '@/hooks/useTenantUsers';
import Button from '@/components/ui/button/Button';

interface TenantUserTableProps {
  users: TenantUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: any;
  filters: {
    page: number;
    limit: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: Partial<TenantUserTableProps['filters']>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onToggleUserStatus: (user: TenantUser) => void;
  onDeleteUser: (user: TenantUser) => void;
  onBulkAction: (action: 'activate' | 'deactivate' | 'delete', userIds: string[]) => void;
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canView: boolean;
  };
}

// Memoized Status Badge Component
const StatusBadge = React.memo(({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized Sort Icon Component
const SortIcon = React.memo(({ field, sortBy, sortOrder }: { field: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
  if (sortBy !== field) {
    return <ChevronUp className="w-4 h-4 text-gray-400" />;
  }
  return sortOrder === 'asc' 
    ? <ChevronUp className="w-4 h-4 text-blue-500" />
    : <ChevronDown className="w-4 h-4 text-blue-500" />;
});

SortIcon.displayName = 'SortIcon';

const TenantUserTable: React.FC<TenantUserTableProps> = ({
  users,
  pagination,
  isLoading,
  error,
  filters,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  onToggleUserStatus,
  onDeleteUser,
  onBulkAction,
  permissions
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Memoized filtered and sorted users
  const processedUsers = useMemo(() => {
    let filteredUsers = users;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.roles.some(role => role.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => {
        if (filters.status === 'active') return user.isActive;
        if (filters.status === 'inactive') return !user.isActive;
        return true;
      });
    }

    return filteredUsers;
  }, [users, filters.search, filters.status]);

  const handleSearchChange = useCallback((search: string) => {
    onFiltersChange({ search, page: 1 });
  }, [onFiltersChange]);

  const handleStatusFilter = useCallback((status: string) => {
    onFiltersChange({ status, page: 1 });
  }, [onFiltersChange]);

  const handleSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    onFiltersChange({ sortBy, sortOrder, page: 1 });
  }, [onFiltersChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedUsers(processedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  }, [processedUsers]);

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  }, []);

  const handleBulkActionClick = useCallback((action: 'activate' | 'deactivate' | 'delete') => {
    onBulkAction(action, selectedUsers);
    setSelectedUsers([]);
  }, [selectedUsers, onBulkAction]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <UserX className="w-6 h-6 text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
              Error Loading Users
            </h3>
            <p className="text-red-700 dark:text-red-300 mt-1">
              {error.message || 'Failed to load users. Please try refreshing the page.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleSort(sortBy, sortOrder as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="lastLogin-desc">Last Login</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <div className="lg:w-auto">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="w-full lg:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option value="">All Roles</option>
                  {/* TODO: Add role options */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created Date
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Login
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                {permissions.canUpdate && (
                  <>
                    <Button
                      onClick={() => handleBulkActionClick('activate')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      onClick={() => handleBulkActionClick('deactivate')}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Deactivate
                    </Button>
                  </>
                )}
                {permissions.canDelete && (
                  <Button
                    onClick={() => handleBulkActionClick('delete')}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <Button
              onClick={() => setSelectedUsers([])}
              variant="outline"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : processedUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || filters.status ? 'No users match your filters.' : 'No users found.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === processedUsers.length && processedUsers.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('name', filters.sortBy === 'name' && filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center">
                        User
                        <SortIcon field="name" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('role', filters.sortBy === 'role' && filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center">
                        Role
                        <SortIcon field="role" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('lastLogin', filters.sortBy === 'lastLogin' && filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center">
                        Last Login
                        <SortIcon field="lastLogin" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('createdAt', filters.sortBy === 'createdAt' && filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center">
                        Created
                        <SortIcon field="createdAt" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {processedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
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
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.roles.length > 0 ? user.roles[0].name : 'No Role'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {user.lastLogin 
                              ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')
                              : 'Never'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {permissions.canUpdate && (
                            <button
                              onClick={() => onToggleUserStatus(user)}
                              className={`${
                                user.isActive 
                                  ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                              title={user.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}
                          {permissions.canUpdate && (
                            <button
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => onDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="More Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
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
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </span>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
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

export default TenantUserTable;
