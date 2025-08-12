"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus, Eye, EyeOff, Check } from 'lucide-react';
import { useTenant } from '@/hooks/useTenantsAPI';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import TenantSkeleton from '@/components/superadmin/TenantSkeleton';
import Button from '@/components/ui/button/Button';

interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber?: string;
  roleId: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export default function CreateUserPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const tenantId = params.id as string;

  // Form state
  const [formData, setFormData] = useState<CreateUserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    roleId: '',
    isActive: true
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data state
  const [roles, setRoles] = useState<Role[]>([]);

  // API hooks
  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = useTenant(tenantId);

  const tenant = tenantData?.data?.tenant;

  // Load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch(`/api/superadmin/tenants/${tenantId}/roles`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('superadmin_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRoles(data.data?.roles || []);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };

    if (tenantId) {
      loadRoles();
    }
  }, [tenantId]);

  // Form validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    if (!formData.roleId) {
      errors.push('A role must be selected');
    }

    return { isValid: errors.length === 0, errors };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  // Submit form data
  const submitForm = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('superadmin_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          contactNumber: formData.contactNumber || undefined,
          roleIds: [formData.roleId],
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      toast.success('User created successfully!');
      router.push(`/superadmin/tenants/${tenantId}`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof CreateUserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleId: roleId
    }));
  };

  // Handle back navigation
  const handleBack = () => {
    if (Object.values(formData).some(value => value !== '' && value !== false && value.length !== 0)) {
      confirm({
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmText: 'Leave',
        variant: 'warning',
        onConfirm: () => router.push(`/superadmin/tenants/${tenantId}`),
      });
    } else {
      router.push(`/superadmin/tenants/${tenantId}`);
    }
  };

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-48"></div>
        </div>
        <TenantSkeleton type="card" />
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create User</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading tenant
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {tenantError?.message || 'An error occurred while loading the tenant data.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create User</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add a new user to {tenant.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={submitForm}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>

          {/* Role Assignment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Role Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.roleIds.includes(role.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => handleRoleToggle(role.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{role.name}</h4>
                      {role.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.roleIds.includes(role.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.roleIds.includes(role.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {roles.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No roles available for this tenant
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
