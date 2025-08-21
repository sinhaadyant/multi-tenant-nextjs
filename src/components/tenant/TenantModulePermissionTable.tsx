"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Save, Check, X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/button/Button';

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

interface Module {
  id: string;
  moduleKey: string;
  moduleName: string;
  description?: string;
  icon?: string;
  path?: string;
  isActive: boolean;
  isVisible: boolean;
  orderIndex: number;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  action: string;
  moduleKey: string;
  resource?: string;
  isActive: boolean;
}

interface TenantModulePermissionTableProps {
  role: TenantRole;
  onSavePermissions: (permissions: any[]) => void;
  loading?: boolean;
}

const TenantModulePermissionTable: React.FC<TenantModulePermissionTableProps> = ({
  role,
  onSavePermissions,
  loading = false
}) => {
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock modules data - in real implementation, this would come from API
  const modules: Module[] = [
    {
      id: '1',
      moduleKey: 'dashboard',
      moduleName: 'Dashboard',
      description: 'Access to dashboard and overview',
      isActive: true,
      isVisible: true,
      orderIndex: 1,
      permissions: [
        { id: '1', name: 'View Dashboard', action: 'view', moduleKey: 'dashboard', isActive: true }
      ]
    },
    {
      id: '2',
      moduleKey: 'users',
      moduleName: 'User Management',
      description: 'Manage users and their accounts',
      isActive: true,
      isVisible: true,
      orderIndex: 2,
      permissions: [
        { id: '2', name: 'View Users', action: 'view', moduleKey: 'users', isActive: true },
        { id: '3', name: 'Create Users', action: 'create', moduleKey: 'users', isActive: true },
        { id: '4', name: 'Update Users', action: 'update', moduleKey: 'users', isActive: true },
        { id: '5', name: 'Delete Users', action: 'delete', moduleKey: 'users', isActive: true }
      ]
    },
    {
      id: '3',
      moduleKey: 'roles',
      moduleName: 'Roles & Permissions',
      description: 'Manage roles and permissions',
      isActive: true,
      isVisible: true,
      orderIndex: 3,
      permissions: [
        { id: '6', name: 'View Roles', action: 'view', moduleKey: 'roles', isActive: true },
        { id: '7', name: 'Create Roles', action: 'create', moduleKey: 'roles', isActive: true },
        { id: '8', name: 'Update Roles', action: 'update', moduleKey: 'roles', isActive: true },
        { id: '9', name: 'Delete Roles', action: 'delete', moduleKey: 'roles', isActive: true }
      ]
    },
    {
      id: '4',
      moduleKey: 'reports',
      moduleName: 'Reports',
      description: 'Generate and view reports',
      isActive: true,
      isVisible: true,
      orderIndex: 4,
      permissions: [
        { id: '10', name: 'View Reports', action: 'view', moduleKey: 'reports', isActive: true },
        { id: '11', name: 'Generate Reports', action: 'create', moduleKey: 'reports', isActive: true },
        { id: '12', name: 'Export Reports', action: 'export', moduleKey: 'reports', isActive: true }
      ]
    },
    {
      id: '5',
      moduleKey: 'audit',
      moduleName: 'Audit Logs',
      description: 'View system audit logs',
      isActive: true,
      isVisible: true,
      orderIndex: 5,
      permissions: [
        { id: '13', name: 'View Audit Logs', action: 'view', moduleKey: 'audit', isActive: true }
      ]
    }
  ];

  // Initialize permissions from role
  useEffect(() => {
    const initialPermissions: Record<string, any> = {};
    
    modules.forEach(module => {
      module.permissions.forEach(permission => {
        const key = `${module.moduleKey}.${permission.action}`;
        const hasPermission = role.permissions.some(rp => 
          rp.module === module.moduleKey && rp.action === permission.action
        );
        initialPermissions[key] = hasPermission;
      });
    });
    
    setPermissions(initialPermissions);
    setHasChanges(false);
  }, [role]);

  // Handle permission toggle
  const handlePermissionToggle = (moduleKey: string, action: string) => {
    const key = `${moduleKey}.${action}`;
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  // Handle module toggle (toggle all permissions for a module)
  const handleModuleToggle = (moduleKey: string, checked: boolean) => {
    const newPermissions = { ...permissions };
    
    modules.forEach(module => {
      if (module.moduleKey === moduleKey) {
        module.permissions.forEach(permission => {
          const key = `${module.moduleKey}.${permission.action}`;
          newPermissions[key] = checked;
        });
      }
    });
    
    setPermissions(newPermissions);
    setHasChanges(true);
  };

  // Check if all permissions for a module are enabled
  const isModuleFullyEnabled = (moduleKey: string) => {
    const modulePermissions = modules
      .find(m => m.moduleKey === moduleKey)
      ?.permissions || [];
    
    return modulePermissions.every(permission => {
      const key = `${moduleKey}.${permission.action}`;
      return permissions[key];
    });
  };

  // Check if any permissions for a module are enabled
  const isModulePartiallyEnabled = (moduleKey: string) => {
    const modulePermissions = modules
      .find(m => m.moduleKey === moduleKey)
      ?.permissions || [];
    
    const enabledCount = modulePermissions.filter(permission => {
      const key = `${moduleKey}.${permission.action}`;
      return permissions[key];
    }).length;
    
    return enabledCount > 0 && enabledCount < modulePermissions.length;
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const permissionsArray = Object.entries(permissions)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => {
          const [moduleKey, action] = key.split('.');
          return { moduleKey, action };
        });
      
      await onSavePermissions(permissionsArray);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    const initialPermissions: Record<string, any> = {};
    
    modules.forEach(module => {
      module.permissions.forEach(permission => {
        const key = `${module.moduleKey}.${permission.action}`;
        const hasPermission = role.permissions.some(rp => 
          rp.module === module.moduleKey && rp.action === permission.action
        );
        initialPermissions[key] = hasPermission;
      });
    });
    
    setPermissions(initialPermissions);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissions for {role.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure which actions this role can perform across different modules
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={loading || isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || isSaving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  View
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Create
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Delete
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Other
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isModuleFullyEnabled(module.moduleKey)}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isModulePartiallyEnabled(module.moduleKey);
                            }
                          }}
                          onChange={(e) => handleModuleToggle(module.moduleKey, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading || isSaving}
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {module.moduleName}
                        </div>
                        {module.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {module.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {module.permissions.some(p => p.action === 'view') && (
                      <input
                        type="checkbox"
                        checked={permissions[`${module.moduleKey}.view`] || false}
                        onChange={() => handlePermissionToggle(module.moduleKey, 'view')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading || isSaving}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {module.permissions.some(p => p.action === 'create') && (
                      <input
                        type="checkbox"
                        checked={permissions[`${module.moduleKey}.create`] || false}
                        onChange={() => handlePermissionToggle(module.moduleKey, 'create')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading || isSaving}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {module.permissions.some(p => p.action === 'update') && (
                      <input
                        type="checkbox"
                        checked={permissions[`${module.moduleKey}.update`] || false}
                        onChange={() => handlePermissionToggle(module.moduleKey, 'update')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading || isSaving}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {module.permissions.some(p => p.action === 'delete') && (
                      <input
                        type="checkbox"
                        checked={permissions[`${module.moduleKey}.delete`] || false}
                        onChange={() => handlePermissionToggle(module.moduleKey, 'delete')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading || isSaving}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {module.permissions.filter(p => !['view', 'create', 'update', 'delete'].includes(p.action)).map(permission => (
                      <div key={permission.id} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          checked={permissions[`${module.moduleKey}.${permission.action}`] || false}
                          onChange={() => handlePermissionToggle(module.moduleKey, permission.action)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading || isSaving}
                        />
                        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                          {permission.name}
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Permission Summary
            </h4>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• Total permissions available: {modules.reduce((acc, module) => acc + module.permissions.length, 0)}</p>
              <p>• Permissions granted: {Object.values(permissions).filter(Boolean).length}</p>
              <p>• Modules with permissions: {modules.filter(module => 
                module.permissions.some(permission => permissions[`${module.moduleKey}.${permission.action}`])
              ).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantModulePermissionTable;
