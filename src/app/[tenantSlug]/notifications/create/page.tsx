'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TenantNotificationForm from '@/components/tenant/notifications/TenantNotificationForm';
import { toast } from 'react-hot-toast';

export default function CreateNotificationPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Notification created successfully');
    router.push('/riyo/notifications');
  };

  const handleCancel = () => {
    router.push('/riyo/notifications');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TenantNotificationForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 