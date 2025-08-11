"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Calendar } from 'lucide-react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingWrapper from '@/components/ui/LoadingWrapper';
import { useCreateNotification } from '@/hooks/useTenantNotifications';
import { toast } from 'react-hot-toast';

const CreateNotificationPage = () => {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'alert' | 'promotional' | 'system_update',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetType: 'entire_tenant' as 'superadmin' | 'specific_users' | 'multiple_users' | 'entire_tenant' | 'multiple_tenants',
    scheduledAt: '',
  });

  const createNotificationMutation = useCreateNotification(tenantSlug);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createNotificationMutation.mutateAsync({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        targetType: formData.targetType,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      });

      toast.success('Notification created successfully!');
      router.push(`/${tenantSlug}/notifications`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create notification');
    }
  };

  const handleSaveDraft = async () => {
    try {
      await createNotificationMutation.mutateAsync({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        targetType: formData.targetType,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      });

      toast.success('Draft saved successfully!');
      router.push(`/${tenantSlug}/notifications`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    }
  };

  return (
    <ErrorBoundary>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Notification</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Send a new notification to your tenant users
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter notification title"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter notification message"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="alert">Alert</option>
                  <option value="promotional">Promotional</option>
                  <option value="system_update">System Update</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Target Type */}
            <div>
              <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Type *
              </label>
              <select
                id="targetType"
                name="targetType"
                value={formData.targetType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="entire_tenant">Entire Tenant</option>
                <option value="specific_users">Specific Users</option>
                <option value="multiple_users">Multiple Users</option>
                <option value="multiple_tenants">Multiple Tenants</option>
              </select>
            </div>

            {/* Scheduled At */}
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to send immediately or save as draft
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={createNotificationMutation.isPending}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                Save Draft
              </button>
              <button
                type="submit"
                disabled={createNotificationMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2 inline" />
                {formData.scheduledAt ? 'Schedule' : 'Send Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CreateNotificationPage;
