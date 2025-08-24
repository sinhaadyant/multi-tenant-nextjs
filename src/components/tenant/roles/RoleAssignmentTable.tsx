"use client";

import React, { useState } from 'react';
import { Users, Shield, Save, UserCheck, UserX } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { User, Role } from '@/hooks/useTenantRolesAPI';

interface RoleAssignmentTableProps {
  users: User[];
  roles: Role[];
  onAssignRoles: (assignments: any[]) => Promise<void>;
  loading: boolean;
}

const RoleAssignmentTable: React.FC<RoleAssignmentTableProps> = ({
  users,
  roles,
  onAssignRoles,
  loading
}) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const handleRoleAssignment = (userId: string, roleId: string, action: 'assign' | 'remove') => {
    setAssignments(prev => {
      // Remove any existing assignment for this user-role combination
      const filtered = prev.filter(a => !(a.userId === userId && a.roleId === roleId));
      
      if (action === 'assign') {
        setHasChanges(true);
        return [...filtered, { userId, roleId, action }];
      } else {
        setHasChanges(true);
        return [...filtered, { userId, roleId, action }];
      }
    });
  };

  const handleSave = async () => {
    try {
      await onAssignRoles(assignments);
      setAssignments([]);
      setHasChanges(false);
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleReset = () => {
    setAssignments([]);
    setHasChanges(false);
  };

  const getUserRoles = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.roles || [];
  };

  const isRoleAssigned = (userId: string, roleId: string) => {
    const userRoles = getUserRoles(userId);
    return userRoles.some(role => role.id === roleId);
  };

  const getAssignmentAction = (userId: string, roleId: string) => {
    const assignment = assignments.find(a => a.userId === userId && a.roleId === roleId);
    if (!assignment) return null;
    return assignment.action;
  };

  const getEffectiveAssignment = (userId: string, roleId: string) => {
    const assignment = getAssignmentAction(userId, roleId);
    if (assignment === 'assign') return true;
    if (assignment === 'remove') return false;
    return isRoleAssigned(userId, roleId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Role Assignment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Assign single roles to users in your organization (one role per user)
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Assignments
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Assignment Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Role
                  </th>
                  {roles.map((role) => (
                    <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color || '#3B82F6' }}
                        />
                        <span className="truncate max-w-20">{role.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-500" />
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
                      <div className="flex flex-wrap gap-1">
                        {getUserRoles(user.id).map((role) => (
                          <Badge key={role.id} variant="outline" className="text-xs">
                            {role.name}
                          </Badge>
                        ))}
                        {getUserRoles(user.id).length === 0 && (
                          <span className="text-sm text-gray-400">No role assigned</span>
                        )}
                      </div>
                    </td>
                    {roles.map((role) => {
                      const isAssigned = getEffectiveAssignment(user.id, role.id);
                      const assignment = getAssignmentAction(user.id, role.id);
                      
                      return (
                        <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                                                         {isAssigned ? (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleRoleAssignment(user.id, role.id, 'remove')}
                                 disabled={loading}
                                 className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                               >
                                 <UserX className="w-4 h-4" />
                               </Button>
                             ) : (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleRoleAssignment(user.id, role.id, 'assign')}
                                 disabled={loading}
                                 className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                               >
                                 <UserCheck className="w-4 h-4" />
                               </Button>
                             )}
                            {assignment && (
                              <Badge 
                                variant={assignment === 'assign' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {assignment === 'assign' ? 'Will Assign' : 'Will Remove'}
                              </Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assignment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {users.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {assignments.filter(a => a.action === 'assign').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Primary Roles to Assign</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {assignments.filter(a => a.action === 'remove').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Roles to Replace</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {roles.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Available Roles</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleAssignmentTable;
