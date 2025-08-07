"use client";

import React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AuthGuardSkeleton from '@/components/auth/AuthGuardSkeleton';
import CreateTenantForm from '@/components/superadmin/CreateTenantForm';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CreateTenantPage() {
  const router = useRouter();
  
  const { isLoading } = useAuthGuard({
    requireAuth: true,
    requireSuperAdmin: true,
    redirectTo: '/superadmin/signin'
  });

  const handleCancel = () => {
    router.push('/superadmin/tenants');
  };

  const handleSuccess = (data: any) => {
    toast.success('Tenant and Admin User created successfully!');
    router.push('/superadmin/tenants');
  };

  if (isLoading) {
    return <AuthGuardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create New Tenant
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set up a new tenant with admin user and configuration
        </p>
      </div>

      <CreateTenantForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 