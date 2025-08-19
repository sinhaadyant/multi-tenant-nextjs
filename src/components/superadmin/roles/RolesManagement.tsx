"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Users, Calendar, Shield, Globe, Building } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';
import { useRolesAPI, Role } from '@/hooks/useRolesAPI';
import RolesSkeleton from './RolesSkeleton';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './EditRoleModal';
import ViewRoleModal from './ViewRoleModal';
import DeleteRoleModal from './DeleteRoleModal';
import { ErrorComponent } from '@/components/superadmin/ErrorComponent';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

const RolesManagement: React.FC = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirmModalContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState<'all' | 'global' | 'tenant'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'userCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete' | null>(null);

  const {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refetch
  } = useRolesAPI();
  console.log('🔍 Roles Management Debug:', roles);

  // Filter and sort roles
  const filteredRoles = React.useMemo(() => {
    let filtered = roles.filter((role: Role) => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && role.isActive) ||
                           (statusFilter === 'inactive' && !role.isActive);
      const matchesRoleType = roleTypeFilter === 'all' || 
                             (roleTypeFilter === 'global' && role.isGlobal) ||
                             (roleTypeFilter === 'tenant' && !role.isGlobal);
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
  const handleCreateRole = async (roleData: any) => {
    try {
      await createRole(roleData);
      setModalType(null);
      showToast('Role created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create role', 'error');
    }
  };

  const handleEditRole = async (roleData: any) => {
    try {
      await updateRole(selectedRole!.id, roleData);
      setModalType(null);
      setSelectedRole(null);
      showToast('Role updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRole(selectedRole.id);
      setModalType(null);
      setSelectedRole(null);
      showToast('Role deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete role', 'error');
    }
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setModalType('view');
  };

  const handleEditClick = (role: Role) => {
    // Prevent editing global roles
    if (role.isGlobal) {
      showToast('Global roles cannot be edited', 'warning');
      return;
    }
    setSelectedRole(role);
    setModalType('edit');
  };

  const handleDeleteClick = async (role: Role) => {
    // Prevent deleting global roles
    if (role.isGlobal) {
      showToast('Global roles cannot be deleted', 'warning');
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

  if (loading) return <RolesSkeleton />;
  if (error) return <ErrorComponent error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage global and tenant-specific roles</p>
        </div>
        <Button
          onClick={() => setModalType('create')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Role Type Filter */}
          <select
            value={roleTypeFilter}
            onChange={(e) => setRoleTypeFilter(e.target.value as 'all' | 'global' | 'tenant')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="global">Global Roles</option>
            <option value="tenant">Tenant Roles</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'name' | 'createdAt' | 'userCount');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="userCount-desc">Most Users</option>
            <option value="userCount-asc">Least Users</option>
          </select>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        {role.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {role.isGlobal ? (
                        <>
                          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Global</span>
                        </>
                      ) : (
                        <>
                          <Building className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Tenant</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {role.userCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      role.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(role.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewRole(role)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="View Role"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!role.isGlobal && (
                        <>
                          <button
                            onClick={() => handleEditClick(role)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            title="Edit Role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(role)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="Delete Role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedRoles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No roles found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || roleTypeFilter !== 'all'
                ? 'Try adjusting your filters to find roles.'
                : 'Get started by creating a new role.'}
            </p>
            {!searchTerm && statusFilter === 'all' && roleTypeFilter === 'all' && (
              <div className="mt-6">
                <Button onClick={() => setModalType('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalType === 'create' && (
        <CreateRoleModal
          onClose={() => setModalType(null)}
          onSubmit={handleCreateRole}
        />
      )}

      {modalType === 'edit' && selectedRole && (
        <EditRoleModal
          role={selectedRole}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
          onSubmit={handleEditRole}
        />
      )}

      {modalType === 'view' && selectedRole && (
        <ViewRoleModal
          role={selectedRole}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
        />
      )}

      {modalType === 'delete' && selectedRole && (
        <DeleteRoleModal
          role={selectedRole}
          onClose={() => {
            setModalType(null);
            setSelectedRole(null);
          }}
          onConfirm={handleDeleteRole}
        />
      )}
    </div>
  );
};

export default RolesManagement; 