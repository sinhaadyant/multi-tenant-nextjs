"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Send, Trash2, Calendar, Users, AlertCircle, Info, Bell, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import ConfirmModal from '@/components/common/ConfirmModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'promotional' | 'system_update';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'sent' | 'scheduled' | 'cancelled';
  targetType: 'superadmin' | 'specific_users' | 'multiple_users' | 'entire_tenant' | 'multiple_tenants';
  targetTenantId?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByType: 'superadmin' | 'tenant_admin' | 'user';
  isRead?: boolean;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  metadata?: Record<string, any>;
  superAdmin?: {
    id: string;
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    userNotifications: number;
  };
}

const NotificationTypeIcon = ({ type }: { type: string }) => {
  const iconMap = {
    info: <Info className="w-6 h-6 text-blue-500" />,
    warning: <AlertCircle className="w-6 h-6 text-yellow-500" />,
    alert: <AlertCircle className="w-6 h-6 text-red-500" />,
    promotional: <Bell className="w-6 h-6 text-purple-500" />,
    system_update: <Info className="w-6 h-6 text-green-500" />,
  };
  return iconMap[type as keyof typeof iconMap] || <Info className="w-6 h-6" />;
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

export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const notificationId = params.id as string;
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);

  // Fetch notification details
  const { data: notification, isLoading, error, refetch } = useQuery({
    queryKey: ['notification', notificationId],
    queryFn: async (): Promise<Notification> => {
      const response = await api.get(`/superadmin/notifications/${notificationId}`);
      return response.data;
    },
    enabled: !!notificationId,
  });

  // Mark as read mutation
  const markAsRead = async () => {
    try {
      await api.patch(`/superadmin/notifications/${notificationId}/mark-read`);
      refetch();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Send notification mutation
  const sendNotification = async () => {
    try {
      await api.post(`/superadmin/notifications/${notificationId}/send`);
      refetch();
      toast.success('Notification sent successfully');
      setSendModal(false);
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  // Delete notification mutation
  const deleteNotification = async () => {
    try {
      await api.delete(`/superadmin/notifications/${notificationId}`);
      toast.success('Notification deleted successfully');
      router.push('/superadmin/notifications');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Mark as read when component mounts
  useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead();
    }
  }, [notification]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading notification: {error?.message || 'Notification not found'}</p>
          <Button onClick={() => router.push('/superadmin/notifications')} className="mt-2">
            Back to Notifications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/superadmin/notifications">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Details</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage notification</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {notification.status === 'draft' && (
            <>
              <Link href={`/superadmin/notifications/${notification.id}/edit`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Button 
                onClick={() => setSendModal(true)}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-4 mb-6">
              <NotificationTypeIcon type={notification.type || 'info'} />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {notification.title || 'No Title'}
                </h2>
                <div className="flex items-center space-x-4">
                  <PriorityBadge priority={notification.priority || 'low'} />
                  <StatusBadge status={notification.status || 'draft'} />
                  <TargetTypeBadge targetType={notification.targetType || 'superadmin'} />
                </div>
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {notification.message || 'No message content'}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {notification.attachments && notification.attachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attachments</h3>
              <div className="space-y-2">
                {notification.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {attachment.originalName.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <StatusBadge status={notification.status || 'draft'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                <PriorityBadge priority={notification.priority || 'low'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.type ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1) : 'Unknown'}
                </span>
              </div>
              {notification.isRead !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Read Status</span>
                  <div className="flex items-center space-x-2">
                    {notification.isRead ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timing Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timing</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
              {notification.sentAt && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(notification.sentAt)}
                  </p>
                </div>
              )}
              {notification.scheduledAt && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(notification.scheduledAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Target Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target Information</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Target Type</span>
                <div className="mt-1">
                  <TargetTypeBadge targetType={notification.targetType} />
                </div>
              </div>
              {notification.tenant && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Target Tenant</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {notification.tenant.name}
                  </p>
                </div>
              )}
              {notification._count?.userNotifications && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recipients</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification._count.userNotifications}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send Confirmation Modal */}
      <ConfirmModal
        isOpen={sendModal}
        onClose={() => setSendModal(false)}
        onConfirm={sendNotification}
        title="Send Notification"
        message={`Are you sure you want to send "${notification.title}"? This action cannot be undone.`}
        confirmText="Send"
        cancelText="Cancel"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={deleteNotification}
        title="Delete Notification"
        message={`Are you sure you want to delete "${notification.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
