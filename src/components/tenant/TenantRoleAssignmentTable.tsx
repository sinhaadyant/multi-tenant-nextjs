"use client";

import React, { useState, useEffect } from 'react';
import { Users, Shield, Save, Search, Filter } from 'lucide-react';
import Button from '@/components/ui/button/Button';

interface TenantRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Array<{
    id: string;
    name: string;
    description?: string;
    module: string;
    action: string;
  }>;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleId?: string;
  roleName?: string;
  createdAt: string;
}

interface TenantRoleAssignmentTableProps {
  onAssignRoles: (assignments: any[]) => void;
  loading?: boolean;
}

const TenantRoleAssignmentTable: React.FC<TenantRoleAssignmentTableProps> = ({
  onAssignRoles,
  loading = false
}) => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockUsers: TenantUser[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        isActive: true,
        roleId: '1',
        roleName: 'Admin',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        isActive: true,
        roleId: '2',
        roleName: 'Manager',
        createdAt: '2024-01-02T00:00:00Z'
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        isActive: false,
        roleId: '3',
        roleName: 'User',
        createdAt: '2024-01-03T00:00:00Z'
      },
      {
        id: '4',
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        isActive: true,
        roleId: undefined,
        roleName: undefined,
        createdAt: '2024-01-04T00:00:00Z'
      }
    ];

    const mockRoles: TenantRole[] = [
      {
        id: '1',
        name: 'Admin',
        description: 'Full system access',
        isActive: true,
        isDefault: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        userCount: 1,
        permissions: []
      },
      {
        id: '2',
        name: 'Manager',
        description: 'Department management access',
        isActive: true,
        isDefault: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        userCount: 1,
        permissions: []
      },
      {
        id: '3',
        name: 'User',
        description: 'Basic user access',
        isActive: true,
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        userCount: 1,
        permissions: []
      }
    ];

    setUsers(mockUsers);
    setRoles(mockRoles);

    // Initialize assignments
    const initialAssignments: Record<string, string> = {};
    mockUsers.forEach(user => {
      if (user.roleId) {
        initialAssignments[user.id] = user.roleId;
      }
    });
    setAssignments(initialAssignments);
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    const matchesRole = roleFilter === 'all' || 
                       (roleFilter === 'unassigned' && !user.roleId) ||
                       (user.roleId === roleFilter);
    
    return matchesSearch && matchesStatus && matchesRole;
  });

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

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const assignmentsArray = Object.entries(assignments).map(([userId, roleId]) => ({
        userId,
        roleId
      }));
      
      await onAssignRoles(assignmentsArray);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving role assignments:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    const initialAssignments: Record<string, string> = {};
    users.forEach(user => {
      if (user.roleId) {
        initialAssignments[user.id] = user.roleId;
      }
    });
    setAssignments(initialAssignments);
    setHasChanges(false);
  };

  // Get role name by ID
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Role Assignment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Assign roles to users in your organization
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={loading || isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || isSaving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Assignments
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="unassigned">Unassigned</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                ? 'No users match your filters.' 
                : 'No users found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assign Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {user.name.split(' ').map(n => n[0]).join('')}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.roleName ? (
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.roleName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No role assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={assignments[user.id] || ''}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        disabled={loading || isSaving}
                      >
                        <option value="">No Role</option>
                        {roles.filter(role => role.isActive).map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Assignment Summary
            </h4>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• Total users: {users.length}</p>
              <p>• Users with roles: {Object.keys(assignments).length}</p>
              <p>• Users without roles: {users.length - Object.keys(assignments).length}</p>
              <p>• Active roles available: {roles.filter(r => r.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantRoleAssignmentTable;
