"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Shield, Check, Search, Settings, Users, Eye, Edit, Trash2, Save, Loader2, AlertTriangle } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  moduleKey: string;
  moduleName: string;
  action: string;
  resource?: string;
  category?: string;
  isSystem?: boolean;
  isAssigned?: boolean;
}

interface Module {
  moduleKey: string;
  moduleName: string;
  description: string;
  icon?: string;
  path?: string;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isTemplate: boolean;
  isSystem: boolean;
  isActive: boolean;
  color?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Permission[];
}

interface PermissionsModalProps {
  role: Role;
  availableModules: Module[];
  onClose: () => void;
  onSubmit: (permissions: string[]) => void;
  isLoading: boolean;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  role,
  availableModules,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize selected permissions from role's current permissions
  useEffect(() => {
    const currentPermissionIds = new Set(role.permissions.map(p => p.id));
    setSelectedPermissions(currentPermissionIds);
  }, [role]);

  // Filter modules and permissions based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm) return availableModules;

    return availableModules.map(module => ({
      ...module,
      permissions: module.permissions.filter(permission =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(module => module.permissions.length > 0);
  }, [availableModules, searchTerm]);

  // Get module icon
  const getModuleIcon = (moduleKey: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      dashboard: <Eye className="w-4 h-4" />,
      users: <Users className="w-4 h-4" />,
      roles: <Shield className="w-4 h-4" />,
      settings: <Settings className="w-4 h-4" />,
      audit: <Eye className="w-4 h-4" />,
      reports: <Settings className="w-4 h-4" />,
      notifications: <Settings className="w-4 h-4" />,
      support: <Settings className="w-4 h-4" />
    };
    return iconMap[moduleKey] || <Settings className="w-4 h-4" />;
  };

  // Get action color
  const getActionColor = (action: string) => {
    const colorMap: { [key: string]: string } = {
      create: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      read: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
      update: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
      delete: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
      manage: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
      view: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    };
    return colorMap[action] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  // Handle module toggle (select/deselect all permissions in a module)
  const handleModuleToggle = (moduleKey: string, checked: boolean) => {
    const module = availableModules.find(m => m.moduleKey === moduleKey);
    if (!module) return;

    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      const permissionIds = module.permissions.map(p => p.id);
      
      if (checked) {
        permissionIds.forEach(id => newSet.add(id));
      } else {
        permissionIds.forEach(id => newSet.delete(id));
      }
      
      return newSet;
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(Array.from(selectedPermissions));
  };

  // Check if all permissions in a module are selected
  const isModuleFullySelected = (moduleKey: string) => {
    const module = availableModules.find(m => m.moduleKey === moduleKey);
    if (!module) return false;
    return module.permissions.every(p => selectedPermissions.has(p.id));
  };

  // Check if some permissions in a module are selected
  const isModulePartiallySelected = (moduleKey: string) => {
    const module = availableModules.find(m => m.moduleKey === moduleKey);
    if (!module) return false;
    const selectedCount = module.permissions.filter(p => selectedPermissions.has(p.id)).length;
    return selectedCount > 0 && selectedCount < module.permissions.length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              role.color ? `bg-${role.color}-100 text-${role.color}-600` : 'bg-gray-100 text-gray-600'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage Permissions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {role.name} • {selectedPermissions.size} permissions selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Permissions Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredModules.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No permissions found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredModules.map((module) => (
                <div key={module.moduleKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        {getModuleIcon(module.moduleKey)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {module.moduleName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isModuleFullySelected(module.moduleKey)}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = isModulePartiallySelected(module.moduleKey);
                          }
                        }}
                        onChange={(e) => handleModuleToggle(module.moduleKey, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          setExpandedModules(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(module.moduleKey)) {
                              newSet.delete(module.moduleKey);
                            } else {
                              newSet.add(module.moduleKey);
                            }
                            return newSet;
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className={`w-4 h-4 transform transition-transform ${
                          expandedModules.has(module.moduleKey) ? 'rotate-45' : ''
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Module Permissions */}
                  {expandedModules.has(module.moduleKey) && (
                    <div className="p-4">
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {module.permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPermissions.has(permission.id)
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                              }`}
                              onClick={() => handlePermissionToggle(permission.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(permission.action)}`}>
                                      {permission.action}
                                    </span>
                                    {permission.isSystem && (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                        System
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {permission.name}
                                  </h4>
                                  {permission.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-2">
                                  {selectedPermissions.has(permission.id) && (
                                    <Check className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {module.permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPermissions.has(permission.id)
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                              }`}
                              onClick={() => handlePermissionToggle(permission.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(permission.id)}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {permission.name}
                                    </h4>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(permission.action)}`}>
                                      {permission.action}
                                    </span>
                                    {permission.isSystem && (
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                        System
                                      </span>
                                    )}
                                  </div>
                                  {permission.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPermissions.size} of {availableModules.reduce((total, module) => total + module.permissions.length, 0)} permissions selected
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal; 