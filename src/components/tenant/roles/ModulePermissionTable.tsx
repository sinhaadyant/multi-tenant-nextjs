"use client";

import React, { useState } from 'react';
import { Shield, Save, Key } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { Module, RolePermission } from '@/hooks/useTenantRolesAPI';

interface ModulePermissionTableProps {
  modules: Module[];
  rolePermissions: RolePermission[];
  onSavePermissions: (permissions: RolePermission[]) => Promise<void>;
  loading: boolean;
}

const ModulePermissionTable: React.FC<ModulePermissionTableProps> = ({
  modules,
  rolePermissions,
  onSavePermissions,
  loading
}) => {
  const [permissions, setPermissions] = useState<RolePermission[]>(rolePermissions);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePermissionChange = (moduleKey: string, permission: keyof RolePermission, checked: boolean) => {
    setPermissions(prev => {
      const existingPermission = prev.find(p => p.moduleKey === moduleKey);
      
      if (existingPermission) {
        // Update existing permission
        const updated = prev.map(p =>
          p.moduleKey === moduleKey
            ? { ...p, [permission]: checked }
            : p
        );
        setHasChanges(true);
        return updated;
      } else {
        // Create new permission
        const module = modules.find(m => m.moduleKey === moduleKey);
        const newPermission: RolePermission = {
          id: `temp-${moduleKey}`,
          moduleKey,
          moduleName: module?.moduleName || moduleKey,
          canCreate: permission === 'canCreate' ? checked : false,
          canRead: permission === 'canRead' ? checked : false,
          canUpdate: permission === 'canUpdate' ? checked : false,
          canDelete: permission === 'canDelete' ? checked : false,
          canViewAll: permission === 'canViewAll' ? checked : false
        };
        
        setHasChanges(true);
        return [...prev, newPermission];
      }
    });
  };

  const handleSelectAllPermissions = (moduleKey: string, checked: boolean) => {
    const permissionKeys: (keyof RolePermission)[] = ['canCreate', 'canRead', 'canUpdate', 'canDelete', 'canViewAll'];
    
    permissionKeys.forEach(permission => {
      handlePermissionChange(moduleKey, permission, checked);
    });
  };

  const handleSave = async () => {
    try {
      await onSavePermissions(permissions);
      setHasChanges(false);
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleReset = () => {
    setPermissions(rolePermissions);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Module Permissions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure permissions for each module
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Permissions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Read
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Create
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Update
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Delete
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    View All
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Select All
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {modules.map((module) => {
                  const modulePermissions = permissions.find(p => p.moduleKey === module.moduleKey);
                  const hasAnyPermission = modulePermissions && Object.values(modulePermissions).some(v => v === true);
                  
                  return (
                    <tr key={module.moduleKey} className={hasAnyPermission ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.moduleName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {module.moduleKey}
                            </div>
                            {module.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {module.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Checkbox
                          checked={modulePermissions?.canRead || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.moduleKey, 'canRead', checked === true)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Checkbox
                          checked={modulePermissions?.canCreate || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.moduleKey, 'canCreate', checked === true)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Checkbox
                          checked={modulePermissions?.canUpdate || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.moduleKey, 'canUpdate', checked === true)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Checkbox
                          checked={modulePermissions?.canDelete || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.moduleKey, 'canDelete', checked === true)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Checkbox
                          checked={modulePermissions?.canViewAll || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.moduleKey, 'canViewAll', checked === true)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Switch
                          checked={hasAnyPermission}
                          onCheckedChange={(checked) => 
                            handleSelectAllPermissions(module.moduleKey, checked === true)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {permissions.filter(p => p.canRead).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Read Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {permissions.filter(p => p.canCreate).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Create Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {permissions.filter(p => p.canUpdate).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Update Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {permissions.filter(p => p.canDelete).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Delete Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {permissions.filter(p => p.canViewAll).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">View All Access</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModulePermissionTable;
