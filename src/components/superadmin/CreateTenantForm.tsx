"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

import { createTenantSchema, CreateTenantData } from '@/lib/validations/superadmin';
import { useCheckEmail } from '@/hooks/useTenantsAPI';

type CreateTenantFormData = CreateTenantData;

interface CreateTenantFormProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

// Countries list - memoized to prevent re-creation
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
] as const;

// Industry types - memoized to prevent re-creation
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
] as const;

const CreateTenantForm = React.memo(function CreateTenantForm({ onSuccess, onCancel }: CreateTenantFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Memoize form default values to prevent re-creation
  const defaultValues = useMemo(() => ({
    tenantName: '',
    companyName: '',
    subdomain: '',
    tenantType: 'SaaS' as const,
    industryType: '',
    country: '',
    address: '',
    description: '',
    status: true,
    adminFullName: '',
    adminEmail: '',
    adminMobile: '',
    adminPassword: '',
    confirmPassword: ''
  }), []);

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
    defaultValues
  });

  const watchedSubdomain = watch('subdomain');
  const watchedEmail = watch('adminEmail');

  // Email validation hook
  const checkEmailMutation = useCheckEmail();

  // Clear form error when user starts making changes - memoized callback
  const clearFormError = useCallback(() => {
    if (formError) {
      setFormError(null);
    }
  }, [formError]);

  useEffect(() => {
    clearFormError();
  }, [watchedSubdomain, watchedEmail, clearFormError]);

  // Check email availability - memoized callback
  const checkEmail = useCallback(async () => {
    if (!watchedEmail || watchedEmail.length < 5 || !watchedEmail.includes('@')) {
      setEmailAvailable(null);
      setEmailError(null);
      return;
    }

    setEmailChecking(true);
    setEmailError(null);
    
    try {
      const result = await checkEmailMutation.mutateAsync({ email: watchedEmail });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email validation response:', {
          email: watchedEmail,
          result,
          available: result.data.available,
          existsIn: result.data.existsIn,
          details: result.data.details,
          tenantName: result.data.details?.tenantName
        });
      }
      
      if (result.data.available) {
        setEmailAvailable(true);
        setEmailError(null);
        clearErrors('adminEmail');
      } else {
        setEmailAvailable(false);
        let errorMessage = 'Email is not available';
        
        if (result.data.existsIn === 'tenant') {
          errorMessage = `Email is already registered in tenant: ${result.data.details.tenantName || 'Unknown'}`;
        } else if (result.data.existsIn === 'superadmin') {
          errorMessage = 'Email is already registered as a SuperAdmin';
        }
        
        setEmailError(errorMessage);
        setError('adminEmail', { message: errorMessage });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 Email validation error set:', errorMessage);
        }
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailAvailable(false);
      setEmailError('Error checking email availability');
    } finally {
      setEmailChecking(false);
    }
  }, [watchedEmail, setError, clearErrors, checkEmailMutation]);

  useEffect(() => {
    const debounceTimer = setTimeout(checkEmail, 500);
    return () => clearTimeout(debounceTimer);
  }, [checkEmail]);

  // Check subdomain availability - memoized callback
  const checkSubdomain = useCallback(async () => {
    if (!watchedSubdomain || watchedSubdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setSubdomainChecking(true);
    try {
      const response = await api.get(`/superadmin/tenants/check-subdomain?subdomain=${watchedSubdomain}`);
      const available = response.data.available;
      
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
  }, [watchedSubdomain, setError, clearErrors]);

  useEffect(() => {
    const debounceTimer = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(debounceTimer);
  }, [checkSubdomain]);

  // Create tenant mutation - memoized callbacks
  const mutationFn = useCallback(async (data: CreateTenantFormData) => {
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
  }, []);

  const handleMutationSuccess = useCallback((data: any) => {
    setFormError(null); // Clear any previous form errors
    toast.success('Tenant and Admin User created successfully!');
    onSuccess(data);
  }, [onSuccess]);

  const onError = useCallback((error: any) => {
    // Log detailed error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Tenant creation error:', error);
      console.error('Error response:', error.response?.data);
    }
    
    // Show user-friendly error message in form
    let errorMessage = 'Failed to create tenant. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.status === 409) {
      errorMessage = 'A tenant with this subdomain already exists.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Please check your input and try again.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    setFormError(errorMessage);
  }, []);

  const createTenantMutation = useMutation({
    mutationFn,
    onSuccess: handleMutationSuccess,
    onError
  });

    const getPasswordStrength = useCallback((password: string) => {
    if (!password) return { score: 0, label: 'Very Weak', color: 'text-red-500', bgColor: 'bg-red-500', requirements: [] };
    
    const requirements = [];
    let score = 0;
    
    // Length check
    if (password.length >= 8) {
      score++;
      requirements.push({ met: true, text: 'At least 8 characters' });
    } else {
      requirements.push({ met: false, text: 'At least 8 characters' });
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
      requirements.push({ met: true, text: 'One uppercase letter' });
    } else {
      requirements.push({ met: false, text: 'One uppercase letter' });
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score++;
      requirements.push({ met: true, text: 'One lowercase letter' });
    } else {
      requirements.push({ met: false, text: 'One lowercase letter' });
    }
    
    // Number check
    if (/[0-9]/.test(password)) {
      score++;
      requirements.push({ met: true, text: 'One number' });
    } else {
      requirements.push({ met: false, text: 'One number' });
    }
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
      requirements.push({ met: true, text: 'One special character' });
    } else {
      requirements.push({ met: false, text: 'One special character' });
    }
    
    const strengthConfig = [
      { label: 'Very Weak', color: 'text-red-500', bgColor: 'bg-red-500' },
      { label: 'Weak', color: 'text-orange-500', bgColor: 'bg-orange-500' },
      { label: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
      { label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500' },
      { label: 'Strong', color: 'text-green-500', bgColor: 'bg-green-500' }
    ];
    
    const config = strengthConfig[score - 1] || strengthConfig[0];
    
    return {
      score,
      label: config.label,
      color: config.color,
      bgColor: config.bgColor,
      requirements
    };
  }, []);

  const watchedPassword = watch('adminPassword');
  const passwordStrength = useMemo(() => getPasswordStrength(watchedPassword), [getPasswordStrength, watchedPassword]);



  const onSubmit = useCallback((data: any) => {
    console.log('Form submission started with data:', data);
    
    // Custom validation for subdomain and email availability
    let hasErrors = false;
    
    if (subdomainAvailable !== true) {
      setError('subdomain', { 
        message: subdomainAvailable === false 
          ? 'This subdomain is already taken' 
          : 'Please check subdomain availability' 
      });
      hasErrors = true;
    }
    
    if (emailAvailable !== true) {
      setError('adminEmail', { 
        message: emailAvailable === false 
          ? emailError || 'Email is not available'
          : 'Please check email availability' 
      });
      hasErrors = true;
    }
    
    // Additional password strength validation
    if (passwordStrength.score < 3) {
      setError('adminPassword', { 
        message: 'Password is too weak. Please choose a stronger password.' 
      });
      hasErrors = true;
    }
    
    if (hasErrors) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, submitting...');
    createTenantMutation.mutate(data);
  }, [subdomainAvailable, emailAvailable, emailError, passwordStrength.score, setError, createTenantMutation]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8" data-testid="create-tenant-form">
        {/* Form Error Display */}
        {formError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-300" data-testid="validation-error">{formError}</p>
            </div>
          </div>
        )}
        
        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Subdomain Available: {subdomainAvailable?.toString() || 'null'}</div>
              <div>Email Available: {emailAvailable?.toString() || 'null'}</div>
              <div>Password Score: {passwordStrength.score}</div>
              <div>Form Errors: {Object.keys(errors).length}</div>
              <div>Is Submitting: {isSubmitting.toString()}</div>
              <div>Mutation Pending: {createTenantMutation.isPending.toString()}</div>
            </div>
          </div>
        )}
        
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
                    name="name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.tenantName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter tenant name"
                  />
                )}
              />
              {errors.tenantName && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.tenantName.message}</p>
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
                    name="company"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter company name"
                  />
                )}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.companyName.message}</p>
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
                        name="subdomain"
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
                <div className="absolute right-16 top-2">
                  {subdomainChecking && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {subdomainAvailable === true && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {subdomainAvailable === false && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {errors.subdomain && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.subdomain.message}</p>
              )}
              {subdomainAvailable === true && (
                <p className="mt-1 text-sm text-green-500">Subdomain is available</p>
              )}
              {subdomainAvailable === false && (
                <p className="mt-1 text-sm text-red-500">Subdomain is not available</p>
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
                    name="plan"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.tenantType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select plan</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                )}
              />
              {errors.tenantType && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.tenantType.message}</p>
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
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.country.message}</p>
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter tenant description"
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
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.adminFullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Controller
                  name="adminEmail"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      name="email"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.adminEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  )}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailChecking && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {emailAvailable === true && !emailChecking && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {emailAvailable === false && !emailChecking && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {errors.adminEmail && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.adminEmail.message}</p>
              )}
              {emailError && !errors.adminEmail && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
              {emailAvailable === true && !emailChecking && !errors.adminEmail && !emailError && (
                <p className="mt-1 text-sm text-green-500">Email is available</p>
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
                    name="phone"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.adminMobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                )}
              />
              {errors.adminMobile && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.adminMobile.message}</p>
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
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.adminPassword.message}</p>
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
                              ? passwordStrength.bgColor.replace('bg-', 'bg-')
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {passwordStrength.requirements.map((req, index) => (
                      <li key={index} className={`flex items-center ${req.met ? 'text-green-500' : 'text-red-500'}`}>
                        {req.met ? (
                          <Check className="w-3 h-3 mr-1" />
                        ) : (
                          <X className="w-3 h-3 mr-1" />
                        )}
                        {req.text}
                      </li>
                    ))}
                  </ul>
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
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.confirmPassword.message}</p>
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
            data-testid="create-tenant-submit"
            disabled={
              isSubmitting || 
              createTenantMutation.isPending || 
              subdomainAvailable !== true || 
              emailAvailable !== true ||
              passwordStrength.score < 3 ||
              Object.keys(errors).length > 0
            }
            onClick={() => {
              console.log('Submit button clicked');
              console.log('Form state:', {
                isSubmitting,
                mutationPending: createTenantMutation.isPending,
                subdomainAvailable,
                emailAvailable,
                passwordScore: passwordStrength.score,
                errors: Object.keys(errors)
              });
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {(isSubmitting || createTenantMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isSubmitting || createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
          </button>
          
          {/* Validation Status */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            <div className="flex items-center space-x-4">
              <span className={`flex items-center ${subdomainAvailable === true ? 'text-green-500' : 'text-red-500'}`}>
                {subdomainAvailable === true ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                Subdomain
              </span>
              <span className={`flex items-center ${emailAvailable === true ? 'text-green-500' : 'text-red-500'}`}>
                {emailAvailable === true ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                Email
              </span>
              <span className={`flex items-center ${passwordStrength.score >= 3 ? 'text-green-500' : 'text-red-500'}`}>
                {passwordStrength.score >= 3 ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                Password
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});

export default CreateTenantForm; 