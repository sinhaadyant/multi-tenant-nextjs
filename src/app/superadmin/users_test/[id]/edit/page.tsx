"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Check, AlertCircle } from 'lucide-react';
import { useTenant, useUpdateTenant, useCheckSubdomain } from '@/hooks/useTenantsAPI';
import { useToast } from '@/hooks/useToast';
import TenantSkeleton from '@/components/superadmin/TenantSkeleton';

interface FormData {
  name: string;
  slug: string;
  domain?: string;
  description?: string;
}

interface ValidationErrors {
  name?: string;
  slug?: string;
  domain?: string;
  description?: string;
}

export default function TenantEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = params.id as string;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    domain: '',
    description: ''
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // API hooks
  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = useTenant(tenantId);
  const updateTenantMutation = useUpdateTenant();
  const { data: subdomainCheck, refetch: refetchSubdomain } = useCheckSubdomain(formData.slug, tenantId);

  const tenant = tenantData?.data?.tenant;

  // Initialize form data when tenant loads
  useEffect(() => {
    if (tenant) {
      const initialData: FormData = {
        name: tenant.name || '',
        slug: tenant.slug || '',
        domain: tenant.domain || '',
        description: tenant.description || ''
      };
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [tenant]);

  // Check for changes
  useEffect(() => {
    if (tenant) {
      const hasFormChanges = 
        formData.name !== tenant.name ||
        formData.slug !== tenant.slug ||
        formData.domain !== (tenant.domain || '') ||
        formData.description !== (tenant.description || '');
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, tenant]);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Tenant name is required';
    }
    if (name.length < 2) {
      return 'Tenant name must be at least 2 characters long';
    }
    if (name.length > 100) {
      return 'Tenant name must be less than 100 characters';
    }
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
      return 'Tenant name can only contain letters, numbers, spaces, hyphens, underscores, and dots';
    }
    return undefined;
  };

  const validateSlug = (slug: string): string | undefined => {
    if (!slug.trim()) {
      return 'Subdomain is required';
    }
    if (slug.length < 3) {
      return 'Subdomain must be at least 3 characters long';
    }
    if (slug.length > 63) {
      return 'Subdomain must be less than 63 characters';
    }
    if (!/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/.test(slug)) {
      return 'Subdomain can only contain lowercase letters, numbers, and hyphens. Must start and end with a letter or number.';
    }
    if (slug.includes('--')) {
      return 'Subdomain cannot contain consecutive hyphens';
    }
    return undefined;
  };

  const validateDomain = (domain: string): string | undefined => {
    if (!domain.trim()) {
      return undefined; // Domain is optional
    }
    if (domain.length > 255) {
      return 'Domain must be less than 255 characters';
    }
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return 'Please enter a valid domain name';
    }
    return undefined;
  };

  const validateDescription = (description: string): string | undefined => {
    if (description && description.length > 500) {
      return 'Description must be less than 500 characters';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate each field
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const slugError = validateSlug(formData.slug);
    if (slugError) newErrors.slug = slugError;

    const domainError = validateDomain(formData.domain || '');
    if (domainError) newErrors.domain = domainError;

    const descriptionError = validateDescription(formData.description || '');
    if (descriptionError) newErrors.description = descriptionError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle slug change with subdomain availability check
  const handleSlugChange = (value: string) => {
    const lowerValue = value.toLowerCase();
    setFormData(prev => ({ ...prev, slug: lowerValue }));
    
    // Clear slug error when user starts typing
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: undefined }));
    }

    // Check subdomain availability if slug is valid
    if (lowerValue.length >= 3 && /^[a-z0-9][a-z0-9\-]*[a-z0-9]$/.test(lowerValue)) {
      // The useCheckSubdomain hook will automatically check when the slug changes
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    // Check if slug has changed and verify availability
    if (formData.slug !== tenant?.slug) {
      try {
        await refetchSubdomain();
        if (subdomainCheck?.available === false) {
          setErrors(prev => ({ ...prev, slug: 'This subdomain is already taken' }));
          toast.error('This subdomain is already taken. Please choose a different one.');
          return;
        }
      } catch (error) {
        console.error('Error checking subdomain availability:', error);
        toast.error('Unable to verify subdomain availability. Please try again.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        ...(formData.domain && { domain: formData.domain.trim() }),
        ...(formData.description && { description: formData.description.trim() })
      };

      await updateTenantMutation.mutateAsync({
        id: tenantId,
        data: updateData
      });

      toast.success('Tenant updated successfully!');
      router.push(`/superadmin/tenants/${tenantId}`);
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      
      // Handle specific API errors
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('slug') || message.includes('subdomain')) {
          setErrors(prev => ({ ...prev, slug: 'This subdomain is already taken' }));
        } else if (message.includes('name')) {
          setErrors(prev => ({ ...prev, name: 'This name is already taken' }));
        } else {
          toast.error(message);
        }
      } else {
        toast.error('Failed to update tenant. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/superadmin/tenants/${tenantId}`);
      }
    } else {
      router.push(`/superadmin/tenants/${tenantId}`);
    }
  };

  // Loading state
  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-48"></div>
        </div>
        <TenantSkeleton type="card" />
      </div>
    );
  }

  // Error state
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Tenant</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
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
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Tenant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update tenant information for {tenant.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4 mr-2 inline" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.name 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter tenant name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Subdomain */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subdomain *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.slug 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter subdomain"
                    />
                    {formData.slug && formData.slug.length >= 3 && !errors.slug && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {subdomainCheck?.available === true ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : subdomainCheck?.available === false ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.slug}
                    </p>
                  )}
                  {formData.slug && !errors.slug && subdomainCheck?.available === true && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Subdomain is available
                    </p>
                  )}
                  {formData.slug && !errors.slug && subdomainCheck?.available === false && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <X className="w-4 h-4 mr-1" />
                      This subdomain is already taken
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will be used as the subdomain for your tenant (e.g., {formData.slug || 'yourtenant'}.yourdomain.com)
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Domain */}
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleFieldChange('domain', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.domain 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter custom domain (optional)"
                  />
                  {errors.domain && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.domain}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional custom domain for your tenant
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.description 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter description (optional)"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Read-only Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tenant ID
                  </label>
                  <input
                    type="text"
                    value={tenant.id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    value={tenant.isActive ? 'Active' : 'Inactive'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan
                  </label>
                  <input
                    type="text"
                    value={tenant.plan}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    value={tenant.region}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !hasChanges}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 