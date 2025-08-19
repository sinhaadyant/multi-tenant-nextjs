"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Users, Building2, User, Mail, Search, X, Check } from 'lucide-react';
import { useNotificationRecipients, useCreateNotification, NotificationRecipient, CreateNotificationData } from '@/hooks/useNotificationsAPI';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';

interface NotificationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NotificationForm({ onSuccess, onCancel }: NotificationFormProps) {
  // Form state
  const [formData, setFormData] = useState<CreateNotificationData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    sendToAllSuperadmins: false,
    sendToAllTenants: false,
    selectedTenants: [],
    selectedUsers: [],
    customEmails: []
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'compose' | 'recipients'>('compose');
  const [recipientType, setRecipientType] = useState<'all' | 'superadmins' | 'tenants' | 'users'>('all');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');

  // Search state
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useDebouncedSearch(300);

  // API hooks
  const { data: recipientsData, isLoading: recipientsLoading } = useNotificationRecipients(debouncedSearchTerm, recipientType);
  const createNotificationMutation = useCreateNotification();

  const recipients = recipientsData?.data?.recipients || { superadmins: [], tenants: [], users: [] };
  const stats = recipientsData?.data?.stats || { totalSuperadmins: 0, totalTenants: 0, totalUsers: 0 };

  // Handle form field changes
  const handleInputChange = (field: keyof CreateNotificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle recipient selection
  const handleRecipientToggle = (recipient: NotificationRecipient) => {
    if (recipient.type === 'tenant') {
      setFormData(prev => ({
        ...prev,
        selectedTenants: prev.selectedTenants.includes(recipient.id)
          ? prev.selectedTenants.filter(id => id !== recipient.id)
          : [...prev.selectedTenants, recipient.id]
      }));
    } else if (recipient.type === 'user') {
      setFormData(prev => ({
        ...prev,
        selectedUsers: prev.selectedUsers.includes(recipient.id)
          ? prev.selectedUsers.filter(id => id !== recipient.id)
          : [...prev.selectedUsers, recipient.id]
      }));
    }
  };

  // Handle custom email addition
  const handleAddCustomEmail = () => {
    if (customEmailInput && !formData.customEmails.includes(customEmailInput)) {
      setFormData(prev => ({
        ...prev,
        customEmails: [...prev.customEmails, customEmailInput]
      }));
      setCustomEmailInput('');
    }
  };

  // Handle custom email removal
  const handleRemoveCustomEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      customEmails: prev.customEmails.filter(e => e !== email)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      return;
    }

    if (!formData.sendToAllSuperadmins && !formData.sendToAllTenants && 
        formData.selectedTenants.length === 0 && formData.selectedUsers.length === 0 && 
        formData.customEmails.length === 0) {
      return;
    }

    try {
      await createNotificationMutation.mutateAsync(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Get recipient count
  const getRecipientCount = () => {
    let count = 0;
    if (formData.sendToAllSuperadmins) count += stats.totalSuperadmins;
    if (formData.sendToAllTenants) count += stats.totalTenants;
    count += formData.selectedTenants.length;
    count += formData.selectedUsers.length;
    count += formData.customEmails.length;
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Notification
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Recipients: {getRecipientCount()}
            </span>
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compose'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recipients'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Recipients ({getRecipientCount()})
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
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
            </div>

            {/* Notification Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Recipient Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recipient Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sendToAllSuperadmins}
                    onChange={(e) => handleInputChange('sendToAllSuperadmins', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Send to all Superadmins ({stats.totalSuperadmins})
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sendToAllTenants}
                    onChange={(e) => handleInputChange('sendToAllTenants', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Send to all Tenant Admins ({stats.totalTenants})
                  </span>
                </label>
              </div>

              {/* Custom Emails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Email Addresses
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomEmailInput(!showCustomEmailInput)}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {showCustomEmailInput ? 'Cancel' : 'Add Email'}
                  </button>
                </div>

                {showCustomEmailInput && (
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomEmail}
                      disabled={!customEmailInput}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                )}

                {formData.customEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.customEmails.map((email, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomEmail(email)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recipients Tab */}
        {activeTab === 'recipients' && (
          <div className="p-6 space-y-6">
            {/* Search and Filter */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search recipients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex space-x-2">
                {['all', 'superadmins', 'tenants', 'users'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecipientType(type as any)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      recipientType === type
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipients List */}
            <div className="space-y-4">
              {/* Tenants */}
              {(recipientType === 'all' || recipientType === 'tenants') && recipients.tenants.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    Tenants ({recipients.tenants.length})
                  </h4>
                  <div className="space-y-2">
                    {recipients.tenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {tenant.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {tenant.userCount} users
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRecipientToggle(tenant)}
                          className={`p-1 rounded ${
                            formData.selectedTenants.includes(tenant.id)
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                          }`}
                        >
                          {formData.selectedTenants.includes(tenant.id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {(recipientType === 'all' || recipientType === 'users') && recipients.users.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Users ({recipients.users.length})
                  </h4>
                  <div className="space-y-2">
                    {recipients.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            {user.tenant && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {user.tenant.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRecipientToggle(user)}
                          className={`p-1 rounded ${
                            formData.selectedUsers.includes(user.id)
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                          }`}
                        >
                          {formData.selectedUsers.includes(user.id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipientsLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading recipients...</p>
                </div>
              )}

              {!recipientsLoading && 
               recipients.superadmins.length === 0 && 
               recipients.tenants.length === 0 && 
               recipients.users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recipients found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Recipients: {getRecipientCount()}
            </div>
            <div className="flex space-x-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={createNotificationMutation.isPending || getRecipientCount() === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createNotificationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 