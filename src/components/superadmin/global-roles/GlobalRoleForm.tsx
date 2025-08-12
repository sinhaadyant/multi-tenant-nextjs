"use client";

import React, { useState, useEffect } from 'react';
import { X, Shield, Key, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { GlobalRole, Module, Permission } from '@/hooks/useGlobalRolesAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Textarea from '@/components/form/textarea/TextareaField';

interface GlobalRoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: any) => void;
  role?: GlobalRole | null;
  modules: Module[];
  loading: boolean;
}

interface ModuleWithChecked extends Module {
  checked: boolean;
  indeterminate: boolean;
  permissions: (Permission & { checked: boolean })[];
}

const GlobalRoleForm: React.FC<GlobalRoleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  modules,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [modulesWithChecked, setModulesWithChecked] = useState<ModuleWithChecked[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [role]);

  // Initialize modules with checked state
  useEffect(() => {
    const rolePermissionIds = new Set(role?.permissions?.map(p => p.id) || []);
    
    const modulesWithCheckedState = modules.map(module => ({
      ...module,
      checked: false,
      indeterminate: false,
      permissions: module.permissions.map(permission => ({
        ...permission,
        checked: rolePermissionIds.has(permission.id)
      }))
    }));

    // Calculate module checked states
    modulesWithCheckedState.forEach(module => {
      const checkedPermissions = module.permissions.filter(p => p.checked);
      const totalPermissions = module.permissions.length;
      
      if (checkedPermissions.length === 0) {
        module.checked = false;
        module.indeterminate = false;
      } else if (checkedPermissions.length === totalPermissions) {
        module.checked = true;
        module.indeterminate = false;
      } else {
        module.checked = false;
        module.indeterminate = true;
      }
    });

    setModulesWithChecked(modulesWithCheckedState);
  }, [modules, role]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle module checkbox change
  const handleModuleCheckboxChange = (moduleKey: string, checked: boolean) => {
    setModulesWithChecked(prev => prev.map(module => {
      if (module.moduleKey === moduleKey) {
        return {
          ...module,
          checked,
          indeterminate: false,
          permissions: module.permissions.map(permission => ({
            ...permission,
            checked
          }))
        };
      }
      return module;
    }));
  };

  // Handle permission checkbox change
  const handlePermissionCheckboxChange = (moduleKey: string, permissionId: string, checked: boolean) => {
    setModulesWithChecked(prev => prev.map(module => {
      if (module.moduleKey === moduleKey) {
        const updatedPermissions = module.permissions.map(permission => 
          permission.id === permissionId ? { ...permission, checked } : permission
        );
        
        const checkedPermissions = updatedPermissions.filter(p => p.checked);
        const totalPermissions = updatedPermissions.length;
        
        let moduleChecked = false;
        let moduleIndeterminate = false;
        
        if (checkedPermissions.length === 0) {
          moduleChecked = false;
          moduleIndeterminate = false;
        } else if (checkedPermissions.length === totalPermissions) {
          moduleChecked = true;
          moduleIndeterminate = false;
        } else {
          moduleChecked = false;
          moduleIndeterminate = true;
        }
        
        return {
          ...module,
          checked: moduleChecked,
          indeterminate: moduleIndeterminate,
          permissions: updatedPermissions
        };
      }
      return module;
    }));
  };

  // Toggle module expansion
  const toggleModuleExpansion = (moduleKey: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey);
      } else {
        newSet.add(moduleKey);
      }
      return newSet;
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }
    
    if (formData.name.trim().length < 2) {
      newErrors.name = 'Role name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const selectedPermissions = modulesWithChecked
      .flatMap(module => module.permissions)
      .filter(permission => permission.checked)
      .map(permission => permission.id);
    
    const roleData = {
      ...formData,
      permissions: selectedPermissions
    };
    
    onSubmit(roleData);
  };

  // Get all selected permissions
  const getSelectedPermissions = () => {
    return modulesWithChecked
      .flatMap(module => module.permissions)
      .filter(permission => permission.checked);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {role ? 'Edit Global Role' : 'Create Global Role'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {role ? 'Update the global role and its permissions' : 'Create a new global role that can be used across all tenants'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter role name"
                    error={errors.name}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter role description"
                    rows={3}
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Module Permissions
                  </h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getSelectedPermissions().length} permissions selected
                  </span>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                  {modulesWithChecked.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No modules available
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {modulesWithChecked.map((module) => (
                        <div key={module.moduleKey} className="p-4">
                          {/* Module Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              type="button"
                              onClick={() => toggleModuleExpansion(module.moduleKey)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {expandedModules.has(module.moduleKey) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            
                            <input
                              type="checkbox"
                              checked={module.checked}
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate = module.indeterminate;
                                }
                              }}
                              onChange={(e) => handleModuleCheckboxChange(module.moduleKey, e.target.checked)}
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                            
                            <div className="flex items-center gap-2">
                              {module.icon && (
                                <span className="text-gray-400">{module.icon}</span>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {module.moduleName}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({module.permissions.length} permissions)
                              </span>
                            </div>
                          </div>

                          {/* Module Description */}
                          {module.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 ml-7 mb-3">
                              {module.description}
                            </p>
                          )}

                          {/* Permissions List */}
                          {expandedModules.has(module.moduleKey) && (
                            <div className="ml-7 space-y-2">
                              {module.permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={permission.checked}
                                    onChange={(e) => handlePermissionCheckboxChange(module.moduleKey, permission.id, e.target.checked)}
                                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {permission.name}
                                    </div>
                                    {permission.description && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {permission.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              onClick={handleSubmit}
              variant="primary"
              disabled={loading}
              className="w-full sm:w-auto sm:ml-3"
            >
              {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalRoleForm;
