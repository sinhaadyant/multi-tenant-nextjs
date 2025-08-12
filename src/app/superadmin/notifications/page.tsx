"use client";

import React, { useState } from 'react';
import { useNotifications, useDeleteNotification, useSendNotification } from '@/hooks/useNotifications';
import { Notification, NotificationFilters } from '@/hooks/useNotifications';
import { Plus, Search, Filter, Edit, Trash2, Send, Eye, Calendar, Users, AlertCircle, Info, Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/Input';
import Select from '@/components/form/form-elements/Select';

const NotificationTypeIcon = ({ type }: { type: string }) => {
  const iconMap = {
    info: <Info className="w-4 h-4 text-blue-500" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    alert: <AlertCircle className="w-4 h-4 text-red-500" />,
    promotional: <Bell className="w-4 h-4 text-purple-500" />,
    system_update: <Info className="w-4 h-4 text-green-500" />,
  };
  return iconMap[type as keyof typeof iconMap] || <Info className="w-4 h-4" />;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colorMap = {
    low: 'light' as const,
    medium: 'warning' as const,
    high: 'error' as const,
  };
  return (
    <Badge color={colorMap[priority as keyof typeof colorMap] || 'light'}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap = {
    draft: 'light' as const,
    sent: 'success' as const,
    scheduled: 'info' as const,
    cancelled: 'error' as const,
  };
  return (
    <Badge color={colorMap[status as keyof typeof colorMap] || 'light'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const TargetTypeBadge = ({ targetType }: { targetType: string }) => {
  const displayMap = {
    superadmin: 'Super Admin',
    specific_users: 'Specific Users',
    multiple_users: 'Multiple Users',
    entire_tenant: 'Entire Tenant',
    multiple_tenants: 'Multiple Tenants',
  };
  return (
    <Badge color="primary">
      {displayMap[targetType as keyof typeof displayMap] || targetType}
    </Badge>
  );
};

export default function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; notification: Notification | null }>({
    show: false,
    notification: null,
  });

  const { data, isLoading, error, refetch } = useNotifications(filters);
  const deleteMutation = useDeleteNotification();
  const sendMutation = useSendNotification();

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDelete = async () => {
    if (!deleteModal.notification) return;
    
    try {
      await deleteMutation.mutateAsync(deleteModal.notification.id);
      setDeleteModal({ show: false, notification: null });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleSend = async (notificationId: string) => {
    try {
      await sendMutation.mutateAsync(notificationId);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading notifications: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system notifications</p>
        </div>
        <Link href="/superadmin/notifications/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Notification
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.draft}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
                <p className="text-2xl font-bold text-green-600">{data.stats.sent}</p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{data.stats.scheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{data.stats.cancelled}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <Select
                value={filters.type?.[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('type', e.target.value ? [e.target.value] : undefined)}
              >
                <option value="">All Types</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
                <option value="promotional">Promotional</option>
                <option value="system_update">System Update</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <Select
                value={filters.status?.[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value ? [e.target.value] : undefined)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <Select
                value={filters.priority?.[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('priority', e.target.value ? [e.target.value] : undefined)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Type</label>
              <Select
                value={filters.targetType?.[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('targetType', e.target.value ? [e.target.value] : undefined)}
              >
                <option value="">All Targets</option>
                <option value="superadmin">Super Admin</option>
                <option value="specific_users">Specific Users</option>
                <option value="multiple_users">Multiple Users</option>
                <option value="entire_tenant">Entire Tenant</option>
                <option value="multiple_tenants">Multiple Tenants</option>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : data?.notifications && data.notifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <NotificationTypeIcon type={notification.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TargetTypeBadge targetType={notification.targetType} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={notification.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={notification.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {notification._count?.userNotifications || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(notification.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link href={`/superadmin/notifications/${notification.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {notification.status === 'draft' && (
                          <>
                            <Link href={`/superadmin/notifications/${notification.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSend(notification.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteModal({ show: true, notification })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No notifications found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, notification: null })}
        onConfirm={handleDelete}
        title="Delete Notification"
        message={`Are you sure you want to delete "${deleteModal.notification?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
} 