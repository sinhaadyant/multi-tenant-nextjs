"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Key, Settings } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';
import { usePermissionsAPI, Permission } from '@/hooks/usePermissionsAPI';
import { ErrorComponent } from '@/components/superadmin/ErrorComponent';

const PermissionGroups: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchPermissions, createPermission, updatePermission, deletePermission } = usePermissionsAPI();

  // Fetch permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPermissions();
      setPermissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load permissions');
      showToast('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter permissions
  const filteredPermissions = React.useMemo(() => {
    let filtered = permissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesModule = moduleFilter === 'all' || permission.module === moduleFilter;
      return matchesSearch && matchesModule;
    });

    return filtered;
  }, [permissions, searchTerm, moduleFilter]);

  // Group permissions by module
  const permissionGroups = React.useMemo(() => {
    const groups: { [key: string]: Permission[] } = {};
    
    filteredPermissions.forEach(permission => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
    });

    return Object.entries(groups).map(([module, perms]) => ({
      module,
      permissions: perms
    }));
  }, [filteredPermissions]);

  // Get unique modules for filter
  const modules = React.useMemo(() => {
    const uniqueModules = [...new Set(permissions.map(p => p.module))];
    return uniqueModules.sort();
  }, [permissions]);

  if (error) {
    return <ErrorComponent error={error} onRetry={loadPermissions} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-6 h-6" />
            Permission Groups
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage permission groups and individual permissions
          </p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Permission
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
          >
            <option value="all">All Modules</option>
            {modules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permission Groups */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {permissionGroups.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No permissions found
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || moduleFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No permissions have been created yet'
                }
              </p>
            </div>
          ) : (
            permissionGroups.map((group) => (
              <div key={group.module} className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg">
                        <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {group.module}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {group.permissions.length} permissions
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Permission
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {permission.name}
                            </h4>
                            {permission.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {permission.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                {permission.action}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {permission.module}
                              </span>
                            </div>
                          </div>
                          <div className="relative ml-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const menu = document.getElementById(`permission-menu-${permission.id}`);
                                if (menu) menu.classList.toggle('hidden');
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            <div
                              id={`permission-menu-${permission.id}`}
                              className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                            >
                              <button
                                onClick={() => {/* TODO: View permission */}}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={() => {/* TODO: Edit permission */}}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Permission
                              </button>
                              <button
                                onClick={() => {/* TODO: Delete permission */}}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permission
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionGroups; 