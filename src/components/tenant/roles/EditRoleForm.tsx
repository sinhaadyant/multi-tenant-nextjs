"use client";

import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { UpdateRoleData, RolePermission, Module, validateUpdateRole, Role } from '@/hooks/useTenantRolesAPI';

interface EditRoleFormProps {
  role: Role;
  modules: Module[];
  onSubmit: (data: UpdateRoleData) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const EditRoleForm: React.FC<EditRoleFormProps> = ({
  role,
  modules,
  onSubmit,
  loading,
  onCancel
}) => {
  const [formData, setFormData] = useState<UpdateRoleData>({
    name: role.name,
    description: role.description || '',
    color: role.color || '#3b82f6',
    permissions: role.permissions
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form data when role changes
  useEffect(() => {
    setFormData({
      name: role.name,
      description: role.description || '',
      color: role.color || '#3b82f6',
      permissions: role.permissions
    });
    setErrors([]);
    setTouched({});
  }, [role]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handlePermissionChange = (moduleKey: string, permission: keyof RolePermission, checked: boolean) => {
    setFormData(prev => {
      const existingPermission = prev.permissions?.find(p => p.moduleKey === moduleKey);
      
      if (existingPermission) {
        // Update existing permission
        return {
          ...prev,
          permissions: prev.permissions?.map(p =>
            p.moduleKey === moduleKey
              ? { ...p, [permission]: checked }
              : p
          ) || []
        };
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
        
        return {
          ...prev,
          permissions: [...(prev.permissions || []), newPermission]
        };
      }
    });
  };

  const handleSelectAllPermissions = (moduleKey: string, checked: boolean) => {
    const permissions: (keyof RolePermission)[] = ['canCreate', 'canRead', 'canUpdate', 'canDelete', 'canViewAll'];
    
    permissions.forEach(permission => {
      handlePermissionChange(moduleKey, permission, checked);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateUpdateRole(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: any) {
      // Error is handled by the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Please fix the following errors:</span>
          </div>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700 dark:text-red-300">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Information
          </CardTitle>
          <CardDescription>
            Current role details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role ID
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{role.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Badge variant={role.isActive ? "default" : "outline"}>
                {role.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <Badge variant={role.isSystem ? "default" : "outline"}>
                {role.isSystem ? 'System' : 'Custom'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Update the basic details for this role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter role name"
                className={touched.name && !formData.name ? 'border-red-500' : ''}
                disabled={role.isSystem}
              />
              {touched.name && !formData.name && (
                <p className="mt-1 text-sm text-red-500">Role name is required</p>
              )}
              {role.isSystem && (
                <p className="mt-1 text-sm text-gray-500">System roles cannot be renamed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-gray-500">{formData.color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter role description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              maxLength={200}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.description?.length || 0}/200 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissions
          </CardTitle>
          <CardDescription>
            Update the permissions for this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module) => {
              const modulePermissions = formData.permissions?.find(p => p.moduleKey === module.moduleKey);
              const hasAnyPermission = Boolean(modulePermissions && Object.values(modulePermissions).some(v => v === true));
              
              return (
                <div key={module.moduleKey} className={`border rounded-lg p-4 ${hasAnyPermission ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium">{module.moduleName}</h4>
                      {module.description && (
                        <span className="text-sm text-gray-500">({module.description})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Select All</span>
                      <Switch
                        checked={hasAnyPermission}
                        onCheckedChange={(checked) => handleSelectAllPermissions(module.moduleKey, checked === true)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { key: 'canRead', label: 'Read', color: 'bg-blue-100 text-blue-800' },
                      { key: 'canCreate', label: 'Create', color: 'bg-green-100 text-green-800' },
                      { key: 'canUpdate', label: 'Update', color: 'bg-yellow-100 text-yellow-800' },
                      { key: 'canDelete', label: 'Delete', color: 'bg-red-100 text-red-800' },
                      { key: 'canViewAll', label: 'View All', color: 'bg-purple-100 text-purple-800' }
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-2">
                                                 <Checkbox
                           checked={modulePermissions?.[key as keyof RolePermission] || false}
                           onCheckedChange={(checked) => 
                             handlePermissionChange(module.moduleKey, key as keyof RolePermission, checked === true)
                           }
                         />
                        <Badge variant="outline" className={`text-xs ${color}`}>
                          {label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Update Role
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditRoleForm;
