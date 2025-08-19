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
  const [subdomainBlurChecking, setSubdomainBlurChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>([]);

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

  // Clear form error when user starts typing in relevant fields
  useEffect(() => {
    clearFormError();
    setSubdomainSuggestions([]); // Clear suggestions when user types
  }, [watchedSubdomain, watchedEmail, clearFormError]);

  // Clear email validation state when email changes
  useEffect(() => {
    setEmailError(null);
    clearErrors('adminEmail');
  }, [watchedEmail, clearErrors]);

  // Generate alternative subdomain suggestions
  const generateSubdomainSuggestions = useCallback((baseSubdomain: string) => {
    const suggestions = [];
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    const randomSuffix = Math.random().toString(36).substring(2, 6); // Random 4-char string
    
    suggestions.push(`${baseSubdomain}-${timestamp}`);
    suggestions.push(`${baseSubdomain}-${randomSuffix}`);
    suggestions.push(`${baseSubdomain}-2024`);
    suggestions.push(`${baseSubdomain}-dev`);
    suggestions.push(`${baseSubdomain}-new`);
    
    return suggestions;
  }, []);

  // Check subdomain availability - memoized callback
  const checkSubdomain = useCallback(async () => {
    if (!watchedSubdomain || watchedSubdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(watchedSubdomain)) {
      setSubdomainAvailable(false);
      setError('subdomain', { message: 'Subdomain must contain only lowercase letters, numbers, and hyphens. Cannot start or end with hyphen.' });
      return;
    }

    setSubdomainChecking(true);
    try {
      const response = await api.get(`/superadmin/tenants/check-subdomain?subdomain=${watchedSubdomain}`);
      
      // Debug logging
      console.log('Subdomain check response:', response.data);
      
      if (response.data && response.data.success && response.data.data && typeof response.data.data.available === 'boolean') {
        const available = response.data.data.available;
        console.log('Subdomain available:', available);
        setSubdomainAvailable(available);
        if (available) {
          clearErrors('subdomain');
        } else {
          setError('subdomain', { message: 'This subdomain is already taken' });
        }
      } else {
        console.error('Invalid response format from subdomain check API:', response.data);
        setSubdomainAvailable(false);
        setError('subdomain', { message: 'Error checking subdomain availability' });
      }
    } catch (error: any) {
      console.error('Error checking subdomain:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('subdomain', { message: 'Authentication required. Please log in again.' });
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || error.response.data?.data?.message || 'Invalid subdomain format';
        setError('subdomain', { message: errorMessage });
      } else if (error.response?.status >= 500) {
        setError('subdomain', { message: 'Server error. Please try again later.' });
      } else {
        setError('subdomain', { message: 'Error checking subdomain availability' });
      }
      
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
    // Map tenantType to plan values
    const getPlanFromTenantType = (tenantType: string) => {
      switch (tenantType) {
        case 'SaaS':
          return 'starter';
        case 'Enterprise':
          return 'enterprise';
        case 'Custom':
          return 'professional';
        default:
          return 'starter';
      }
    };

    const response = await api.post('/superadmin/tenants', {
      tenant: {
        name: data.tenantName,
        companyName: data.companyName,
        slug: data.subdomain,
        domain: `${data.subdomain}.example.com`,
        description: `${data.companyName} - ${data.tenantType} tenant`,
        plan: getPlanFromTenantType(data.tenantType),
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
    setSubdomainSuggestions([]); // Clear suggestions
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
    let fieldError = null;
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      
      // Check for specific conflict types and set field-specific errors
      if (error.response.status === 409) {
        // Handle "Resource already exists" error
        if (errorMessage === 'Resource already exists') {
          errorMessage = 'This subdomain or email is already in use. Please try different values.';
          // Generate alternative suggestions for subdomain
          const suggestions = generateSubdomainSuggestions(watchedSubdomain || '');
          setSubdomainSuggestions(suggestions);
        } else if (errorMessage.toLowerCase().includes('subdomain') || errorMessage.toLowerCase().includes('slug')) {
          errorMessage = 'This subdomain is already taken. Please choose a different one.';
          fieldError = { field: 'subdomain', message: 'This subdomain is already taken' };
          // Generate alternative suggestions
          const suggestions = generateSubdomainSuggestions(watchedSubdomain || '');
          setSubdomainSuggestions(suggestions);
        } else if (errorMessage.toLowerCase().includes('email')) {
          errorMessage = 'This admin email is already registered. Please use a different email address.';
          fieldError = { field: 'adminEmail', message: 'This email is already registered' };
          setSubdomainSuggestions([]); // Clear suggestions for email conflicts
        } else {
          errorMessage = 'A conflict occurred. Please check your input and try again.';
          setSubdomainSuggestions([]);
        }
      } else {
        setSubdomainSuggestions([]); // Clear suggestions for other errors
      }
    } else if (error.response?.status === 409) {
      errorMessage = 'A conflict occurred. Please check your input and try again.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Please check your input and try again.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    setFormError(errorMessage);
    
    // Set field-specific error if available
    if (fieldError) {
      setError(fieldError.field as any, { message: fieldError.message });
    }
  }, [setError, generateSubdomainSuggestions, watchedSubdomain]);

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



  const onSubmit = useCallback(async (data: any) => {
    console.log('Form submission started with data:', data);
    
    // Prevent duplicate submissions
    if (createTenantMutation.isPending || isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate submit');
      return;
    }
    
    // Custom validation for subdomain availability
    let hasErrors = false;
    
    if (subdomainAvailable !== true) {
      setError('subdomain', { 
        message: subdomainAvailable === false 
          ? 'This subdomain is already taken' 
          : 'Please check subdomain availability' 
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
  }, [subdomainAvailable, passwordStrength.score, setError, createTenantMutation, createTenantMutation.isPending, isSubmitting]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8" data-testid="create-tenant-form">
        {/* Form Error Display */}
        {formError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <X className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300" data-testid="validation-error">
                  {formError}
                </p>
                {formError.includes('subdomain') && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    💡 Try adding numbers or using a different name (e.g., "mycompany-2024", "mycompany-dev")
                  </p>
                )}
                {formError.includes('email') && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    💡 Try using a different email address or contact the existing user to transfer ownership
                  </p>
                )}
                {subdomainSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                      💡 Suggested alternatives:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subdomainSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setValue('subdomain', suggestion);
                            setSubdomainSuggestions([]);
                            setFormError(null);
                            clearErrors('subdomain');
                          }}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                        onBlur={() => {
                          // Trigger subdomain check on blur with a small delay to avoid conflicts with debounced check
                          if (watchedSubdomain && watchedSubdomain.length >= 3) {
                            setSubdomainBlurChecking(true);
                            setTimeout(() => {
                              checkSubdomain();
                              setSubdomainBlurChecking(false);
                            }, 100);
                          }
                        }}
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                        .example.com
                      </span>
                    </div>
                  )}
                />
                <div className="absolute right-16 top-2">
                  {(subdomainChecking || subdomainBlurChecking) && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {!subdomainChecking && !subdomainBlurChecking && subdomainAvailable === true && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {!subdomainChecking && !subdomainBlurChecking && subdomainAvailable === false && (
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
                    name="tenantType"
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
                </div>
              </div>
              {errors.adminEmail && (
                <p className="mt-1 text-sm text-red-500" data-testid="validation-error">{errors.adminEmail.message}</p>
              )}
              {emailError && !errors.adminEmail && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}

            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
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
                    placeholder="Enter mobile number (optional)"
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
              passwordStrength.score < 3 ||
              Object.keys(errors).length > 0
            }

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
              <span className={`flex items-center ${passwordStrength.score >= 3 ? 'text-green-500' : 'text-red-500'}`}>
                {passwordStrength.score >= 3 ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                Password
              </span>
              <span className="text-gray-400">
                Email (validated on submit)
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});

export default CreateTenantForm; 