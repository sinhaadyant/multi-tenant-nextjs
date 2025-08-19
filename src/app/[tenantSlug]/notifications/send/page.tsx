"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, ArrowLeft, Building2, Users, Shield } from 'lucide-react';
import { useSendNotification, SendNotificationData } from '@/hooks/useNotifications';
import { useTenants } from '@/hooks/useTenantsAPI';
import Link from 'next/link';

// Validation schema
const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
  targetType: z.enum(['superadmin', 'all_tenants', 'specific_tenant']),
  targetTenantId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'])
}).refine((data) => {
  if (data.targetType === 'specific_tenant' && !data.targetTenantId) {
    return false;
  }
  return true;
}, {
  message: 'Please select a tenant',
  path: ['targetTenantId']
});

type SendNotificationFormData = z.infer<typeof sendNotificationSchema>;

export default function SendNotificationPage() {
  const router = useRouter();
  const sendNotificationMutation = useSendNotification();
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({ limit: 1000 });
  const tenants = tenantsData?.data?.tenants || [];

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue
  } = useForm<SendNotificationFormData>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      title: '',
      message: '',
      targetType: 'superadmin',
      targetTenantId: '',
      priority: 'medium'
    },
    mode: 'onChange'
  });

  const targetType = watch('targetType');

  const onSubmit = async (data: SendNotificationFormData) => {
    const submitData: SendNotificationData = {
      title: data.title.trim(),
      message: data.message.trim(),
      targetType: data.targetType,
      priority: data.priority,
      ...(data.targetType === 'specific_tenant' && { targetTenantId: data.targetTenantId })
    };

    try {
      await sendNotificationMutation.mutateAsync(submitData);
      router.push('/superadmin/notifications');
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/superadmin/notifications"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Notifications
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Send Notification
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send notifications to superadmins, all tenants, or specific tenants
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter notification title"
                />
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {watch('title').length}/100 characters
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <Controller
              name="message"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  maxLength={500}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.message ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter notification message"
                />
              )}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {watch('message').length}/500 characters
            </p>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <Controller
              name="targetType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      {...field}
                      value="superadmin"
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Super Admins</div>
                      <div className="text-sm text-gray-500">Send to all super admins</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      {...field}
                      value="all_tenants"
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">All Tenants</div>
                      <div className="text-sm text-gray-500">Send to all tenants</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      {...field}
                      value="specific_tenant"
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Single Tenant</div>
                      <div className="text-sm text-gray-500">Send to specific tenant</div>
                    </div>
                  </label>
                </div>
              )}
            />
          </div>

          {/* Tenant Selection */}
          {targetType === 'specific_tenant' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Tenant <span className="text-red-500">*</span>
              </label>
              <Controller
                name="targetTenantId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.targetTenantId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={tenantsLoading}
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.targetTenantId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targetTenantId.message}</p>
              )}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isValid || sendNotificationMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 