"use client";

import React, { useState } from 'react';
import { Shield, Users, Edit, Trash2, Eye, MoreHorizontal, Search, Filter } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Role } from '@/hooks/useTenantRolesAPI';

interface RoleListProps {
  roles: Role[];
  loading: boolean;
  permissions?: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onViewRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
  onToggleStatus: (role: Role) => void;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  loading,
  permissions,
  onCreateRole,
  onEditRole,
  onViewRole,
  onDeleteRole,
  onToggleStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (color?: string) => {
    return color || '#3B82F6';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                  <TableHead>Role</TableHead>
                  {/* <TableHead>Description</TableHead> */}
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
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRoleColor(role.color) }}
                        />
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
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
                          onCheckedChange={() => onToggleStatus(role)}
                          disabled={!permissions?.canUpdate || role.isSystem}
                        />
                        <Badge variant={role.isActive ? "default" : "outline"}>
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
                          onClick={() => onViewRole(role)}
                          title="View Role"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {permissions?.canUpdate && !role.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRole(role)}
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {permissions?.canDelete && !role.isSystem && role.userCount === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRole(role)}
                            title="Delete Role"
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                {searchTerm || statusFilter !== 'all' || roleTypeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first role'
                }
              </p>
              {permissions?.canCreate && !searchTerm && statusFilter === 'all' && roleTypeFilter === 'all' && (
                <Button
                  onClick={onCreateRole}
                  variant="primary"
                >
                  Create First Role
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleList;
