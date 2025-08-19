"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Check, AlertCircle, Globe, Building } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';

interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (roleData: any) => Promise<void>;
}

interface Module {
  moduleKey: string;
  moduleName: string;
  description?: string;
  isActive: boolean;
}

interface GranularPermission {
  moduleKey: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  onClose,
  onSubmit
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isGlobal: false,
    tenantId: ''
  });
  const [selectedPermissions, setSelectedPermissions] = useState<GranularPermission[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  // Fetch modules on mount
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setModulesLoading(true);
      const response = await fetch('/api/superadmin/modules');
      const data = await response.json();
      
      if (data.success) {
        setModules(data.modules || data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load modules');
      }
    } catch (error: any) {
      showToast('Failed to load modules', 'error');
    } finally {
      setModulesLoading(false);
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

    if (!formData.isGlobal && !formData.tenantId) {
      newErrors.tenantId = 'Tenant ID is required for tenant roles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const roleData = {
        ...formData,
        permissions: selectedPermissions
      };
      
      await onSubmit(roleData);
      handleClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      isGlobal: false,
      tenantId: ''
    });
    setSelectedPermissions([]);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handlePermissionChange = (moduleKey: string, field: keyof GranularPermission, value: boolean) => {
    setSelectedPermissions(prev => {
      const existing = prev.find(p => p.moduleKey === moduleKey);
      if (existing) {
        return prev.map(p => 
          p.moduleKey === moduleKey 
            ? { ...p, [field]: value }
            : p
        );
      } else {
        return [...prev, {
          moduleKey,
          canCreate: field === 'canCreate' ? value : false,
          canRead: field === 'canRead' ? value : false,
          canUpdate: field === 'canUpdate' ? value : false,
          canDelete: field === 'canDelete' ? value : false,
          canViewAll: field === 'canViewAll' ? value : false,
        }];
      }
    });
  };

  const getPermissionValue = (moduleKey: string, field: keyof GranularPermission): boolean => {
    const permission = selectedPermissions.find(p => p.moduleKey === moduleKey);
    return permission ? permission[field] : false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Role</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Define role permissions and access levels</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Type *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="roleType"
                      checked={formData.isGlobal}
                      onChange={() => setFormData(prev => ({ ...prev, isGlobal: true, tenantId: '' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Global Role</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="roleType"
                      checked={!formData.isGlobal}
                      onChange={() => setFormData(prev => ({ ...prev, isGlobal: false }))}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Tenant Role</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter role description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Module Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Module Permissions</h3>
              
              {modulesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading modules...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {modules.map((module) => (
                    <div key={module.moduleKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        {module.moduleName}
                      </h4>
                      {module.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {module.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(module.moduleKey, 'canCreate')}
                            onChange={(e) => handlePermissionChange(module.moduleKey, 'canCreate', e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Create</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(module.moduleKey, 'canRead')}
                            onChange={(e) => handlePermissionChange(module.moduleKey, 'canRead', e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Read</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(module.moduleKey, 'canUpdate')}
                            onChange={(e) => handlePermissionChange(module.moduleKey, 'canUpdate', e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Update</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(module.moduleKey, 'canDelete')}
                            onChange={(e) => handlePermissionChange(module.moduleKey, 'canDelete', e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Delete</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(module.moduleKey, 'canViewAll')}
                            onChange={(e) => handlePermissionChange(module.moduleKey, 'canViewAll', e.target.checked)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">View All</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Create Role</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal; 