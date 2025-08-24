'use client';

import React from 'react';
import { TenantNotification } from '@/hooks/useTenantNotifications';
import { Bell, Users, User, Calendar, Send, Eye, AlertCircle, Info, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';

interface TenantNotificationViewProps {
  notification: TenantNotification;
  onClose?: () => void;
}

export default function TenantNotificationView({ notification, onClose }: TenantNotificationViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'announcement':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="w-5 h-5 text-green-500" />;
      case 'scheduled':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'draft':
        return <Eye className="w-5 h-5 text-gray-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'announcement': return 'primary';
      default: return 'primary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      default: return 'light';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success';
      case 'scheduled': return 'primary';
      case 'draft': return 'light';
      default: return 'light';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getTypeIcon(notification.type)}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {notification.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created on {formatDate(notification.createdAt)}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Message</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</span>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(notification.type)}
                    <Badge color={getTypeColor(notification.type)}>
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</span>
                  <Badge color={getPriorityColor(notification.priority)}>
                    {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(notification.status)}
                    <Badge color={getStatusColor(notification.status)}>
                      {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Type</span>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {notification.targetType === 'all_tenant_users' ? 'All Users' : 'Specific Users'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipients & Timing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recipients & Timing</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Recipients</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {notification.recipientsCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Read Count</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {notification.readCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>

                {notification.updatedAt && notification.updatedAt !== notification.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(notification.updatedAt)}
                    </span>
                  </div>
                )}

                {notification.scheduledAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled For</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(notification.scheduledAt)}
                    </span>
                  </div>
                )}

                {notification.sentAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sent At</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(notification.sentAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specific Users (if applicable) */}
          {notification.targetType === 'specific_users' && notification.targetUserIds && notification.targetUserIds.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Target Users</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {notification.targetUserIds.length} user(s) selected
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  User IDs: {notification.targetUserIds.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Additional Information</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
