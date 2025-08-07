"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Building2, Shield, Check, X } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';
import { useRolesAPI, Role } from '@/hooks/useRolesAPI';
import { ErrorComponent } from '@/components/superadmin/ErrorComponent';

interface User {
  id: string;
  name: string;
  email: string;
  tenantId?: string;
  tenantName?: string;
  roleId?: string;
  roleName?: string;
  isActive: boolean;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

const RoleAssignment: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const { roles: rolesData, loading: rolesLoading } = useRolesAPI();

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update roles when rolesData changes
  useEffect(() => {
    if (rolesData) {
      setRoles(rolesData);
    }
  }, [rolesData]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch users, tenants, and roles in parallel
      const [usersResponse, tenantsResponse] = await Promise.all([
        fetch('/api/superadmin/users').then(res => res.json()),
        fetch('/api/superadmin/tenants').then(res => res.json())
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data.users);
      }

      if (tenantsResponse.success) {
        setTenants(tenantsResponse.data.tenants);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTenant = tenantFilter === 'all' || user.tenantId === tenantFilter;
      const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
      return matchesSearch && matchesTenant && matchesRole;
    });
  }, [users, searchTerm, tenantFilter, roleFilter]);

  // Handle role assignment
  const handleRoleAssignment = async (userId: string, roleId: string | null) => {
    try {
      setUpdatingUser(userId);
      
      const response = await fetch(`/api/superadmin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user in local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                roleId: roleId || undefined,
                roleName: roleId ? roles.find(r => r.id === roleId)?.name : undefined
              }
            : user
        ));
        
        showToast(
          roleId 
            ? 'Role assigned successfully' 
            : 'Role removed successfully', 
          'success'
        );
      } else {
        throw new Error(data.message || 'Failed to update role');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setUpdatingUser(null);
    }
  };

  // Get unique tenants for filter
  const uniqueTenants = React.useMemo(() => {
    const tenantIds = [...new Set(users.map(u => u.tenantId).filter(Boolean))];
    return tenants.filter(t => tenantIds.includes(t.id));
  }, [users, tenants]);

  // Get unique roles for filter
  const uniqueRoles = React.useMemo(() => {
    const roleIds = [...new Set(users.map(u => u.roleId).filter(Boolean))];
    return roles.filter(r => roleIds.includes(r.id));
  }, [users, roles]);

  if (error) {
    return <ErrorComponent error={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Role Assignment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Assign roles to users across tenants
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
          >
            <option value="all">All Tenants</option>
            {uniqueTenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>

          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assign Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">
                          {searchTerm || tenantFilter !== 'all' || roleFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No users available for role assignment'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                              <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
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
                            {user.tenantName || 'No Tenant'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.roleName ? (
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {user.roleName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            No role assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.roleId || ''}
                          onChange={(e) => handleRoleAssignment(user.id, e.target.value || null)}
                          disabled={updatingUser === user.id}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
                        >
                          <option value="">No Role</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary */}
      {!loading && filteredUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredUsers.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Users
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredUsers.filter(u => u.roleId).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Users with Roles
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredUsers.filter(u => !u.roleId).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Users without Roles
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAssignment; 