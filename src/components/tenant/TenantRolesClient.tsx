"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Settings,
  Eye,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
  users: User[];
  userCount: number;
}

interface Permission {
  moduleKey: string;
  moduleName?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Module {
  moduleKey: string;
  moduleName: string;
  description?: string;
}

interface RolesResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

interface CreateRoleForm {
  name: string;
  description: string;
  color: string;
  permissions: Permission[];
}

const TenantRolesClient: React.FC = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, hasPermission } = useReduxAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleForm>({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: []
  });

  // Fetch roles with React Query
  const {
    data: rolesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tenant-roles', tenantSlug, currentPage, pageSize, searchTerm, statusFilter],
    queryFn: async (): Promise<RolesResponse> => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/tenant/${tenantSlug}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: currentPage,
          limit: pageSize,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      return response.data.data;
    },
    enabled: !!tenantSlug && hasPermission('roles', 'read'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch modules for permissions
  const { data: modulesData } = useQuery({
    queryKey: ['tenant-modules', tenantSlug],
    queryFn: async (): Promise<Module[]> => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/tenant/${tenantSlug}/modules`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data.modules || [];
    },
    enabled: !!tenantSlug && hasPermission('modules', 'read'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch users for role assignment
  const { data: usersData } = useQuery({
    queryKey: ['tenant-users-for-assignment', tenantSlug],
    queryFn: async (): Promise<User[]> => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/tenant/${tenantSlug}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { page: 1, limit: 100 }
      });
      return response.data.data.users || [];
    },
    enabled: !!tenantSlug && hasPermission('users', 'read'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = rolesData?.roles || [];
  const pagination = rolesData?.pagination;
  const stats = rolesData?.stats;
  const permissions = rolesData?.permissions;
  const modules = modulesData || [];
  const users = usersData || [];

  const getRoleColor = (color?: string) => {
    return color || '#3B82F6';
  };

  const getStatusColor = (status: boolean) => {
    return status
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Roles
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load roles'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and permissions within your tenant organization
          </p>
        </div>
        {permissions?.canCreate && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: getRoleColor(role.color) }}
                        >
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {role.name}
                            {role.isSystem && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                System
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {role.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(role.isActive)}`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {role.userCount} users
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {role.permissions.length} permissions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(role.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {permissions?.canUpdate && !role.isSystem && (
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {permissions?.canDelete && !role.isSystem && !role.isDefault && (
                          <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantRolesClient;
