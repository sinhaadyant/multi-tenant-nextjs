"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';
import { usePermissionsAPI } from '@/hooks/usePermissionsAPI';
import { Role } from '@/hooks/useRolesAPI';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: any) => Promise<void>;
  role: Role;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    isGlobal: role.isGlobal,
    isActive: role.isActive
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role.permissions.map(p => p.id)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const { fetchPermissions } = usePermissionsAPI();

  // Load permissions and set initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      setFormData({
        name: role.name,
        description: role.description || '',
        isGlobal: role.isGlobal,
        isActive: role.isActive
      });
      setSelectedPermissions(role.permissions.map(p => p.id));
      setErrors({});
    }
  }, [isOpen, role]);

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const permissions = await fetchPermissions();
      
      // Group permissions by module
      const grouped = permissions.reduce((groups: PermissionGroup[], permission: Permission) => {
        const existingGroup = groups.find(g => g.module === permission.module);
        if (existingGroup) {
          existingGroup.permissions.push(permission);
        } else {
          groups.push({
            module: permission.module,
            permissions: [permission]
          });
        }
        return groups;
      }, []);
      
      setPermissionGroups(grouped);
    } catch (error: any) {
      showToast('Failed to load permissions', 'error');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Role name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Role name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        permissions: selectedPermissions
      });
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle permission selection
  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Handle select all permissions in a group
  const handleSelectAllInGroup = (module: string, select: boolean) => {
    const group = permissionGroups.find(g => g.module === module);
    if (!group) return;

    const permissionIds = group.permissions.map(p => p.id);
    
    setSelectedPermissions(prev => {
      if (select) {
        // Add all permissions from this group
        const newPermissions = [...prev];
        permissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      } else {
        // Remove all permissions from this group
        return prev.filter(id => !permissionIds.includes(id));
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg">
              <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Role: {role.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update role details and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Basic Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter role name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Enter role description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-24 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isGlobal" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Global Role (applies to all tenants)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Active Role
                  </label>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Permissions
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPermissions.length} selected
                </div>
              </div>

              {permissionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {permissionGroups.map((group) => (
                    <div key={group.module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                          {group.module}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAllInGroup(group.module, true)}
                            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectAllInGroup(group.module, false)}
                            className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {permission.name}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              startIcon={isSubmitting ? undefined : <Save className="w-4 h-4" />}
            >
              {isSubmitting ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoleModal; 