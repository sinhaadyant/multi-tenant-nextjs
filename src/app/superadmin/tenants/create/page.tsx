"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreateTenantForm from '@/components/superadmin/CreateTenantForm';

export default function CreateTenantPage() {
  const router = useRouter();

  const handleCancel = useCallback(() => {
    router.push('/superadmin/tenants');
  }, [router]);

  const handleSuccess = useCallback((data: any) => {
    // Show success message with admin credentials
    if (data.adminCredentials) {
      alert(`Tenant created successfully!\n\nAdmin Credentials:\nEmail: ${data.adminCredentials.email}\nPassword: ${data.adminCredentials.password}\n\nPlease save these credentials securely.`);
    }
    router.push('/superadmin/tenants');
  }, [router]);

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