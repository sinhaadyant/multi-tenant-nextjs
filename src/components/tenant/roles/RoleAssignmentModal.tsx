"use client";

import React, { useState } from 'react';
import { X, Shield, Users, Search, UserCheck, UserX } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Role, User } from '@/hooks/useTenantRolesAPI';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  users: User[];
  onAssign: (data: { userId: string; roleId: string }) => void;
  onRemove: (data: { userId: string; roleId: string }) => void;
  loading: boolean;
}

const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  isOpen,
  onClose,
  role,
  users,
  onAssign,
  onRemove,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get users who already have this role
  const usersWithRole = users.filter(user => 
    user.roles?.some(userRole => userRole.id === role.id)
  );

  // Get users who don't have this role
  const usersWithoutRole = users.filter(user => 
    !user.roles?.some(userRole => userRole.id === role.id)
  );

  const handleAssignRole = () => {
    selectedUsers.forEach(userId => {
      onAssign({ userId, roleId: role.id });
    });
    setSelectedUsers([]);
  };

  const handleRemoveRole = (userId: string) => {
    onRemove({ userId, roleId: role.id });
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? usersWithoutRole.map(user => user.id) : []);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Role Assignment: {role.name}
                </CardTitle>
                <CardDescription>
                  Assign this role to users (single role per user)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Role Information */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: role.color || '#6b7280' }}
              />
              <div>
                <div className="font-medium">{role.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {role.description || 'No description'}
                </div>
              </div>
              <div className="ml-auto">
                <Badge variant="outline">
                  {usersWithRole.length} users assigned
                </Badge>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users with Role */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Users with this role as primary ({usersWithRole.length})
              </h3>
              
              {usersWithRole.length > 0 ? (
                <div className="space-y-2">
                  {usersWithRole
                    .filter(user =>
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Primary Role
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(user.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No users have this as their primary role</p>
              </div>
              )}
            </div>

            {/* Users without Role */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Users available for role assignment ({usersWithoutRole.length})
                </h3>
                {usersWithoutRole.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedUsers.length === usersWithoutRole.length && usersWithoutRole.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
                  </div>
                )}
              </div>
              
              {usersWithoutRole.length > 0 ? (
                <div className="space-y-2">
                  {usersWithoutRole
                    .filter(user =>
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                          />
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {user.roles?.length || 0} current role{user.roles?.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">All users already have this as their primary role</p>
              </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedUsers.length > 0 && (
                  <span>{selectedUsers.length} user(s) selected</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </Button>
                {selectedUsers.length > 0 && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAssignRole}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Assign as primary role to {selectedUsers.length} user(s)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleAssignmentModal;
