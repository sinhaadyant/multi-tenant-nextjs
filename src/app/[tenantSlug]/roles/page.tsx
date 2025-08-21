"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Key, Plus, Building2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/hooks/useToast';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useTenantRolesAPI } from '@/hooks/useTenantRolesAPI';
import { usePermissions } from '@/hooks/usePermissions';
import TenantRoleList from '@/components/tenant/TenantRoleList';
import TenantRoleForm from '@/components/tenant/TenantRoleForm';
import TenantModulePermissionTable from '@/components/tenant/TenantModulePermissionTable';
import TenantRoleAssignmentTable from '@/components/tenant/TenantRoleAssignmentTable';
import TenantRoleSkeleton from '@/components/tenant/TenantRoleSkeleton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const TenantRolesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignment'>('roles');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);

  // Initialize the roles API
  const {
    roles,
    stats,
    pagination,
    isLoading,
    error,
    refetch,
    setPage,
    setPageSize
  } = useTenantRolesAPI('rss', {
    page: 1,
    limit: 10,
    filters: {
      status: 'all',
      type: 'all',
      search: ''
    }
  });

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
  const handleCreateRole = async (roleData: any) => {
    try {
      if (!hasPermission('roles', 'create')) {
        toast.error('You don\'t have permission to create roles');
        return;
      }
      
      // TODO: Implement role creation
      toast.success('Role created successfully');
      setModalType(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create role');
    }
  };

  // Handle role update
  const handleUpdateRole = async (roleData: any) => {
    try {
      if (!hasPermission('roles', 'update')) {
        toast.error('You don\'t have permission to update roles');
        return;
      }

      if (!selectedRole) return;
      
      // TODO: Implement role update
      toast.success('Role updated successfully');
      setModalType(null);
      setSelectedRole(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (role: any) => {
    try {
      if (!hasPermission('roles', 'delete')) {
        toast.error('You don\'t have permission to delete roles');
        return;
      }

      if (!role || !role.id) {
        throw new Error('Invalid role data');
      }
      
      // TODO: Implement role deletion
      toast.success('Role deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role');
    }
  };

  // Handle permission updates
  const handleUpdatePermissions = async (permissions: any[]) => {
    try {
      if (!hasPermission('roles', 'update')) {
        toast.error('You don\'t have permission to update permissions');
        return;
      }

      if (!selectedRole) {
        throw new Error('Please select a role first');
      }
      
      // TODO: Implement permission updates
      toast.success('Permissions updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions');
    }
  };

  // Handle role assignments
  const handleAssignRoles = async (assignments: any[]) => {
    try {
      if (!hasPermission('roles', 'update')) {
        toast.error('You don\'t have permission to assign roles');
        return;
      }
      
      // TODO: Implement role assignments
      toast.success('Role assignments updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role assignments');
    }
  };

  // Open modal
  const openModal = (type: 'create' | 'edit', role?: any) => {
    setModalType(type);
    if (role) {
      setSelectedRole(role);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedRole(null);
  };

  // Handle role selection for permissions
  const handleRoleSelect = (role: any) => {
    setSelectedRole(role);
  };

  // Loading state
  if (isLoading && !roles) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
          </div>
        </div>
        <TenantRoleSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Error Loading Roles
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                {error.message || 'Failed to load roles. Please try refreshing the page.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute 
      requireAuth={true}
      requirePermissions={['roles:read']}
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don't have permission to access the Roles & Permissions module.
            </p>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Roles & Permissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage user roles, permissions, and role assignments
              </p>
            </div>
            
            {activeTab === 'roles' && hasPermission('roles', 'create') && (
              <Button
                onClick={() => openModal('create')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Role
              </Button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'roles' && (
              <TenantRoleList
                roles={roles}
                stats={stats}
                pagination={pagination}
                isLoading={isLoading}
                error={error}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRefresh={refetch}
                onEditRole={(role) => {
                  setSelectedRole(role);
                  setModalType('edit');
                }}
                onDeleteRole={(role) => {
                  // Handle delete role
                }}
                onToggleStatus={(role) => {
                  // Handle toggle status
                }}
                hasPermission={hasPermission}
              />
            )}

            {activeTab === 'permissions' && (
              <TenantModulePermissionTable
                selectedRole={selectedRole}
                onRoleSelect={setSelectedRole}
                roles={roles}
                hasPermission={hasPermission}
              />
            )}

            {activeTab === 'assignment' && (
              <TenantRoleAssignmentTable
                hasPermission={hasPermission}
              />
            )}
          </div>

          {/* Role Form Modal */}
          {modalType && (
            <TenantRoleForm
              isOpen={!!modalType}
              onClose={() => {
                setModalType(null);
                setSelectedRole(null);
              }}
              role={modalType === 'edit' ? selectedRole : null}
              onSubmit={(roleData) => {
                // Handle form submission
                setModalType(null);
                setSelectedRole(null);
                refetch();
              }}
            />
          )}
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
};

export default TenantRolesPage; 