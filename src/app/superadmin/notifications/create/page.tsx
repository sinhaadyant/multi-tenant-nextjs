"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateNotification } from '@/hooks/useNotifications';
import { CreateNotificationData } from '@/hooks/useNotifications';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateNotificationPage() {
  const router = useRouter();
  const createMutation = useCreateNotification();
  const [formData, setFormData] = useState<CreateNotificationData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    targetType: 'superadmin',
    targetTenantId: '',
    targetUserIds: [],
    scheduledAt: '',
    attachments: [],
    metadata: {},
  });

  const handleInputChange = (field: keyof CreateNotificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Set status to draft by default
      const notificationData = {
        ...formData,
        status: 'draft' as const
      };
      
      await createMutation.mutateAsync(notificationData);
      router.push('/superadmin/notifications');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/superadmin/notifications">
            <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Notification</h1>
            <p className="text-gray-600 dark:text-gray-400">Create a new system notification</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Basic information about the notification</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter notification title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Enter notification message"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
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
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="targetType"
                    value={formData.targetType}
                    onChange={(e) => handleInputChange('targetType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="specific_users">Specific Users</option>
                    <option value="multiple_users">Multiple Users</option>
                    <option value="entire_tenant">Entire Tenant</option>
                    <option value="multiple_tenants">Multiple Tenants</option>
                  </select>
                </div>
              </div>


            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/superadmin/notifications">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              <span>{createMutation.isPending ? 'Creating...' : 'Create Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 