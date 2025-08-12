"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';
import api from '@/lib/api';
import { createNotificationSchema, CreateNotificationData } from '@/lib/validations/superadmin';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface NotificationFormProps {
  onSubmit: (data: CreateNotificationData) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export const NotificationForm: React.FC<NotificationFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isTenantsLoading, setIsTenantsLoading] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue
  } = useForm<CreateNotificationData>({
    resolver: zodResolver(createNotificationSchema),
    defaultValues: {
      title: '',
      message: '',
      targetType: 'all_tenants',
      targetTenantId: '',
      priority: 'medium'
    },
    mode: 'onChange'
  });

  const targetType = watch('targetType');

  // Fetch tenants for dropdown
  useEffect(() => {
    const fetchTenants = async () => {
      setIsTenantsLoading(true);
      try {
        const response = await api.get('/superadmin/tenants');
        if (response.data.success) {
          setTenants(response.data.tenants);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch tenants:', error);
        }
      } finally {
        setIsTenantsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const onSubmitForm = async (data: CreateNotificationData) => {
    try {
      const result = await onSubmit(data);
      if (result.success) {
        reset();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to submit notification:', error);
      }
    }
  };

  const getSelectedTenantName = () => {
    const selectedTenantId = watch('targetTenantId');
    const tenant = tenants.find(t => t.id === selectedTenantId);
    return tenant ? tenant.name : 'Select a tenant';
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Title Field */}
      <div>
        <Label>
          Title <span className="text-error-500">*</span>
        </Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              type="text"
              placeholder="Enter notification title"
              error={!!errors.title}
              hint={errors.title?.message}
            />
          )}
        />
      </div>

      {/* Message Field */}
      <div>
        <Label>
          Message <span className="text-error-500">*</span>
        </Label>
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                errors.message ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="Enter notification message"
              rows={4}
            />
          )}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-error-500">{errors.message.message}</p>
        )}
      </div>

      {/* Target Type Field */}
      <div>
        <Label>
          Target Type <span className="text-error-500">*</span>
        </Label>
        <Controller
          name="targetType"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="all_tenants">All Tenants</option>
              <option value="superadmin">SuperAdmin Only</option>
              <option value="specific_tenant">Specific Tenant</option>
            </select>
          )}
        />
        {errors.targetType && (
          <p className="mt-1 text-sm text-error-500">{errors.targetType.message}</p>
        )}
      </div>

      {/* Specific Tenant Selection */}
      {targetType === 'specific_tenant' && (
        <div>
          <Label>
            Select Tenant <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTenantDropdown(!showTenantDropdown)}
              className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              {getSelectedTenantName()}
            </button>
            
            {showTenantDropdown && (
              <Dropdown
                isOpen={showTenantDropdown}
                onClose={() => setShowTenantDropdown(false)}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700"
              >
                {isTenantsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading tenants...</div>
                ) : (
                  tenants.map((tenant) => (
                    <DropdownItem
                      key={tenant.id}
                      onClick={() => {
                        setValue('targetTenantId', tenant.id);
                        setShowTenantDropdown(false);
                      }}
                    >
                      {tenant.name}
                    </DropdownItem>
                  ))
                )}
              </Dropdown>
            )}
          </div>
          {errors.targetTenantId && (
            <p className="mt-1 text-sm text-error-500">{errors.targetTenantId.message}</p>
          )}
        </div>
      )}

      {/* Priority Field */}
      <div>
        <Label>
          Priority <span className="text-error-500">*</span>
        </Label>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          )}
        />
        {errors.priority && (
          <p className="mt-1 text-sm text-error-500">{errors.priority.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Sending...
            </>
          ) : (
            'Send Notification'
          )}
        </Button>
      </div>
    </form>
  );
}; 