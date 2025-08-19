"use client";

import React, { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Shield, Check, X } from 'lucide-react';
import { useCreateRole, useTenantPermissions } from '@/hooks/useTenantRolesAPI';
import Button from '@/components/ui/button/Button';
import { toast } from 'react-hot-toast';

// Role creation form validation schema
const createRoleSchema = z.object({
  name: z.string()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must be less than 50 characters'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission must be selected')
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export default function CreateRolePage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: []
    }
  });

  // Fetch available permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useTenantPermissions(tenantSlug);
  const createRoleMutation = useCreateRole(tenantSlug);

  // Watch form values
  const watchedName = watch('name');
  const watchedDescription = watch('description');

  // Handle permission selection
  const handlePermissionToggle = useCallback((permissionId: string) => {
    setSelectedPermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      
      // Update form value
      setValue('permissions', newPermissions);
      return newPermissions;
    });
  }, [setValue]);

  // Handle module expansion toggle
  const toggleModuleExpansion = useCallback((moduleName: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleName)) {
        newSet.delete(moduleName);
      } else {
        newSet.add(moduleName);
      }
      return newSet;
    });
  }, []);

  // Handle form submission
  const onSubmit = useCallback(async (data: CreateRoleFormData) => {
    try {
      await createRoleMutation.mutateAsync({
        name: data.name,
        description: data.description,
        permissions: selectedPermissions
      });
      
      router.push(`/${tenantSlug}/roles`);
    } catch (error) {
      console.error('Error creating role:', error);
    }
  }, [createRoleMutation, selectedPermissions, router, tenantSlug]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/${tenantSlug}/roles`);
  }, [router, tenantSlug]);

  // Loading state
  if (isLoadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Role
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Define a new role with specific permissions
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Role Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter role name (e.g., Content Manager, Data Analyst)"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Role Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the role's purpose and responsibilities"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Permissions Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permissions
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedPermissions.length} permission(s) selected
              </span>
              {selectedPermissions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPermissions([]);
                    setValue('permissions', []);
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {errors.permissions && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.permissions.message}
              </p>
            </div>
          )}

          {/* Modules and Permissions */}
          <div className="space-y-4">
            {permissionsData?.modules.map((module) => (
              <div key={module.name} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                {/* Module Header */}
                <button
                  type="button"
                  onClick={() => toggleModuleExpansion(module.name)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                        {module.name.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {module.permissions.filter(p => selectedPermissions.includes(p.id)).length} / {module.permissions.length}
                    </span>
                    <div className={`transform transition-transform ${expandedModules.has(module.name) ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                </button>

                {/* Module Permissions */}
                {expandedModules.has(module.name) && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {module.permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedPermissions.includes(permission.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedPermissions.includes(permission.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedPermissions.includes(permission.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white capitalize">
                              {permission.action.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            {permission.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={handleCancel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || createRoleMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting || createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  );
} 