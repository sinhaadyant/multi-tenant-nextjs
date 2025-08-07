"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

import { createTenantSchema, CreateTenantData } from '@/lib/validations/superadmin';

type CreateTenantFormData = CreateTenantData;

interface CreateTenantFormProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

// Countries list
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'ZA', name: 'South Africa' },
];

// Industry types
const industryTypes = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Transportation',
  'Energy',
  'Media & Entertainment',
  'Consulting',
  'Non-Profit',
  'Government',
  'Other'
];

export default function CreateTenantForm({ onSuccess, onCancel }: CreateTenantFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      status: true,
      tenantType: 'SaaS',
      country: '',
      industryType: '',
      address: ''
    }
  });

  const watchedSubdomain = watch('subdomain');

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      if (!watchedSubdomain || watchedSubdomain.length < 3) {
        setSubdomainAvailable(null);
        return;
      }

      setSubdomainChecking(true);
      try {
        const response = await api.get(`/superadmin/tenants/check-subdomain?subdomain=${watchedSubdomain}`);
        const available = response.data.data.available;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Subdomain validation response:', {
            subdomain: watchedSubdomain,
            available,
            responseData: response.data
          });
        }
        
        setSubdomainAvailable(available);
        if (available) {
          clearErrors('subdomain');
        } else {
          setError('subdomain', { message: 'This subdomain is already taken' });
        }
      } catch (error) {
        console.error('Error checking subdomain:', error);
        setSubdomainAvailable(false);
      } finally {
        setSubdomainChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedSubdomain, setError, clearErrors]);

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: CreateTenantFormData) => {
      const response = await api.post('/superadmin/tenants', {
        tenant: {
          name: data.tenantName,
          companyName: data.companyName,
          slug: data.subdomain,
          domain: `${data.subdomain}.example.com`,
          description: `${data.companyName} - ${data.tenantType} tenant`,
          plan: data.tenantType.toLowerCase(),
          region: data.country,
          features: ['analytics', 'api', 'sso'],
          isActive: data.status,
          metadata: {
            industryType: data.industryType,
            address: data.address,
            country: data.country
          }
        },
        admin: {
          name: data.adminFullName,
          email: data.adminEmail,
          password: data.adminPassword,
          contactNumber: data.adminMobile,
          isActive: true
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Tenant and Admin User created successfully!');
      onSuccess(data);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create tenant';
      toast.error(errorMessage);
    }
  });

  const onSubmit = (data: any) => {
    if (subdomainAvailable !== true) {
      toast.error('Please ensure subdomain is available before submitting');
      return;
    }
    createTenantMutation.mutate(data);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
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

  const passwordStrength = getPasswordStrength(watch('adminPassword'));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
        {/* Tenant Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tenant Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Basic information about the tenant organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tenantName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.tenantName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter tenant name"
                  />
                )}
              />
              {errors.tenantName && (
                <p className="mt-1 text-sm text-red-500">{errors.tenantName.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter company name"
                  />
                )}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Controller
                  name="subdomain"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        {...field}
                        type="text"
                        className={`flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.subdomain ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="your-company"
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .example.com
                      </span>
                    </div>
                  )}
                />
                {subdomainChecking && (
                  <div className="absolute right-2 top-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
                {subdomainAvailable === true && (
                  <div className="absolute right-2 top-2">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                )}
                {subdomainAvailable === false && (
                  <div className="absolute right-2 top-2">
                    <X className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>
              {errors.subdomain && (
                <p className="mt-1 text-sm text-red-500">{errors.subdomain.message}</p>
              )}
              {subdomainAvailable === true && (
                <p className="mt-1 text-sm text-green-500">Subdomain is available</p>
              )}
            </div>

            {/* Tenant Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tenantType"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.tenantType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select tenant type</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Custom">Custom</option>
                  </select>
                )}
              />
              {errors.tenantType && (
                <p className="mt-1 text-sm text-red-500">{errors.tenantType.message}</p>
              )}
            </div>

            {/* Industry Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry Type
              </label>
              <Controller
                name="industryType"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select industry type</option>
                    {industryTypes.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setValue('status', !field.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        field.value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          field.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      {field.value ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter company address"
                />
              )}
            />
          </div>
        </div>

        {/* Admin User Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tenant Admin User
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create the admin user for this tenant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="adminFullName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.adminFullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                )}
              />
              {errors.adminFullName && (
                <p className="mt-1 text-sm text-red-500">{errors.adminFullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Controller
                name="adminEmail"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.adminEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                )}
              />
              {errors.adminEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.adminEmail.message}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Controller
                name="adminMobile"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="tel"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.adminMobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                )}
              />
              {errors.adminMobile && (
                <p className="mt-1 text-sm text-red-500">{errors.adminMobile.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Controller
                  name="adminPassword"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.adminPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter password"
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
              {errors.adminPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.adminPassword.message}</p>
              )}
              {watch('adminPassword') && (
                <div className="mt-1">
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm password"
                    />
                  )}
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
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createTenantMutation.isPending || subdomainAvailable !== true}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {(isSubmitting || createTenantMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isSubmitting || createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
} 