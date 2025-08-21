"use client";

import React from 'react';
import { TenantNotificationForm } from '@/components/notifications/TenantNotificationForm';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/Card';
import { XCircle } from 'lucide-react';

export default function NewTenantNotificationPage() {
  const { hasPermission } = usePermissions();

  // Check if user has permission to create notifications
  if (!hasPermission('notifications', 'create')) {
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
                  You don't have permission to create notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <TenantNotificationForm mode="create" />
      </div>
    </div>
  );
}
