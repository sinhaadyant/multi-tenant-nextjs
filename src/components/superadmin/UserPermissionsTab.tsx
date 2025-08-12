"use client";

import React, { useState, useMemo } from 'react';
import { Key, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';

interface UserPermissionsTabProps {
  user: any;
  permissions: any[];
}

const UserPermissionsTab: React.FC<UserPermissionsTabProps> = ({ user, permissions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Get user's permissions from their role
  const userPermissions = useMemo(() => {
    if (!user.role?.permissions) return [];
    return user.role.permissions;
  }, [user.role]);

  // Get unique modules from user permissions
  const userModules = useMemo(() => {
    return Array.from(new Set(userPermissions.map((p: any) => p.module)));
  }, [userPermissions]);

  // Filter permissions based on search and module
  const filteredPermissions = useMemo(() => {
    let filtered = userPermissions;

    if (searchTerm) {
      filtered = filtered.filter((p: any) =>
        p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedModule !== 'all') {
      filtered = filtered.filter((p: any) => p.module === selectedModule);
    }

    return filtered;
  }, [userPermissions, searchTerm, selectedModule]);

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredPermissions.forEach((permission: any) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  }, [filteredPermissions]);

  const getPermissionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) return '➕';
    if (actionLower.includes('read') || actionLower.includes('view')) return '👁️';
    if (actionLower.includes('update') || actionLower.includes('edit')) return '✏️';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return '🗑️';
    if (actionLower.includes('export')) return '📤';
    if (actionLower.includes('import')) return '📥';
    return '🔑';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          User Permissions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Detailed view of all permissions granted to this user through their role
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Total Permissions
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userPermissions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Active Permissions
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {userPermissions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📁</span>
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Modules Access
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {userModules.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Role
                </p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {user.role?.name || 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Modules</option>
              {userModules.map((module) => (
                <option key={module} value={module}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions List */}
      {filteredPermissions.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
            <div
              key={module}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {module} Module
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {modulePermissions.length} permissions
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modulePermissions.map((permission: any) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <span className="text-lg">{getPermissionIcon(permission.action)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.action}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="light" color="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Granted
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No permissions found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || selectedModule !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'This user has no permissions assigned through their role.'
            }
          </p>
        </div>
      )}

      {/* All Available Permissions Comparison */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Permission Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Permission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {permissions.map((permission) => {
                const hasPermission = userPermissions.some((up: any) => up.id === permission.id);
                return (
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {permission.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                      {permission.module}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {permission.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasPermission ? (
                        <Badge variant="light" color="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Granted
                        </Badge>
                      ) : (
                        <Badge variant="light" color="error" size="sm">
                          <XCircle className="w-3 h-3 mr-1" />
                          Denied
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsTab;
