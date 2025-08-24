"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Save, X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import { useTenantRolesAPI, UpdateRoleData } from '@/hooks/useTenantRolesAPI';
import EditRoleForm from '@/components/tenant/roles/EditRoleForm';

const EditRolePage = () => {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const tenantSlug = params.tenantSlug as string;
  const roleId = params.roleId as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { useUpdateRole, useModules, useAllRoles } = useTenantRolesAPI();
  const updateRoleMutation = useUpdateRole();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: allRoles, isLoading: rolesLoading } = useAllRoles();

  // Find the role to edit
  useEffect(() => {
    if (allRoles && roleId) {
      const foundRole = allRoles.find(r => r.id === roleId);
      if (foundRole) {
        setRole(foundRole);
      } else {
        showToast('Role not found', 'error');
        router.push(`/${tenantSlug}/roles`);
      }
      setLoading(false);
    }
  }, [allRoles, roleId, router, tenantSlug, showToast]);

  const handleSubmit = async (roleData: UpdateRoleData) => {
    try {
      setIsSubmitting(true);
      await updateRoleMutation.mutateAsync({
        roleId,
        roleData
      });
      showToast('Role updated successfully', 'success');
      router.push(`/${tenantSlug}/roles`);
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${tenantSlug}/roles`);
  };

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading role...</span>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Role Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The role you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={handleCancel}>
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

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
              Edit Role: {role.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update role information and permissions
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
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Role
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <EditRoleForm
          role={role}
          modules={modules || []}
          onSubmit={handleSubmit}
          loading={isSubmitting || modulesLoading}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditRolePage;
