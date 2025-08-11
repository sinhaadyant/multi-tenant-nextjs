"use client";

import React, { useState, useCallback, useMemo } from 'react';
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
  Settings,
  Filter,
  Search,
  Trash2,
  Copy,
  CheckSquare,
  Square,
  MoreHorizontal,
  Star,
  Palette,
  Clock,
  UserCheck,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTenantRoles, Role } from '@/hooks/useTenantRoles';
import RoleCard from '@/components/tenant/RoleCard';
import RoleFilters from '@/components/tenant/RoleFilters';
import CreateRoleModal from '@/components/tenant/CreateRoleModal';
import PermissionsModal from '@/components/tenant/PermissionsModal';
import RoleTemplateModal from '@/components/tenant/RoleTemplateModal';
import BulkActionsModal from '@/components/tenant/BulkActionsModal';
import Button from '@/components/ui/button/Button';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

// Types for modals
interface ModalState {
  create: boolean;
  edit: boolean;
  delete: boolean;
  permissions: boolean;
  clone: boolean;
  users: boolean;
  template: boolean;
  bulkActions: boolean;
}

const RolesPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const { hasPermission } = useDynamicPermissions();
  const { showConfirmModal } = useConfirmModalContext();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [modals, setModals] = useState<ModalState>({
    create: false,
    edit: false,
    delete: false,
    permissions: false,
    clone: false,
    users: false,
    template: false,
    bulkActions: false,
  });

  // Check permissions
  const canViewRoles = hasPermission('roles', 'read');
  const canCreateRoles = hasPermission('roles', 'create');
  const canUpdateRoles = hasPermission('roles', 'update');
  const canDeleteRoles = hasPermission('roles', 'delete');
  const canAssignRoles = hasPermission('roles', 'assign');
  const canBulkOperate = hasPermission('roles', 'bulk_operations');

  // Use the roles hook
  const {
    roles,
    pagination,
    isLoading,
    error,
    filters,
    stats,
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
    bulkOperation,
    isCreating,
    isUpdating,
    isDeleting,
    isCloning,
    isUpdatingPermissions,
    isAssigning,
    isBulkOperating,
  } = useTenantRoles(tenantSlug);

  // Modal handlers
  const openModal = useCallback((modal: keyof ModalState, role?: Role) => {
    if (role) setSelectedRole(role);
    setModals(prev => ({ ...prev, [modal]: true }));
  }, []);

  const closeModal = useCallback((modal: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modal]: false }));
    if (modal !== 'create' && modal !== 'template') setSelectedRole(null);
  }, []);

  // Selection handlers
  const handleSelectRole = useCallback((roleId: string, selected: boolean) => {
    setSelectedRoles(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(roleId);
      } else {
        newSet.delete(roleId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRoles(new Set(roles.map(role => role.id)));
    } else {
      setSelectedRoles(new Set());
    }
  }, [roles]);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedRoles.size === 0) {
      toast.error('Please select at least one role');
      return;
    }

    const roleIds = Array.from(selectedRoles);
    
    try {
      await bulkOperation({
        roleIds,
        action: action as any
      });
      
      toast.success(`Bulk ${action} operation completed successfully`);
      setSelectedRoles(new Set());
      setShowSelection(false);
      refetchRoles();
    } catch (error) {
      toast.error(`Failed to perform bulk ${action} operation`);
    }
  }, [selectedRoles, bulkOperation, refetchRoles]);

  // Action handlers
  const handleCreateRole = useCallback((data: any) => {
    createRole(data, {
      onSuccess: () => {
        toast.success('Role created successfully');
        closeModal('create');
        refetchRoles();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create role');
      }
    });
  }, [createRole, closeModal, refetchRoles]);

  const handleUpdateRole = useCallback((data: any) => {
    if (!selectedRole) return;
    
    updateRole(selectedRole.id, data, {
      onSuccess: () => {
        toast.success('Role updated successfully');
        closeModal('edit');
        refetchRoles();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update role');
      }
    });
  }, [updateRole, selectedRole, closeModal, refetchRoles]);

  const handleDeleteRole = useCallback((role: any) => {
    showConfirmModal({
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        deleteRole(role.id, {
          onSuccess: () => {
            toast.success('Role deleted successfully');
            refetchRoles();
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to delete role');
          }
        });
      }
    });
  }, [deleteRole, showConfirmModal, refetchRoles]);

  const handleCloneRole = useCallback((role: Role) => {
    cloneRole(role.id, {
      name: `${role.name} (Copy)`,
      description: role.description
    }, {
      onSuccess: () => {
        toast.success('Role cloned successfully');
        closeModal('clone');
        refetchRoles();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to clone role');
      }
    });
  }, [cloneRole, closeModal, refetchRoles]);

  const handleUpdatePermissions = useCallback((permissions: string[]) => {
    if (!selectedRole) return;
    
    updatePermissions(selectedRole.id, {
      permissions,
      action: 'replace'
    }, {
      onSuccess: () => {
        toast.success('Permissions updated successfully');
        closeModal('permissions');
        refetchRoles();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update permissions');
      }
    });
  }, [updatePermissions, selectedRole, closeModal, refetchRoles]);

  // Filtered and sorted roles
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      if (filters.search && !role.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'active' && !role.isActive) return false;
        if (filters.status === 'inactive' && role.isActive) return false;
      }
      if (filters.type && filters.type !== 'all') {
        if (filters.type === 'system' && !role.isSystem) return false;
        if (filters.type === 'template' && !role.isTemplate) return false;
        if (filters.type === 'custom' && (role.isSystem || role.isTemplate)) return false;
      }
      return true;
    });
  }, [roles, filters]);

  if (!canViewRoles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles and their permissions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canBulkOperate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSelection(!showSelection)}
              className="flex items-center gap-2"
            >
              {showSelection ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              Bulk Actions
            </Button>
          )}
          
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refetchRoles}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {canCreateRoles && (
            <Button
              onClick={() => openModal('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                <Copy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.templates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Default</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.default}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <RoleFilters
        filters={filters}
        onUpdateFilters={updateFilters}
        onClearFilters={clearFilters}
        stats={stats}
      />

      {/* Bulk Actions Bar */}
      {showSelection && selectedRoles.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedRoles.size} role{selectedRoles.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedRoles(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              {canUpdateRoles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                  disabled={isBulkOperating}
                >
                  Activate
                </Button>
              )}
              {canUpdateRoles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={isBulkOperating}
                >
                  Deactivate
                </Button>
              )}
              {canCreateRoles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('clone')}
                  disabled={isBulkOperating}
                >
                  Clone
                </Button>
              )}
              {canDeleteRoles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={isBulkOperating}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Roles
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'Failed to load roles. Please try again.'}
          </p>
          <Button onClick={refetchRoles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Roles Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.status !== 'all' || filters.type !== 'all'
              ? 'No roles match your current filters. Try adjusting your search criteria.'
              : 'Get started by creating your first role.'}
          </p>
          {canCreateRoles && (
            <Button onClick={() => openModal('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Roles Grid/List */}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={canUpdateRoles ? (role) => openModal('edit', role) : undefined}
                onDelete={canDeleteRoles ? handleDeleteRole : undefined}
                onClone={canCreateRoles ? handleCloneRole : undefined}
                onViewUsers={canAssignRoles ? (role) => openModal('users', role) : undefined}
                onManagePermissions={canAssignRoles ? (role) => openModal('permissions', role) : undefined}
                onSelect={showSelection ? handleSelectRole : undefined}
                isSelected={selectedRoles.has(role.id)}
                showSelection={showSelection}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateRoleModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSubmit={handleCreateRole}
        isLoading={isCreating}
      />

      <CreateRoleModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdateRole}
        role={selectedRole}
        isLoading={isUpdating}
        mode="edit"
      />

      <PermissionsModal
        isOpen={modals.permissions}
        onClose={() => closeModal('permissions')}
        onSubmit={handleUpdatePermissions}
        role={selectedRole}
        isLoading={isUpdatingPermissions}
      />

      <RoleTemplateModal
        isOpen={modals.template}
        onClose={() => closeModal('template')}
        onSubmit={handleCreateRole}
        isLoading={isCreating}
      />

      <BulkActionsModal
        isOpen={modals.bulkActions}
        onClose={() => closeModal('bulkActions')}
        onConfirm={handleBulkAction}
        selectedCount={selectedRoles.size}
        isLoading={isBulkOperating}
      />
    </div>
  );
};

const RolesPage = () => {
  return (
    <PrivateRoute>
      <div className="container mx-auto px-4 py-8">
        <RolesPageContent />
      </div>
    </PrivateRoute>
  );
};

export default RolesPage; 