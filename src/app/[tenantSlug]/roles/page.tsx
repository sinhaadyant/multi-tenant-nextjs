"use client";

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDynamicPermissions } from '@/context/DynamicPermissionsContext';
import PrivateRoute from '@/components/auth/PrivateRoute';
import { 
  Shield, 
  Plus, 
  Grid3X3,
  List,
  Download,
  RefreshCw,
  Users,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTenantRoles, Role } from '@/hooks/useTenantRoles';
import RoleCard from '@/components/tenant/RoleCard';
import RoleFilters from '@/components/tenant/RoleFilters';
import CreateRoleModal from '@/components/tenant/CreateRoleModal';
import PermissionsModal from '@/components/tenant/PermissionsModal';
import Button from '@/components/ui/button/Button';

// Types for modals
interface ModalState {
  create: boolean;
  edit: boolean;
  delete: boolean;
  permissions: boolean;
  clone: boolean;
  users: boolean;
}

const RolesPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const { hasPermission } = useDynamicPermissions();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modals, setModals] = useState<ModalState>({
    create: false,
    edit: false,
    delete: false,
    permissions: false,
    clone: false,
    users: false,
  });

  // Check permissions
  const canViewRoles = hasPermission('roles', 'read');
  const canCreateRoles = hasPermission('roles', 'create');
  const canUpdateRoles = hasPermission('roles', 'update');
  const canDeleteRoles = hasPermission('roles', 'delete');
  const canAssignRoles = hasPermission('roles', 'assign');

  // Use the roles hook
  const {
    roles,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
    refetchRoles,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
    updatePermissions,
    assignRole,
    isCreating,
    isUpdating,
    isDeleting,
    isCloning,
    isUpdatingPermissions,
    isAssigning,
  } = useTenantRoles(tenantSlug);

  // Modal handlers
  const openModal = useCallback((modal: keyof ModalState, role?: Role) => {
    if (role) setSelectedRole(role);
    setModals(prev => ({ ...prev, [modal]: true }));
  }, []);

  const closeModal = useCallback((modal: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modal]: false }));
    if (modal !== 'create') setSelectedRole(null);
  }, []);

  // Action handlers
  const handleCreateRole = useCallback((data: any) => {
    createRole(data, {
      onSuccess: () => {
        closeModal('create');
        toast.success('Role created successfully');
      },
    });
  }, [createRole, closeModal]);

  const handleEditRole = useCallback((data: any) => {
    if (!selectedRole) return;
    updateRole({ roleId: selectedRole.id, data }, {
      onSuccess: () => {
        closeModal('edit');
        toast.success('Role updated successfully');
      },
    });
  }, [updateRole, selectedRole, closeModal]);

  const handleDeleteRole = useCallback(() => {
    if (!selectedRole) return;
    deleteRole(selectedRole.id, {
      onSuccess: () => {
        closeModal('delete');
        toast.success('Role deleted successfully');
      },
    });
  }, [deleteRole, selectedRole, closeModal]);

  const handleCloneRole = useCallback((data: any) => {
    if (!selectedRole) return;
    cloneRole({ roleId: selectedRole.id, data }, {
      onSuccess: () => {
        closeModal('clone');
        toast.success('Role cloned successfully');
      },
    });
  }, [cloneRole, selectedRole, closeModal]);

  const handleUpdatePermissions = useCallback((permissions: string[]) => {
    if (!selectedRole) return;
    updatePermissions({ roleId: selectedRole.id, data: { permissions, action: 'replace' } }, {
      onSuccess: () => {
        closeModal('permissions');
        toast.success('Permissions updated successfully');
      },
    });
  }, [updatePermissions, selectedRole, closeModal]);

  // Permission checks
  if (!canViewRoles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to view roles and permissions.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Roles
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error.message || 'Failed to load roles'}
          </p>
          <Button onClick={() => refetchRoles()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and their permissions for your organization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {canCreateRoles && (
            <Button
              onClick={() => openModal('create')}
              disabled={isCreating}
              className="inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Roles</p>
                             <p className="text-2xl font-bold text-gray-900 dark:text-white">
                 {roles.filter((role: Role) => role.isActive).length}
               </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Roles</p>
                             <p className="text-2xl font-bold text-gray-900 dark:text-white">
                 {roles.filter((role: Role) => role.isSystem).length}
               </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                             <p className="text-2xl font-bold text-gray-900 dark:text-white">
                 {roles.reduce((total: number, role: Role) => total + role.userCount, 0)}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <RoleFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No roles found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.search || filters.status || filters.type
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first role.'}
          </p>
          {canCreateRoles && !filters.search && !filters.status && !filters.type && (
            <Button onClick={() => openModal('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Role
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Roles Grid/List */}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
          }>
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={canUpdateRoles ? (role) => openModal('edit', role) : undefined}
                onDelete={canDeleteRoles ? (role) => openModal('delete', role) : undefined}
                onClone={canCreateRoles ? (role) => openModal('clone', role) : undefined}
                onViewPermissions={canUpdateRoles ? (role) => openModal('permissions', role) : undefined}
                onViewUsers={canAssignRoles ? (role) => openModal('users', role) : undefined}
                canEdit={canUpdateRoles}
                canDelete={canDeleteRoles}
                canClone={canCreateRoles}
                canViewPermissions={canUpdateRoles}
                canViewUsers={canAssignRoles}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={pagination.limit}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {modals.create && (
        <CreateRoleModal
          onClose={() => closeModal('create')}
          onSubmit={handleCreateRole}
          isLoading={isCreating}
        />
      )}

      {modals.permissions && selectedRole && (
        <PermissionsModal
          role={selectedRole}
          availableModules={[]} // This would be fetched from the API
          onClose={() => closeModal('permissions')}
          onSubmit={handleUpdatePermissions}
          isLoading={isUpdatingPermissions}
        />
      )}

      {/* Add other modals as needed */}
    </div>
  );
};

const RolesPage = () => {
  return (
    <PrivateRoute>
      <RolesPageContent />
    </PrivateRoute>
  );
};

export default RolesPage; 