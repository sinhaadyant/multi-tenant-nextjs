"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, UserPlus, Eye, EyeOff, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Button from '@/components/ui/button/Button';

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
}

export default function CreateUserPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const tenantSlug = params.tenantSlug as string;

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

  // Data state
  const [roles, setRoles] = useState<Role[]>([]);

  // Load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
        const response = await fetch(`/api/tenant/${tenantSlug}/roles?page=1&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
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

    if (tenantSlug) {
      loadRoles();
    }
  }, [tenantSlug]);

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
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/tenant/${tenantSlug}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles'] });
      
      router.push(`/${tenantSlug}/users`);
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
        onConfirm: () => router.push(`/${tenantSlug}/users`),
      });
    } else {
      router.push(`/${tenantSlug}/users`);
    }
  };

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
              Add a new user to your organization
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
                        <div className="w-2 h-2 bg-white rounded-full"></div>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Select one role for the user
            </p>
            {touched.roleIds && errors.roleIds && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.roleIds}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
