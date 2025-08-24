"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Settings,
  Eye,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  Globe,
  Building
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useTenantRolesAPI, Role, CreateRoleData, UpdateRoleData } from '@/hooks/useTenantRolesAPI';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import CreateRoleModal from './roles/CreateRoleModal';
import EditRoleModal from './roles/EditRoleModal';
import ViewRoleModal from './roles/ViewRoleModal';
import DeleteRoleModal from './roles/DeleteRoleModal';
import RoleAssignmentModal from './roles/RoleAssignmentModal';
import RoleAssignmentTable from './roles/RoleAssignmentTable';
import { ErrorComponent } from '@/components/superadmin/ErrorComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';

const TenantRolesClient: React.FC = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, hasPermission } = useReduxAuth();
  const { confirm } = useConfirmModalContext();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'userCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete' | 'assign' | null>(null);

  // API hooks
  const {
    useRoles,
    useAllRoles,
    useModules,
    useUsers,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useBulkDeleteRoles,
    useToggleRoleStatus,
    useAssignRole,
    useRemoveRole
  } = useTenantRolesAPI();

  // Queries
  const {
    data: rolesData,
    isLoading,
    error,
    refetch
  } = useRoles(currentPage, itemsPerPage, searchTerm, statusFilter);

  const { data: allRoles } = useAllRoles();
  const { data: modules } = useModules();
  const { data: users } = useUsers();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const bulkDeleteMutation = useBulkDeleteRoles();
  const toggleStatusMutation = useToggleRoleStatus();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();

  // Extract data
  const roles = rolesData?.roles || [];
  const pagination = rolesData?.pagination;
  const stats = rolesData?.stats;
  const permissions = rolesData?.permissions;

  // Filter and sort roles
  const filteredRoles = React.useMemo(() => {
    let filtered = roles.filter((role: Role) => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && role.isActive) ||
                           (statusFilter === 'inactive' && !role.isActive);
      const matchesRoleType = roleTypeFilter === 'all' || 
                             (roleTypeFilter === 'system' && role.isSystem) ||
                             (roleTypeFilter === 'custom' && !role.isSystem);
      return matchesSearch && matchesStatus && matchesRoleType;
    });

    // Sort roles
    filtered.sort((a: Role, b: Role) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'userCount':
          aValue = a.userCount;
          bValue = b.userCount;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [roles, searchTerm, statusFilter, roleTypeFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle role actions
  const handleCreateRole = async (roleData: CreateRoleData) => {
    try {
      await createRoleMutation.mutateAsync(roleData);
      setModalType(null);
    } catch (error: any) {
      // Error is handled by the mutation
    }
  };

  const handleEditRole = async (roleData: UpdateRoleData) => {
    if (!selectedRole) return;
    
    try {
      await updateRoleMutation.mutateAsync({ roleId: selectedRole.id, roleData });
      setModalType(null);
      setSelectedRole(null);
    } catch (error: any) {
      // Error is handled by the mutation
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRoleMutation.mutateAsync(selectedRole.id);
      setModalType(null);
      setSelectedRole(null);
    } catch (error: any) {
      // Error is handled by the mutation
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) return;

    const confirmed = await confirm({
      title: 'Delete Multiple Roles',
      message: `Are you sure you want to delete ${selectedRoles.length} selected roles? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (confirmed) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedRoles);
        setSelectedRoles([]);
      } catch (error: any) {
        // Error is handled by the mutation
      }
    }
  };

  const handleToggleStatus = async (role: Role) => {
    try {
      await toggleStatusMutation.mutateAsync({ 
        roleId: role.id, 
        isActive: !role.isActive 
      });
    } catch (error: any) {
      // Error is handled by the mutation
    }
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setModalType('view');
  };

  const handleEditClick = (role: Role) => {
    // Prevent editing system roles
    if (role.isSystem) {
      // Show toast warning
      return;
    }
    setSelectedRole(role);
    setModalType('edit');
  };

  const handleDeleteClick = async (role: Role) => {
    // Prevent deleting system roles
    if (role.isSystem) {
      // Show toast warning
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (confirmed) {
      setSelectedRole(role);
      setModalType('delete');
    }
  };

  const handleAssignRole = (role: Role) => {
    setSelectedRole(role);
    setModalType('assign');
  };

  // Handle role selection
  const handleRoleSelect = (roleId: string, checked: boolean) => {
    setSelectedRoles(prev => 
      checked 
        ? [...prev, roleId]
        : prev.filter(id => id !== roleId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedRoles(checked ? paginatedRoles.map(role => role.id) : []);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role color
  const getRoleColor = (color?: string) => {
    return color || '#3B82F6';
  };

  // Get status color
  const getStatusColor = (status: boolean) => {
    return status
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  if (isLoading) {
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

  if (error) {
    return <ErrorComponent error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and permissions within your tenant organization
          </p>
        </div>
        <div className="flex gap-2">
          {permissions?.canCreate && (
            <Button
              onClick={() => setModalType('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Role
            </Button>
          )}
          {selectedRoles.length > 0 && permissions?.canDelete && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedRoles.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Roles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Roles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Type Filter */}
            <Select value={roleTypeFilter} onValueChange={(value: any) => setRoleTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value: any) => {
              const [field, order] = value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="userCount-desc">Most Users</SelectItem>
                <SelectItem value="userCount-asc">Least Users</SelectItem>
              </SelectContent>
            </Select>
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
                      checked={selectedRoles.length === paginatedRoles.length && paginatedRoles.length > 0}
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
                {paginatedRoles.map((role) => (
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
                          style={{ backgroundColor: getRoleColor(role.color) }}
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
                          onCheckedChange={() => handleToggleStatus(role)}
                          disabled={!permissions?.canUpdate || role.isSystem}
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
                        {formatDate(role.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRole(role)}
                          title="View Role"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {permissions?.canUpdate && !role.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(role)}
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {permissions?.canDelete && !role.isSystem && role.userCount === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(role)}
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignRole(role)}
                          title="Assign Role"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paginatedRoles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No roles found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all' || roleTypeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first role'
                }
              </p>
              {permissions?.canCreate && !searchTerm && statusFilter === 'all' && roleTypeFilter === 'all' && (
                <Button
                  onClick={() => setModalType('create')}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalType === 'create' && (
        <CreateRoleModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onSubmit={handleCreateRole}
          modules={modules || []}
          loading={createRoleMutation.isPending}
        />
      )}

      {modalType === 'edit' && selectedRole && (
        <EditRoleModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
          onSubmit={handleEditRole}
          role={selectedRole}
          modules={modules || []}
          loading={updateRoleMutation.isPending}
        />
      )}

      {modalType === 'view' && selectedRole && (
        <ViewRoleModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
          role={selectedRole}
        />
      )}

      {modalType === 'delete' && selectedRole && (
        <DeleteRoleModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
          onConfirm={handleDeleteRole}
          role={selectedRole}
          loading={deleteRoleMutation.isPending}
        />
      )}

      {modalType === 'assign' && selectedRole && (
        <RoleAssignmentModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
          role={selectedRole}
          users={users || []}
          onAssign={assignRoleMutation.mutate}
          onRemove={removeRoleMutation.mutate}
          loading={assignRoleMutation.isPending || removeRoleMutation.isPending}
        />
      )}
    </div>
  );
};

export default TenantRolesClient;
