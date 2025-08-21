"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenantNotificationList } from '@/components/notifications/TenantNotificationList';
import { TenantNotificationForm } from '@/components/notifications/TenantNotificationForm';
import { TenantNotification } from '@/hooks/useTenantNotifications';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/Card';
import { XCircle } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit';

export default function TenantNotificationsPage() {
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNotification, setSelectedNotification] = useState<TenantNotification | null>(null);

  // Check if user has any notification permissions
  if (!hasAnyPermission('notifications')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Access Denied
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have permission to access notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleCreateNotification = () => {
    setViewMode('create');
  };

  const handleEditNotification = (notification: TenantNotification) => {
    setSelectedNotification(notification);
    setViewMode('edit');
  };

  const handleDeleteNotification = (notificationId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete notification:', notificationId);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedNotification(null);
  };

  // Render based on view mode
  switch (viewMode) {
    case 'create':
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <TenantNotificationForm
              mode="create"
              onCancel={handleBackToList}
              onSuccess={handleBackToList}
            />
          </div>
        </div>
      );

    case 'edit':
      return selectedNotification ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <TenantNotificationForm
              notification={selectedNotification}
              mode="edit"
              onCancel={handleBackToList}
              onSuccess={handleBackToList}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <TenantNotificationList
              onEditNotification={handleEditNotification}
              onDeleteNotification={handleDeleteNotification}
            />
          </div>
        </div>
      );
  }
} 