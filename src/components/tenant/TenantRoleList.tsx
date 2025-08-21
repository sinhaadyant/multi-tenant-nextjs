"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Shield,
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/button/Button';
import { CountCard } from '@/components/ui/CountCard';

interface TenantRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Array<{
    id: string;
    name: string;
    description?: string;
    module: string;
    action: string;
  }>;
}

interface TenantRoleListProps {
  roles: TenantRole[];
  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onCreateRole: () => void;
  onEditRole: (role: TenantRole) => void;
  onViewRole: (role: TenantRole) => void;
  onDeleteRole: (role: TenantRole) => void;
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

const TenantRoleList: React.FC<TenantRoleListProps> = ({
  roles,
  stats,
  pagination,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onCreateRole,
  onEditRole,
  onViewRole,
  onDeleteRole,
  permissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'userCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Memoized filtered and sorted roles
  const processedRoles = useMemo(() => {
    let filteredRoles = roles;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredRoles = filteredRoles.filter(role =>
        role.name.toLowerCase().includes(searchLower) ||
        (role.description && role.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredRoles = filteredRoles.filter(role => {
        if (statusFilter === 'active') return role.isActive;
        if (statusFilter === 'inactive') return !role.isActive;
        return true;
      });
    }

    // Sort roles
    filteredRoles.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'userCount':
          aValue = a.userCount;
          bValue = b.userCount;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredRoles;
  }, [roles, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSort = useCallback((field: 'name' | 'createdAt' | 'userCount') => {
    setSortBy(field);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CountCard
            title="Total Roles"
            value={stats.total}
            icon={Shield}
            bgColor="bg-blue-100 dark:bg-blue-900"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <CountCard
            title="Active Roles"
            value={stats.active}
            icon={CheckCircle}
            bgColor="bg-green-100 dark:bg-green-900"
            iconColor="text-green-600 dark:text-green-400"
          />
          <CountCard
            title="Inactive Roles"
            value={stats.inactive}
            icon={XCircle}
            bgColor="bg-red-100 dark:bg-red-900"
            iconColor="text-red-600 dark:text-red-400"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'name' | 'createdAt' | 'userCount');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="userCount-desc">Most Users</option>
              <option value="userCount-asc">Least Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {processedRoles.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' ? 'No roles match your filters.' : 'No roles found.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Role
                        <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('userCount')}
                    >
                      <div className="flex items-center">
                        Users
                        <SortIcon field="userCount" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Created
                        <SortIcon field="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {processedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {role.name}
                              {role.isDefault && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Default
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {role.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {role.userCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={role.isActive} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {format(new Date(role.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {permissions.canView && (
                            <button
                              onClick={() => onViewRole(role)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="View Role"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {permissions.canUpdate && !role.isDefault && (
                            <button
                              onClick={() => onEditRole(role)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                              title="Edit Role"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {permissions.canDelete && !role.isDefault && role.userCount === 0 && (
                            <button
                              onClick={() => onDeleteRole(role)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete Role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TenantRoleList;
