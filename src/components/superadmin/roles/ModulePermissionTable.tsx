"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Save, Cog, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { Module, Permission } from '@/hooks/useRolesPermissionsAPI';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import Checkbox from '@/components/form/input/Checkbox';

interface ModulePermissionTableProps {
  modules: Module[];
  rolePermissions: Permission[];
  onSavePermissions: (permissions: { moduleId: string; actions: string[] }[]) => Promise<void>;
  loading?: boolean;
}

interface ModulePermissionState {
  [moduleId: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

const ModulePermissionTable: React.FC<ModulePermissionTableProps> = ({
  modules,
  rolePermissions,
  onSavePermissions,
  loading = false
}) => {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<ModulePermissionState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 ModulePermissionTable Debug:', {
        modulesCount: modules?.length || 0,
        rolePermissionsCount: rolePermissions?.length || 0,
        modules: modules?.map(m => ({ id: m.id, moduleKey: m.moduleKey, moduleName: m.moduleName })),
        rolePermissions: rolePermissions?.map(p => ({ moduleKey: p.moduleKey, action: p.action })),
        currentPermissions: permissions
      });
    }
  }, [modules, rolePermissions, permissions]);

  // Initialize permissions from role permissions - Fixed to properly map data
  useEffect(() => {
    const initialPermissions: ModulePermissionState = {};
    
    (modules || []).forEach(module => {
      // Find permissions for this module by matching moduleKey
      const modulePermissions = (rolePermissions || []).filter(p => p.moduleKey === module.moduleKey);
      
      initialPermissions[module.id] = {
        view: modulePermissions.some(p => p.action === 'view'),
        create: modulePermissions.some(p => p.action === 'create'),
        edit: modulePermissions.some(p => p.action === 'edit'),
        delete: modulePermissions.some(p => p.action === 'delete')
      };
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Initialized permissions:', initialPermissions);
    }
    
    setPermissions(initialPermissions);
    setHasChanges(false);
  }, [modules, rolePermissions]);

  // Get all available actions for a module
  const getModuleActions = (module: Module): string[] => {
    return module.permissions?.map(p => p.action) || ['view', 'create', 'edit', 'delete'];
  };

  // Handle permission toggle - Fixed to properly update state
  const handlePermissionToggle = (moduleId: string, action: string) => {
    setPermissions(prev => {
      const currentModulePerms = prev[moduleId] || { view: false, create: false, edit: false, delete: false };
      const newModulePerms = {
        ...currentModulePerms,
        [action]: !currentModulePerms[action as keyof typeof currentModulePerms]
      };
      
      const newPermissions = {
        ...prev,
        [moduleId]: newModulePerms
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Permission toggle:', { moduleId, action, newModulePerms });
      }
      
      return newPermissions;
    });
    setHasChanges(true);
  };

  // Handle select all for a module - Fixed to properly update state
  const handleSelectAllModule = (moduleId: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        view: checked,
        create: checked,
        edit: checked,
        delete: checked
      }
    }));
    setHasChanges(true);
  };

  // Handle select all globally - Fixed to properly update state
  const handleSelectAllGlobal = (checked: boolean) => {
    const newPermissions: ModulePermissionState = {};
    (modules || []).forEach(module => {
      newPermissions[module.id] = {
        view: checked,
        create: checked,
        edit: checked,
        delete: checked
      };
    });
    setPermissions(newPermissions);
    setHasChanges(true);
  };

  // Check if all permissions are selected for a module
  const isModuleAllSelected = (moduleId: string): boolean => {
    const modulePerms = permissions[moduleId];
    if (!modulePerms) return false;
    return Object.values(modulePerms).every(Boolean);
  };

  // Check if any permissions are selected for a module
  const isModuleAnySelected = (moduleId: string): boolean => {
    const modulePerms = permissions[moduleId];
    if (!modulePerms) return false;
    return Object.values(modulePerms).some(Boolean);
  };

  // Check if all modules have all permissions selected
  const isGlobalAllSelected = (): boolean => {
    return (modules || []).every(module => isModuleAllSelected(module.id));
  };

  // Check if any modules have any permissions selected
  const isGlobalAnySelected = (): boolean => {
    return (modules || []).some(module => isModuleAnySelected(module.id));
  };

  // Handle save permissions - Fixed to properly format data
  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      const permissionsToSave = (modules || []).map(module => {
        const modulePerms = permissions[module.id];
        const actions = [];
        
        if (modulePerms?.view) actions.push('view');
        if (modulePerms?.create) actions.push('create');
        if (modulePerms?.edit) actions.push('edit');
        if (modulePerms?.delete) actions.push('delete');
        
        return {
          moduleId: module.moduleKey, // Use moduleKey instead of module.id
          actions
        };
      }).filter(p => p.actions.length > 0);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Saving permissions:', permissionsToSave);
        console.log('🔍 Modules data:', modules.map(m => ({ id: m.id, moduleKey: m.moduleKey, moduleName: m.moduleName })));
        console.log('🔍 ModuleKeys being sent:', permissionsToSave.map(p => p.moduleId));
      }

      await onSavePermissions(permissionsToSave);
      setHasChanges(false);
      showToast('Permissions updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Get permission count for a module
  const getPermissionCount = (moduleId: string): number => {
    const modulePerms = permissions[moduleId];
    if (!modulePerms) return 0;
    return Object.values(modulePerms).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Cog className="w-5 h-5" />
            Module Permissions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure which actions users with this role can perform on each module
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAllGlobal(false)}
            disabled={loading || isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAllGlobal(true)}
            disabled={loading || isSaving}
          >
            <Check className="w-4 h-4 mr-2" />
            Select All
          </Button>
          <Button
            onClick={handleSavePermissions}
            disabled={!hasChanges || loading || isSaving}
            size="sm"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Permissions
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isGlobalAllSelected()}
                      onChange={handleSelectAllGlobal}
                      disabled={loading || isSaving}
                      className="w-4 h-4"
                    />
                    Module
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" />
                    View
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <Plus className="w-4 h-4" />
                    Create
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <Edit className="w-4 h-4" />
                    Edit
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Cog className="w-12 h-12 text-gray-300" />
                      <p className="text-lg font-medium">No modules available</p>
                      <p className="text-sm">Modules will appear here once they are configured</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (modules || []).map((module) => {
                  const modulePerms = permissions[module.id] || { view: false, create: false, edit: false, delete: false };
                  const availableActions = getModuleActions(module);
                  const permissionCount = getPermissionCount(module.id);
                  
                  return (
                    <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isModuleAllSelected(module.id)}
                            onChange={(checked) => handleSelectAllModule(module.id, checked)}
                            disabled={loading || isSaving}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.moduleName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {module.description || 'No description'}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {permissionCount} of {availableActions.length} permissions selected
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* View Permission */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={modulePerms.view || false}
                            onChange={() => handlePermissionToggle(module.id, 'view')}
                            disabled={loading || isSaving || !availableActions.includes('view')}
                            className="w-4 h-4"
                          />
                        </div>
                      </td>
                      
                      {/* Create Permission */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={modulePerms.create || false}
                            onChange={() => handlePermissionToggle(module.id, 'create')}
                            disabled={loading || isSaving || !availableActions.includes('create')}
                            className="w-4 h-4"
                          />
                        </div>
                      </td>
                      
                      {/* Edit Permission */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={modulePerms.edit || false}
                            onChange={() => handlePermissionToggle(module.id, 'edit')}
                            disabled={loading || isSaving || !availableActions.includes('edit')}
                            className="w-4 h-4"
                          />
                        </div>
                      </td>
                      
                      {/* Delete Permission */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={modulePerms.delete || false}
                            onChange={() => handlePermissionToggle(module.id, 'delete')}
                            disabled={loading || isSaving || !availableActions.includes('delete')}
                            className="w-4 h-4"
                          />
                        </div>
                      </td>
                      
                      {/* Module Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllModule(module.id, false)}
                            disabled={loading || isSaving}
                            className="text-xs px-2 py-1"
                          >
                            Clear
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllModule(module.id, true)}
                            disabled={loading || isSaving}
                            className="text-xs px-2 py-1"
                          >
                            All
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{modules.length}</span> modules available
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {hasChanges && (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulePermissionTable;
