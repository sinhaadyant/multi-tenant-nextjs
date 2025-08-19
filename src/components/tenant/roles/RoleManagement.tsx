"use client";

import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Users, Shield, Settings, Copy, Download, Upload } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { Role, Module, CreateRoleData, UpdateRoleData } from '@/hooks/useTenantRolesPermissions';

interface RoleManagementProps {
  roles: Role[];
  modules: Module[];
  loading: boolean;
  onCreateRole: (roleData: CreateRoleData) => Promise<void>;
  onUpdateRole: (roleId: string, roleData: UpdateRoleData) => Promise<void>;
  onDeleteRole: (roleId: string) => Promise<void>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  searchTerm: string;
  filters: any;
}

const RoleManagement: React.FC<RoleManagementProps> = ({
  roles,
  modules,
  loading,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  canCreate,
  canUpdate,
  canDelete,
  searchTerm,
  filters
}) => {
  const { showToast } = useToast();
  const { showConfirmModal } = useConfirmModalContext();
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [localFilters, setLocalFilters] = useState(filters);

  // Handle role selection
  const handleRoleSelect = useCallback((roleId: string, checked: boolean) => {
    setSelectedRoles(prev => 
      checked 
        ? [...prev, roleId]
        : prev.filter(id => id !== roleId)
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedRoles(checked ? roles.map(role => role.id) : []);
  }, [roles]);

  // Handle create role
  const handleCreateRole = useCallback(async (roleData: CreateRoleData) => {
    try {
      await onCreateRole(roleData);
      setShowCreateModal(false);
      showToast('Role created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create role', 'error');
    }
  }, [onCreateRole, showToast]);

  // Handle update role
  const handleUpdateRole = useCallback(async (roleId: string, roleData: UpdateRoleData) => {
    try {
      await onUpdateRole(roleId, roleData);
      setEditingRole(null);
      showToast('Role updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    }
  }, [onUpdateRole, showToast]);

  // Handle delete role
  const handleDeleteRole = useCallback(async (role: Role) => {
    showConfirmModal({
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await onDeleteRole(role.id);
          showToast('Role deleted successfully', 'success');
        } catch (error: any) {
          showToast(error.message || 'Failed to delete role', 'error');
        }
      }
    });
  }, [onDeleteRole, showToast, showConfirmModal]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedRoles.length === 0) return;

    showConfirmModal({
      title: 'Delete Multiple Roles',
      message: `Are you sure you want to delete ${selectedRoles.length} selected roles? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await Promise.all(selectedRoles.map(roleId => onDeleteRole(roleId)));
          setSelectedRoles([]);
          showToast(`${selectedRoles.length} roles deleted successfully`, 'success');
        } catch (error: any) {
          showToast(error.message || 'Failed to delete roles', 'error');
        }
      }
    });
  }, [selectedRoles, onDeleteRole, showToast, showConfirmModal]);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle role status toggle
  const handleStatusToggle = useCallback(async (role: Role) => {
    try {
      await onUpdateRole(role.id, { isActive: !role.isActive });
      showToast(`Role ${role.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update role status', 'error');
    }
  }, [onUpdateRole, showToast]);

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = localFilters.status === 'all' || 
      (localFilters.status === 'active' && role.isActive) ||
      (localFilters.status === 'inactive' && !role.isActive);
    
    const matchesType = localFilters.roleType === 'all' ||
      (localFilters.roleType === 'system' && role.isSystem) ||
      (localFilters.roleType === 'custom' && !role.isSystem);

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Roles Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage user roles for your organization
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
          {selectedRoles.length > 0 && canDelete && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedRoles.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select
                value={localFilters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <Select
                value={localFilters.roleType}
                onValueChange={(value) => handleFilterChange('roleType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Module
              </label>
              <Select
                value={localFilters.module}
                onValueChange={(value) => handleFilterChange('module', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module.moduleKey} value={module.moduleKey}>
                      {module.moduleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Roles ({filteredRoles.length})</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              {roles.reduce((total, role) => total + role.userCount, 0)} total users
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleSelect(role.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color || '#6b7280' }}
                        />
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                        {role.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{role.userCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{role.permissions.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={role.isActive}
                          onCheckedChange={() => handleStatusToggle(role)}
                          disabled={!canUpdate || role.isSystem}
                        />
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? "default" : "outline"}>
                        {role.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingRole(role)}
                          title="View Role"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canUpdate && !role.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && !role.isSystem && role.userCount === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No roles found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || Object.values(localFilters).some(v => v !== 'all')
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first role'
                }
              </p>
              {canCreate && !searchTerm && Object.values(localFilters).every(v => v === 'all') && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Role
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <RoleForm
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRole}
          modules={modules}
          loading={loading}
        />
      )}

      {editingRole && (
        <RoleForm
          isOpen={true}
          onClose={() => setEditingRole(null)}
          onSubmit={(data) => handleUpdateRole(editingRole.id, data)}
          role={editingRole}
          modules={modules}
          loading={loading}
        />
      )}

      {viewingRole && (
        <RoleViewModal
          isOpen={true}
          onClose={() => setViewingRole(null)}
          role={viewingRole}
        />
      )}
    </div>
  );
};

// Role Form Component
interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => Promise<void>;
  role?: Role;
  modules: Module[];
  loading: boolean;
}

const RoleForm: React.FC<RoleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  modules,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    color: role?.color || '#3b82f6',
    permissions: role?.permissions || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {role ? 'Edit Role' : 'Create Role'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter role name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter role description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-20 h-10"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Role View Modal Component
interface RoleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

const RoleViewModal: React.FC<RoleViewModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Role Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color || '#6b7280' }}
            />
            <h3 className="text-lg font-medium">{role.name}</h3>
            {role.isDefault && (
              <Badge variant="secondary">Default</Badge>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <p className="text-gray-600 dark:text-gray-400">
              {role.description || 'No description provided'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Badge variant={role.isActive ? "default" : "secondary"}>
                {role.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Badge variant={role.isSystem ? "default" : "outline"}>
                {role.isSystem ? 'System' : 'Custom'}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Users</label>
              <p className="text-gray-600 dark:text-gray-400">{role.userCount}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Permissions</label>
              <p className="text-gray-600 dark:text-gray-400">{role.permissions.length}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="space-y-2">
              {role.permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium">{permission.moduleName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {permission.moduleKey}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {permission.canCreate && <Badge variant="outline">Create</Badge>}
                    {permission.canRead && <Badge variant="outline">Read</Badge>}
                    {permission.canUpdate && <Badge variant="outline">Update</Badge>}
                    {permission.canDelete && <Badge variant="outline">Delete</Badge>}
                    {permission.canViewAll && <Badge variant="outline">View All</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
