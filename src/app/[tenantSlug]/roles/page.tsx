"use client";

import React, { useState, useEffect } from 'react';
import { useDynamicPermissions } from '@/context/DynamicPermissionsContext';
import PrivateRoute from '@/components/auth/PrivateRoute';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Check,
  X,
  Loader2
} from 'lucide-react';
import axios from 'axios';

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isTemplate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Module {
  moduleKey: string;
  moduleName: string;
  description: string;
  permissions: Array<{
    id: string;
    name: string;
    action: string;
    description: string;
  }>;
}

interface RolePermissions {
  role: Role;
  currentPermissions: { [key: string]: string[] };
  availableModules: Module[];
  totalAssignedPermissions: number;
  totalAvailableModules: number;
}

const RolesPageContent = () => {
  const { hasPermission, canAccessModule } = useDynamicPermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<RolePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<{ [key: string]: string[] }>({});

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      const params = new URLSearchParams(window.location.search);
      const tenantSlug = window.location.pathname.split('/')[1];

      const response = await axios.get(`/api/tenant/${tenantSlug}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRoles(response.data.data.roles);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      const tenantSlug = window.location.pathname.split('/')[1];

      const response = await axios.get(`/api/tenant/${tenantSlug}/roles/assign?roleId=${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedRole(response.data.data);
        setSelectedPermissions(response.data.data.currentPermissions);
        setShowAssignModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch role permissions');
    }
  };

  const assignPermissions = async () => {
    if (!selectedRole) return;

    try {
      setIsAssigning(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      const tenantSlug = window.location.pathname.split('/')[1];

      const response = await axios.post(`/api/tenant/${tenantSlug}/roles/assign`, {
        roleId: selectedRole.role.id,
        modulePermissions: selectedPermissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowAssignModal(false);
        setSelectedRole(null);
        setSelectedPermissions({});
        // Refresh roles list
        await fetchRoles();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign permissions');
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePermissionToggle = (moduleKey: string, action: string) => {
    setSelectedPermissions(prev => {
      const current = prev[moduleKey] || [];
      const updated = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      
      return {
        ...prev,
        [moduleKey]: updated
      };
    });
  };

  const handleModuleToggle = (moduleKey: string, checked: boolean) => {
    if (!selectedRole) return;

    const module = selectedRole.availableModules.find(m => m.moduleKey === moduleKey);
    if (!module) return;

    if (checked) {
      // Add all permissions for this module
      const allActions = module.permissions.map(p => p.action);
      setSelectedPermissions(prev => ({
        ...prev,
        [moduleKey]: allActions
      }));
    } else {
      // Remove all permissions for this module
      setSelectedPermissions(prev => {
        const updated = { ...prev };
        delete updated[moduleKey];
        return updated;
      });
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and assign permissions to control user access
          </p>
        </div>
        {hasPermission('roles', 'create') && (
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {role.isTemplate ? 'Template Role' : 'Custom Role'}
                  </p>
                </div>
              </div>
              {role.isDefault && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  Default
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">{role.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
              <span className={role.isActive ? 'text-green-600' : 'text-red-600'}>
                {role.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex space-x-2">
              {hasPermission('roles', 'view') && (
                <button
                  onClick={() => fetchRolePermissions(role.id)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
              )}
              {hasPermission('roles', 'edit') && (
                <button className="flex-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center justify-center space-x-1">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              {hasPermission('roles', 'delete') && !role.isDefault && (
                <button className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Assignment Modal */}
      {showAssignModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Assign Permissions - {selectedRole.role.name}
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedRole.availableModules.map((module) => (
                  <div key={module.moduleKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{module.moduleName}</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPermissions[module.moduleKey]?.length === module.permissions.length}
                          onChange={(e) => handleModuleToggle(module.moduleKey, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">All</span>
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      {module.permissions.map((permission) => (
                        <label key={permission.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedPermissions[module.moduleKey]?.includes(permission.action) || false}
                            onChange={() => handlePermissionToggle(module.moduleKey, permission.action)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {permission.action.charAt(0).toUpperCase() + permission.action.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignPermissions}
                disabled={isAssigning}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isAssigning ? 'Assigning...' : 'Assign Permissions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RolesPage = () => {
  return (
    <PrivateRoute requiredModule="roles" requiredPermission="roles:view">
      <RolesPageContent />
    </PrivateRoute>
  );
};

export default RolesPage; 