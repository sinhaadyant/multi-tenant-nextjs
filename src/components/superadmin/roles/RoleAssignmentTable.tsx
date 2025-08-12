"use client";

import React, { useState, useMemo } from 'react';
import { Save, Users, Shield, Search, Filter } from 'lucide-react';
import { User, Role, RoleAssignment } from '@/hooks/useRolesPermissionsAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { useToast } from '@/context/ToastContext';

interface RoleAssignmentTableProps {
  users: User[];
  roles: Role[];
  onAssignRoles: (assignments: RoleAssignment[]) => Promise<void>;
  loading?: boolean;
}

interface UserRoleAssignment {
  userId: string;
  roleId: string;
  userName: string;
  userEmail: string;
  roleName: string;
}

const RoleAssignmentTable: React.FC<RoleAssignmentTableProps> = ({
  users,
  roles,
  onAssignRoles,
  loading = false
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [assignments, setAssignments] = useState<{ [userId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize assignments from current user roles
  useMemo(() => {
    const initialAssignments: { [userId: string]: string } = {};
    users.forEach(user => {
      if (user.roleId) {
        initialAssignments[user.id] = user.roleId;
      }
    });
    setAssignments(initialAssignments);
    setHasChanges(false);
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive);
      const matchesRole = roleFilter === 'all' || 
                         (roleFilter === 'unassigned' && !user.roleId) ||
                         (roleFilter !== 'unassigned' && user.roleId === roleFilter);
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Handle role assignment change
  const handleRoleChange = (userId: string, roleId: string) => {
    const newAssignments = { ...assignments };
    if (roleId === '') {
      delete newAssignments[userId];
    } else {
      newAssignments[userId] = roleId;
    }
    setAssignments(newAssignments);
    setHasChanges(true);
  };

  // Handle bulk role assignment
  const handleBulkAssign = (roleId: string) => {
    const newAssignments = { ...assignments };
    filteredUsers.forEach(user => {
      newAssignments[user.id] = roleId;
    });
    setAssignments(newAssignments);
    setHasChanges(true);
  };

  // Handle clear all assignments
  const handleClearAll = () => {
    const newAssignments = { ...assignments };
    filteredUsers.forEach(user => {
      delete newAssignments[user.id];
    });
    setAssignments(newAssignments);
    setHasChanges(true);
  };

  // Handle save assignments
  const handleSaveAssignments = async () => {
    setIsSaving(true);
    try {
      const assignmentsToSave: RoleAssignment[] = Object.entries(assignments).map(([userId, roleId]) => ({
        userId,
        roleId
      }));

      await onAssignRoles(assignmentsToSave);
      setHasChanges(false);
      showToast('Role assignments updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update role assignments', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Get role name by ID
  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  // Get assignment count
  const getAssignmentCount = (): number => {
    return Object.keys(assignments).length;
  };

  // Get filtered assignment count
  const getFilteredAssignmentCount = (): number => {
    return filteredUsers.filter(user => assignments[user.id]).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Role Assignment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assign roles to users to control their access and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={loading || isSaving}
          >
            Clear All
          </Button>
          <Button
            onClick={handleSaveAssignments}
            disabled={!hasChanges || loading || isSaving}
            size="sm"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Assignments
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search users..."
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
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400"
              >
                <option value="all">All Roles</option>
                <option value="unassigned">Unassigned</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{filteredUsers.length} users found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Bulk Role Assignment
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Assign the same role to all filtered users
            </p>
          </div>
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAssign(e.target.value);
                }
              }}
              className="px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:bg-blue-900/50 dark:border-blue-700 dark:text-white"
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assign Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-gray-300" />
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-sm">
                            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                              ? 'Try adjusting your search or filters'
                              : 'No users available for role assignment'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.roleId ? getRoleName(user.roleId) : (
                              <span className="text-gray-500 dark:text-gray-400 italic">No role assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={assignments[user.id] || ''}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={loading || isSaving}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-brand-400 dark:focus:border-brand-400 disabled:opacity-50"
                          >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
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

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{getAssignmentCount()}</span> total assignments •{' '}
            <span className="font-medium">{getFilteredAssignmentCount()}</span> in current view
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {hasChanges && (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentTable;

