"use client";

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, User, Shield, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useCreateUser, useTenants, useRoles } from '@/hooks/useUsers';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/Input';
import Label from '@/components/form/Label';
import { createUserSchema, CreateUserData } from '@/lib/validations/superadmin';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createUserMutation = useCreateUser();
  const { data: tenantsData } = useTenants({ limit: 100 });
  const { data: rolesData } = useRoles();

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    setError,
    clearErrors
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      tenantId: '',
      roleId: '',
      department: '',
      location: ''
    }
  });

  const watchedPassword = watch('password');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowPassword(false);
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [isOpen, reset]);

  // Password strength checker
  useEffect(() => {
    if (watchedPassword) {
      const score = getPasswordStrength(watchedPassword);
      setPasswordStrength(score);
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [watchedPassword]);

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];
    
    return {
      score,
      label: labels[score - 1] || '',
      color: colors[score - 1] || ''
    };
  };

  const onSubmit = async (data: CreateUserData) => {
    try {
      await createUserMutation.mutateAsync(data);
      toast.success('User created successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create user';
      toast.error(message);
      
      // Set form errors if validation failed
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          setError(err.field as any, { message: err.message });
        });
      }
    }
  };

  const handleEmailCheck = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      // TODO: Implement email availability check
      // const response = await api.get(`/superadmin/check-email?email=${email}`);
      // if (!response.data.available) {
      //   setError('email', { message: 'Email already exists' });
      // } else {
      //   clearErrors('email');
      // }
    } catch (error) {
      console.error('Email check error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Create New User
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add a new user to the system
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter full name"
                      error={errors.name?.message}
                    />
                  )}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                      error={errors.email?.message}
                      onBlur={(e) => handleEmailCheck(e.target.value)}
                    />
                  )}
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        error={errors.password?.message}
                      />
                    )}
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
                {watchedPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-8 rounded ${
                              level <= passwordStrength.score
                                ? passwordStrength.color.replace('text-', 'bg-')
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tenant */}
              <div>
                <Label htmlFor="tenantId">Tenant *</Label>
                <Controller
                  name="tenantId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select tenant</option>
                      {tenantsData?.data?.tenants?.map((tenant: any) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.slug})
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.tenantId && (
                  <p className="mt-1 text-sm text-red-500">{errors.tenantId.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="roleId">Role</Label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select role (optional)</option>
                      {rolesData?.data?.roles?.map((role: any) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department">Department</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter department"
                    />
                  )}
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter location"
                    />
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createUserMutation.isPending}
                loading={isSubmitting || createUserMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal; 