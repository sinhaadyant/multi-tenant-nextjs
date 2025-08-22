"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useDataConsistency } from '@/lib/dataConsistency';
import { ArrowLeft, Save, UserPlus, Eye, EyeOff, Check, Shield, Users } from 'lucide-react';
import { useTenant, useTenantRoles } from '@/hooks/useTenantsAPI';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import TenantSkeleton from '@/components/superadmin/TenantSkeleton';
import Button from '@/components/ui/button/Button';
import RoleCard from '@/components/common/RoleCard';

interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber?: string;
  roleIds: string[];
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  color?: string;
  priority?: number;
}

export default function CreateUserPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { invalidateUserData, invalidateTenantData } = useDataConsistency();
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
    roleIds: [],
    isActive: true
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = useTenant(tenantId);
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useTenantRoles(tenantId);

  const tenant = tenantData?.data?.tenant;
  const roles = rolesData?.data?.roles || [];



  // Form validation
  const validateForm = (): { isValid: boolean; fieldErrors: Record<string, string> } => {
    const fieldErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      fieldErrors.name = 'Name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      fieldErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      fieldErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      fieldErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.roleIds || formData.roleIds.length === 0) {
      fieldErrors.roleIds = 'A role must be selected';
    } else if (formData.roleIds.length > 1) {
      fieldErrors.roleIds = 'Only one role can be selected';
    }

    return { isValid: Object.keys(fieldErrors).length === 0, fieldErrors };
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
      setErrors(validation.fieldErrors);
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(validation.fieldErrors).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(allTouched);
      toast.error('Please fill in all required details');
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
          roleIds: formData.roleIds,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      toast.success('User created successfully!');
      
      // Invalidate all relevant queries to ensure data consistency
      try {
        invalidateUserData(tenantId);
        invalidateTenantData(tenantId);
      } catch (e) {
        console.warn('Query invalidation failed:', e);
      }
      
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
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Mark field as touched
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  // Handle role selection (single selection only)
  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => {
      const currentRoles = prev.roleIds || [];
      // If the role is already selected, deselect it
      if (currentRoles.includes(roleId)) {
        return {
          ...prev,
          roleIds: []
        };
      }
      // Otherwise, select only this role (single selection)
      return {
        ...prev,
        roleIds: [roleId]
      };
    });
    
    // Clear error when user selects a role
    if (errors.roleIds) {
      setErrors(prev => ({ ...prev, roleIds: '' }));
    }
    
    // Mark field as touched
    if (!touched.roleIds) {
      setTouched(prev => ({ ...prev, roleIds: true }));
    }
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

  if (tenantLoading || rolesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-48"></div>
        </div>
        <TenantSkeleton />
      </div>
    );
  }

  if (tenantError || rolesError || !tenant) {
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
                Error loading data
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {tenantError?.message || rolesError?.message || 'An error occurred while loading the data.'}
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
                  onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    touched.name && errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="Enter full name"
                  required
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                )}
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
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    touched.email && errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="Enter email address"
                  required
                />
                {touched.email && errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                )}
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
                  onBlur={() => setTouched(prev => ({ ...prev, contactNumber: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    touched.contactNumber && errors.contactNumber
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="Enter contact number"
                />
                {touched.contactNumber && errors.contactNumber && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.contactNumber}</p>
                )}
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
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      touched.password && errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    }`}
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
                {touched.password && errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
                )}
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
                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      touched.confirmPassword && errors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    }`}
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
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

                    {/* Role Assignment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Role Assignment</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>{roles.length} role{roles.length !== 1 ? 's' : ''} available</span>
              </div>
            </div>
            
            {rolesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading roles...</p>
              </div>
            ) : rolesError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error loading roles
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {rolesError?.message || 'Failed to load roles. Please try refreshing the page.'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      isSelected={formData.roleIds.includes(role.id)}
                      onClick={handleRoleToggle}
                      showDetails={true}
                    />
                  ))}
                </div>
                
                {roles.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No roles available for this tenant</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Contact your administrator to create roles for this tenant
                    </p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Role Selection</p>
                      <p>Select one role for the user. The role determines the user's permissions and access levels within the tenant.</p>
                    </div>
                  </div>
                </div>
                
                {touched.roleIds && errors.roleIds && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.roleIds}</p>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
