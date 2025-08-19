"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateNotification } from '@/hooks/useNotifications';
import { CreateNotificationData } from '@/hooks/useNotifications';
import { useTenants, Tenant } from '@/hooks/useTenantsAPI';
import { useUsers, User } from '@/hooks/useUsers';
import { ArrowLeft, Save, Search, X, Users, Building2, Mail, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface SelectedTarget {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'tenant_admin' | 'superadmin';
  tenantName?: string;
}

export default function CreateNotificationPage() {
  const router = useRouter();
  const createMutation = useCreateNotification();
  
  // Form state
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

  // Target selection state
  const [selectedTargets, setSelectedTargets] = useState<SelectedTarget[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Fetch data
  const { data: tenantsData } = useTenants({ limit: 100 });
  const { data: usersData } = useUsers({ 
    limit: 100,
    tenantId: selectedTenantId || undefined 
  });

  // Memoized filtered data
  const filteredTenants = useMemo(() => {
    if (!tenantsData?.tenants) return [];
    return tenantsData.tenants.filter(tenant =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenantsData, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersData, searchQuery]);

  // Handle target type change
  const handleTargetTypeChange = (targetType: string) => {
    setFormData(prev => ({ ...prev, targetType: targetType as any }));
    setSelectedTargets([]);
    setSearchQuery('');
    setSelectedTenantId('');
    setShowUserSearch(false);
  };

  // Add target to selection
  const addTarget = (target: SelectedTarget) => {
    const exists = selectedTargets.find(t => t.id === target.id && t.type === target.type);
    if (!exists) {
      setSelectedTargets(prev => [...prev, target]);
      setSearchQuery('');
    } else {
      toast.error('Target already selected');
    }
  };

  // Remove target from selection
  const removeTarget = (targetId: string, type: string) => {
    setSelectedTargets(prev => prev.filter(t => !(t.id === targetId && t.type === type)));
  };

  // Add all users from a tenant
  const addTenantUsers = (tenant: Tenant) => {
    if (!usersData?.users) return;
    
    const tenantUsers = usersData.users.filter(user => user.tenant?.id === tenant.id);
    const newTargets: SelectedTarget[] = tenantUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      type: 'user' as const,
      tenantName: tenant.name
    }));

    // Filter out already selected users
    const uniqueTargets = newTargets.filter(newTarget => 
      !selectedTargets.find(existing => existing.id === newTarget.id && existing.type === newTarget.type)
    );

    setSelectedTargets(prev => [...prev, ...uniqueTargets]);
    toast.success(`Added ${uniqueTargets.length} users from ${tenant.name}`);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare target data based on selection
      const targetUserIds = selectedTargets
        .filter(t => t.type === 'user')
        .map(t => t.id);

      const notificationData = {
        ...formData,
        targetUserIds,
        status: 'draft' as const,
        metadata: {
          ...formData.metadata,
          selectedTargets: selectedTargets.map(t => ({
            id: t.id,
            type: t.type,
            name: t.name,
            email: t.email,
            tenantName: t.tenantName
          }))
        }
      };
      
      await createMutation.mutateAsync(notificationData);
      router.push('/superadmin/notifications');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Get target selection component based on target type
  const getTargetSelectionComponent = () => {
    switch (formData.targetType) {
      case 'superadmin':
        return (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 dark:text-blue-200">
                Notification will be sent to all Super Admins
              </span>
            </div>
          </div>
        );

      case 'specific_users':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            
            {showUserSearch && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => addTarget({
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      type: 'user',
                      tenantName: user.tenant?.name
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        {user.tenant && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">{user.tenant.name}</div>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'multiple_users':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Tenant (Optional)
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Tenants</option>
                  {tenantsData?.tenants?.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => addTarget({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    type: 'user',
                    tenantName: user.tenant?.name
                  })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                      {user.tenant && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">{user.tenant.name}</div>
                      )}
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'entire_tenant':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search tenants by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
              {filteredTenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => addTenantUsers(tenant)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{tenant.slug}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{tenant.userCount} users</div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'multiple_tenants':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search tenants by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
              {filteredTenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => addTenantUsers(tenant)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{tenant.slug}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{tenant.userCount} users</div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/superadmin/notifications">
            <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Notification Details */}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
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
                      onChange={(e) => handleTargetTypeChange(e.target.value)}
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

            {/* Target Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Target Selection</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select who will receive this notification</p>
              </div>
              <div className="p-6">
                {getTargetSelectionComponent()}
              </div>
            </div>

            {/* Form Actions */}
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

        {/* Selected Targets Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Targets</h3>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{selectedTargets.length}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {selectedTargets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No targets selected</p>
                  <p className="text-sm">Select targets from the form to see them here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedTargets.map((target, index) => (
                    <div
                      key={`${target.id}-${target.type}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{target.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{target.email}</div>
                        {target.tenantName && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">{target.tenantName}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTarget(target.id, target.type)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedTargets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setSelectedTargets([])}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 