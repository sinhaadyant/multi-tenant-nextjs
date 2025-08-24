'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TenantNotificationView from '@/components/tenant/notifications/TenantNotificationView';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/button/Button';

export default function ViewNotificationPage() {
  const router = useRouter();
  const params = useParams();
  const notificationId = params.id as string;
  
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await fetch(`/api/tenant/riyo/notifications/${notificationId}`);
        if (response.ok) {
          const data = await response.json();
          setNotification(data.notification);
        } else {
          toast.error('Failed to load notification');
        }
      } catch (error) {
        toast.error('Failed to load notification');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [notificationId]);

  const handleClose = () => {
    router.push('/riyo/notifications');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading notification...</p>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Notification not found</p>
          <Button onClick={() => router.push('/riyo/notifications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notifications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TenantNotificationView
        notification={notification}
        onClose={handleClose}
      />
    </div>
  );
}
