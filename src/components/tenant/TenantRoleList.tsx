"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Users, Calendar, Shield, Filter } from 'lucide-react';
import { Role, RoleFilters } from '@/hooks/useTenantRolesAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import Badge from '@/components/ui/badge/Badge';

interface TenantRoleListProps {
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

const TenantRoleList: React.FC<TenantRoleListProps> = ({
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
      if (!role) return false;
      
      const roleName = role.name || '';
      const roleDescription = role.description || '';
      
      const matchesSearch = roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           roleDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && role.isActive) ||
                           (statusFilter === 'inactive' && !role.isActive);
      
      return matchesSearch && matchesStatus;
    });

    // Sort roles
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || new Date());
          bValue = new Date(b.createdAt || new Date());
          break;
        case 'userCount':
          aValue = a.userCount || 0;
          bValue = b.userCount || 0;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
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
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    onSearch(value);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    setCurrentPage(1);
    onFilter({ ...currentFilters, status, page: 1 });
  };

  const handleSort = (field: keyof Role) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  const handleDeleteRole = async (role: Role) => {
    const confirmed = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await onDeleteRole(role);
        showToast('Role deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete role', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-t-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 border-b"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
            <p className="text-sm text-gray-600">
              Manage user roles and permissions for your tenant
            </p>
          </div>
          <Button onClick={onCreateRole} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>
      </div>

      {/* Role List */}
      <div className="overflow-hidden">
        {paginatedRoles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new role.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Button onClick={onCreateRole}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedRoles.map((role) => (
              <div key={role.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {role.name}
                          </h3>
                          <Badge variant={role.isActive ? 'success' : 'danger'}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {role.isSystem && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {role.description || 'No description'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {role.userCount || 0} users
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Created {new Date(role.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewRole(role)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRole(role)}
                      disabled={role.isSystem}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      disabled={role.isSystem}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRoles.length)} of {filteredRoles.length} roles
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantRoleList;
