"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Key, Plus, Building2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useTenantRolesAPI } from '@/hooks/useTenantRolesAPI';
import { useParams, useRouter } from 'next/navigation';
import RoleList from '@/components/tenant/roles/RoleList';
import ModulePermissionTable from '@/components/tenant/roles/ModulePermissionTable';
import RoleAssignmentTable from '@/components/tenant/roles/RoleAssignmentTable';

const TenantRolesPage = () => {
  const { showToast } = useToast();
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignment'>('roles');
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Initialize the roles API
  const {
    useRoles,
    useModules,
    useUsers,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useToggleRoleStatus,
    useAssignRole,
    useRemoveRole
  } = useTenantRolesAPI();

  // Queries
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles(1, 100);
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: users, isLoading: usersLoading } = useUsers();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const toggleStatusMutation = useToggleRoleStatus();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();

  const roles = rolesData?.roles || [];
  const permissions = rolesData?.permissions;

  // Handle URL parameters for tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'permissions' || tab === 'assignment') {
      setActiveTab(tab);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'roles') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  const tabs = [
    {
      id: 'roles',
      label: 'Roles Management',
      icon: Shield,
      description: 'Create, edit, and manage user roles'
    },
    {
      id: 'permissions',
      label: 'Module Permissions',
      icon: Key,
      description: 'Configure module permissions for roles'
    },
    {
      id: 'assignment',
      label: 'Role Assignment',
      icon: Users,
      description: 'Assign roles to users'
    }
  ];

  // Handle role creation
  const handleCreateRole = () => {
    router.push(`/${tenantSlug}/roles/create`);
  };

  // Handle role edit
  const handleEditRole = (role: any) => {
    router.push(`/${tenantSlug}/roles/${role.id}/edit`);
  };

  // Handle role deletion
  const handleDeleteRole = async (role: any) => {
    try {
      if (!role || !role.id) {
        throw new Error('Invalid role data');
      }
      
      await deleteRoleMutation.mutateAsync(role.id);
      showToast('Role deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete role', 'error');
    }
  };

  // Handle permission updates
  const handleUpdatePermissions = async (permissions: any[]) => {
    try {
      if (!selectedRole) {
        throw new Error('Please select a role first');
      }
      
      await updateRoleMutation.mutateAsync({
        roleId: selectedRole.id,
        roleData: { permissions }
      });
      showToast('Permissions updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update permissions', 'error');
    }
  };

  // Handle role assignments
  const handleAssignRoles = async (assignments: any[]) => {
    try {
      for (const assignment of assignments) {
        if (assignment.action === 'assign') {
          await assignRoleMutation.mutateAsync({
            userId: assignment.userId,
            roleId: assignment.roleId
          });
        } else if (assignment.action === 'remove') {
          await removeRoleMutation.mutateAsync({
            userId: assignment.userId,
            roleId: assignment.roleId
          });
        }
      }
      showToast('Role assignments updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update role assignments', 'error');
    }
  };

  // Handle role selection for permissions
  const handleRoleSelect = (role: any) => {
    setSelectedRole(role);
  };

  // Clear error
  const handleClearError = () => {
    // Refetch roles to clear error
    refetchRoles();
  };

  const loading = rolesLoading || modulesLoading || usersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user roles, permissions, and role assignments
          </p>
        </div>
        <div className="flex gap-2">
          {permissions?.canCreate && activeTab === 'roles' && (
            <Button
              onClick={handleCreateRole}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {rolesError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Data
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {rolesError.message || 'Failed to load roles data'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearError}
              className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <ErrorBoundary>
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Debug Information
              </h4>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>Tenant Slug: {tenantSlug}</p>
              <p>Roles Count: {roles?.length || 0}</p>
              <p>Modules Count: {modules?.length || 0}</p>
              <p>Users Count: {users?.length || 0}</p>
              <p>Selected Role: {selectedRole?.name || 'None'}</p>
              <p>Active Tab: {activeTab}</p>
              <p>Permissions: {JSON.stringify(permissions)}</p>
            </div>
          </div>
        )}

        {/* Roles Management Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {roles.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No Roles Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      This tenant doesn't have any roles yet. Create the first role to get started.
                    </p>
                  </div>
                  {permissions?.canCreate && (
                    <Button
                      onClick={handleCreateRole}
                      variant="primary"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Role
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <RoleList
                roles={roles}
                loading={loading}
                permissions={permissions}
                onCreateRole={handleCreateRole}
                onEditRole={handleEditRole}
                onViewRole={(role) => handleRoleSelect(role)}
                onDeleteRole={handleDeleteRole}
                onToggleStatus={async (role) => {
                  try {
                    await toggleStatusMutation.mutateAsync({
                      roleId: role.id,
                      isActive: !role.isActive
                    });
                  } catch (error: any) {
                    showToast(error.message || 'Failed to update role status', 'error');
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Module Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {/* Role Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Select Role for Permissions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Choose a role to configure its module permissions
                  </p>
                </div>
                <select
                  value={selectedRole?.id || ''}
                  onChange={(e) => {
                    const role = roles.find(r => r && r.id === e.target.value);
                    handleRoleSelect(role || null);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
                >
                  <option value="">Select Role</option>
                  {roles.filter(role => role && role.id).map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name || 'Unnamed Role'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Permissions Table */}
            {selectedRole ? (
              <ModulePermissionTable
                modules={modules || []}
                rolePermissions={selectedRole.permissions || []}
                onSavePermissions={handleUpdatePermissions}
                loading={loading}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Key className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Select a Role
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Choose a role from the dropdown above to configure its permissions
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Assignment Tab */}
        {activeTab === 'assignment' && (
          <RoleAssignmentTable
            users={users || []}
            roles={roles}
            onAssignRoles={handleAssignRoles}
            loading={loading}
          />
        )}
      </ErrorBoundary>
    </div>
  );
};

export default TenantRolesPage; 