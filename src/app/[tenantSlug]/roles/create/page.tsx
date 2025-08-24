"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Save, X } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import { useTenantRolesAPI, CreateRoleData } from '@/hooks/useTenantRolesAPI';
import CreateRoleForm from '@/components/tenant/roles/CreateRoleForm';

const CreateRolePage = () => {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const tenantSlug = params.tenantSlug as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { useCreateRole, useModules } = useTenantRolesAPI();
  const createRoleMutation = useCreateRole();
  const { data: modules, isLoading: modulesLoading } = useModules();

  const handleSubmit = async (roleData: CreateRoleData) => {
    try {
      setIsSubmitting(true);
      await createRoleMutation.mutateAsync(roleData);
      showToast('Role created successfully', 'success');
      router.push(`/${tenantSlug}/roles`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${tenantSlug}/roles`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Create New Role
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new role with specific permissions for your organization
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitting || modulesLoading}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Role
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <CreateRoleForm
          modules={modules || []}
          onSubmit={handleSubmit}
          loading={isSubmitting || modulesLoading}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default CreateRolePage;
