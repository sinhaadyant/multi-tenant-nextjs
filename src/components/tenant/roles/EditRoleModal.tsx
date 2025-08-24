"use client";

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { X, Save, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: Array<{
    id: string;
    moduleKey: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
}

interface EditRoleModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  role,
  isOpen,
  onClose,
  onSuccess
}) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: [] as Array<{
      moduleKey: string;
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }>
  });

  const [availableModules] = useState([
    { key: 'users', name: 'Users', description: 'Manage user accounts' },
    { key: 'roles', name: 'Roles', description: 'Manage roles and permissions' },
    { key: 'audit', name: 'Audit Logs', description: 'View system audit logs' },
    { key: 'reports', name: 'Reports', description: 'Generate and view reports' },
    { key: 'notifications', name: 'Notifications', description: 'Manage notifications' },
    { key: 'support', name: 'Support Tickets', description: 'Manage support tickets' },
    { key: 'backup', name: 'Backup & Import', description: 'Manage data backup and import' },
    { key: 'menu', name: 'Menu Management', description: 'Manage navigation menu' }
  ]);

  // Initialize form data when role is loaded
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        color: role.color || '#3B82F6',
        permissions: role.permissions.map(p => ({
          moduleKey: p.moduleKey,
          canRead: p.canRead,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete
        }))
      });
    }
  }, [role]);

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.put(`/api/tenant/${tenantSlug}/roles/${role?.id}`, roleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      onSuccess?.();
      onClose();
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (moduleKey: string, permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.moduleKey === moduleKey 
          ? { ...p, [permission]: value }
          : p
      )
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      await updateRoleMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Role: {role.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter role description..."
            />
          </div>

          {/* Permissions */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Permissions
            </h4>
            <div className="space-y-4">
              {availableModules.map((module) => {
                const existingPermission = formData.permissions.find(p => p.moduleKey === module.key);
                const permission = existingPermission || {
                  moduleKey: module.key,
                  canRead: false,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false
                };

                return (
                  <div key={module.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{module.name}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['canRead', 'canCreate', 'canUpdate', 'canDelete'].map((perm) => (
                        <label key={perm} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={permission[perm as keyof typeof permission] as boolean}
                            onChange={(e) => handlePermissionChange(module.key, perm, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {perm.replace('can', '').charAt(0).toUpperCase() + perm.replace('can', '').slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateRoleMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {updateRoleMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;
