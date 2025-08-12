"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Users, Calendar, Shield, Filter } from 'lucide-react';
import { Role, RoleFilters } from '@/hooks/useRolesPermissionsAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

interface RoleListProps {
  roles: Role[];
  loading: boolean;
  onSearch: (search: string) => void;
  onFilter: (filters: RoleFilters) => void;
  onSort: (field: keyof Role, order: 'asc' | 'desc') => void;
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onViewRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
  currentFilters: RoleFilters;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  loading,
  onSearch,
  onFilter,
  onSort,
  onCreateRole,
  onEditRole,
  onViewRole,
  onDeleteRole,
  currentFilters
}) => {
  const { showToast } = useToast();
  const { confirm } = useConfirmModalContext();
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(currentFilters.status || 'all');
  const [sortBy, setSortBy] = useState<keyof Role>(currentFilters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(currentFilters.sortOrder || 'asc');
  const [currentPage, setCurrentPage] = useState(currentFilters.page || 1);
  const [itemsPerPage] = useState(currentFilters.limit || 10);

  // Filter and sort roles
  const filteredRoles = useMemo(() => {
    let filtered = roles.filter((role) => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && role.isActive) ||
                           (statusFilter === 'inactive' && !role.isActive);
      return matchesSearch && matchesStatus;
    });

    // Sort roles
    filtered.sort((a, b) => {
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

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    onFilter({ ...currentFilters, status, page: 1 });
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field: keyof Role) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onFilter({ ...currentFilters, page });
  };

  // Handle delete role
  const handleDeleteRole = (role: Role) => {
    confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete role "${role.name}"? This action cannot be undone and will affect all users assigned to this role.`,
      confirmText: 'Delete Role',
      variant: 'danger',
      onConfirm: () => {
        onDeleteRole(role);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Roles Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create, edit, and manage user roles with specific permissions
          </p>
        </div>
        <Button onClick={onCreateRole} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{filteredRoles.length} roles found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading roles...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('name')}>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('userCount')}>
                      <div className="flex items-center gap-1">
                        Users
                        {sortBy === 'userCount' && (
                          <span className="text-brand-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('createdAt')}>
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
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                            <Button onClick={onCreateRole} size="sm" className="mt-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Role
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                                onClick={() => onViewRole(role)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={() => onEditRole(role)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Role
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role)}
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
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleList;
