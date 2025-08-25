'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, User, Search, Send, Save } from 'lucide-react';
import { useCreateTenantNotification, CreateNotificationData, TenantNotification } from '@/hooks/useTenantNotifications';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { toast } from 'react-hot-toast';

interface TenantNotificationFormProps {
  notification?: TenantNotification;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TenantNotificationForm({ notification, onSuccess, onCancel }: TenantNotificationFormProps) {
  const { t } = useTranslation('forms');
  const isEditing = !!notification;
  
  // Form state
  const [formData, setFormData] = useState<CreateNotificationData>({
    title: notification?.title || '',
    message: notification?.message || '',
    type: notification?.type || 'info',
    priority: notification?.priority || 'medium',
    targetType: notification?.targetType || 'all_tenant_users',
    targetUserIds: notification?.targetUserIds || [],
    scheduledAt: notification?.scheduledAt || '',
    status: notification?.status || 'draft'
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'compose' | 'recipients'>('compose');
  const [searchTerm, setSearchTerm] = useState('');

  // API hooks
  const { data: usersData, isLoading: usersLoading } = useTenantUsers(1, 100, searchTerm, 'name', 'asc');
  const createMutation = useCreateTenantNotification();

  const users = usersData?.users || [];

  // Handle form field changes
  const handleInputChange = (field: keyof CreateNotificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle user selection
  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      targetUserIds: prev.targetUserIds?.includes(userId)
        ? prev.targetUserIds.filter(id => id !== userId)
        : [...(prev.targetUserIds || []), userId]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        toast.error('Editing notifications is not supported in this form yet.');
        return;
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Notification created successfully');
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit notification');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <Input
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder={t('forms:labels.title')}
        />
        <textarea
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder={t('forms:labels.message')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={5}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          {isEditing ? 'Update' : 'Send'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
