"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Shield } from 'lucide-react';
import { Role, CreateRoleData, UpdateRoleData } from '@/hooks/useRolesPermissionsAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => Promise<void>;
  role?: Role | null;
  loading?: boolean;
}

interface FormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

const RoleForm: React.FC<RoleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  loading = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setErrors({});
  }, [role]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Role name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Role name must be less than 50 characters';
    }

    // Description validation (optional)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      };

      await onSubmit(submitData);
      
      // Reset form on success
      setFormData({
        name: '',
        description: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: ''
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {role ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {role ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="roleName"
              type="text"
              placeholder="Enter role name (e.g., Admin, Manager, User)"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              disabled={isSubmitting}
              className="w-full"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Role names must be unique within the tenant
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <TextArea
                placeholder="Describe the role's purpose and responsibilities (optional)"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                disabled={isSubmitting}
                error={!!errors.description}
                hint={errors.description}
                rows={3}
                className="w-full"
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Role Permissions
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {role 
                    ? 'You can manage permissions for this role after creation.'
                    : 'After creating the role, you can assign specific module permissions.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {role ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {role ? 'Update Role' : 'Create Role'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;
