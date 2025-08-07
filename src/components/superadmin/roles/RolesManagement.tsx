"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Users, Calendar, Shield } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
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

  // Filter and sort roles
  const filteredRoles = React.useMemo(() => {
    let filtered = roles.filter((role: Role) => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && role.isActive) ||
                           (statusFilter === 'inactive' && !role.isActive);
      return matchesSearch && matchesStatus;
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
  }, [roles, searchTerm, statusFilter, sortBy, sortOrder]);

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

  const handleUpdateRole = async (roleData: any) => {
    if (!selectedRole) return;
    
    try {
      await updateRole(selectedRole.id, roleData);
      setModalType(null);
      setSelectedRole(null);
      showToast('Role updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete role "${selectedRole.name}"? This action cannot be undone and will affect all users assigned to this role.`,
      confirmText: 'Delete Role',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteRole(selectedRole.id);
          setModalType(null);
          setSelectedRole(null);
          showToast('Role deleted successfully', 'success');
        } catch (error: any) {
          showToast(error.message || 'Failed to delete role', 'error');
        }
      },
    });
  };

  const openModal = (type: 'create' | 'edit' | 'view' | 'delete', role?: Role) => {
    setModalType(type);
    if (role) {
      setSelectedRole(role);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRole(null);
  };

  // Handle sorting
  const handleSort = (field: 'name' | 'createdAt' | 'userCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (error) {
    return <ErrorComponent error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Roles Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create, edit, and manage user roles with specific permissions
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Button onClick={() => openModal('create')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-0">
          {loading ? (
            <RolesSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        Role Name
                        {sortBy === 'name' && (
                          <span className="text-brand-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('userCount')}>
                      <div className="flex items-center gap-1">
                        Users
                        {sortBy === 'userCount' && (
                          <span className="text-brand-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-1">
                        Created
                        {sortBy === 'createdAt' && (
                          <span className="text-brand-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="w-12 h-12 text-gray-300" />
                          <p className="text-lg font-medium">No roles found</p>
                          <p className="text-sm">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search or filters'
                              : 'Create your first role to get started'
                            }
                          </p>
                          {!searchTerm && statusFilter === 'all' && (
                            <Button onClick={() => openModal('create')} size="sm" className="mt-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Role
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                                         paginatedRoles.map((role: Role) => (
                      <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {role.name}
                              </div>
                                                             {role.isGlobal && (
                                 <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full mt-1">
                                   Global
                                 </span>
                               )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {role.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {role.userCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {new Date(role.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                             role.isActive 
                               ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                               : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                           }`}>
                             {role.isActive ? 'Active' : 'Inactive'}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <div className="relative">
                             <Button variant="outline" size="sm" onClick={() => {
                               const menu = document.getElementById(`role-menu-${role.id}`);
                               if (menu) menu.classList.toggle('hidden');
                             }}>
                               <MoreHorizontal className="w-4 h-4" />
                             </Button>
                             <div id={`role-menu-${role.id}`} className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                               <button
                                 onClick={() => openModal('view', role)}
                                 className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                               >
                                 <Eye className="w-4 h-4 mr-2" />
                                 View Details
                               </button>
                               <button
                                 onClick={() => openModal('edit', role)}
                                 className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                               >
                                 <Edit className="w-4 h-4 mr-2" />
                                 Edit Role
                               </button>
                               <button
                                 onClick={() => openModal('delete', role)}
                                 className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                               >
                                 <Trash2 className="w-4 h-4 mr-2" />
                                 Delete Role
                               </button>
                             </div>
                           </div>
                         </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
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
          onClose={closeModal}
          onSubmit={handleCreateRole}
        />
      )}

      {modalType === 'edit' && selectedRole && (
        <EditRoleModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleUpdateRole}
          role={selectedRole}
        />
      )}

      {modalType === 'view' && selectedRole && (
        <ViewRoleModal
          isOpen={true}
          onClose={closeModal}
          role={selectedRole}
        />
      )}

      {modalType === 'delete' && selectedRole && (
        <DeleteRoleModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={handleDeleteRole}
          role={selectedRole}
        />
      )}
    </div>
  );
};

export default RolesManagement; 