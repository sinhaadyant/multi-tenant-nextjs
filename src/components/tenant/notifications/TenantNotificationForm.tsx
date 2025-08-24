'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Users, User, Mail, Search, X, Check, Calendar, Send, Save } from 'lucide-react';
import { useCreateTenantNotification, useUpdateTenantNotification, CreateNotificationData, UpdateNotificationData, TenantNotification } from '@/hooks/useTenantNotifications';
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
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // API hooks
  const { data: usersData, isLoading: usersLoading } = useTenantUsers(1, 100, searchTerm, 'name', 'asc');
  const createMutation = useCreateTenantNotification();
  const updateMutation = useUpdateTenantNotification();

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
    
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.targetType === 'specific_users' && (!formData.targetUserIds || formData.targetUserIds.length === 0)) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      if (isEditing && notification) {
        await updateMutation.mutateAsync({
          id: notification.id,
          ...formData
        });
        toast.success('Notification updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Notification created successfully');
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save notification');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'announcement': return 'text-blue-600 bg-blue-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Notification' : 'Create New Notification'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isEditing ? 'Update notification details and settings' : 'Send notifications to your tenant users'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'compose'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Compose</span>
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'recipients'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Recipients</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Enter notification message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="success">Success</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Send Now</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  {formData.status === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Schedule Date & Time *
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                        required={formData.status === 'scheduled'}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Preview</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(formData.type)}`}>
                      {formData.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {formData.priority}
                    </span>
                  </div>
                  <h5 className="font-medium text-gray-900 dark:text-white">{formData.title || 'Notification Title'}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.message || 'Notification message will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recipients Tab */}
          {activeTab === 'recipients' && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recipients</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Type *
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => handleInputChange('targetType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all_tenant_users">All Tenant Users</option>
                    <option value="specific_users">Specific Users</option>
                  </select>
                </div>

                {formData.targetType === 'specific_users' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Users *
                    </label>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Users List */}
                    {usersLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        {users.length > 0 ? (
                          users.map((user) => (
                            <div key={user.id} className="flex items-center space-x-3 py-2">
                              <input
                                type="checkbox"
                                checked={formData.targetUserIds?.includes(user.id) || false}
                                onChange={() => handleUserToggle(user.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                                <span className="text-xs text-gray-500">({user.email})</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No users found</p>
                        )}
                      </div>
                    )}

                    {formData.targetUserIds && formData.targetUserIds.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Selected {formData.targetUserIds.length} user(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Notification
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
