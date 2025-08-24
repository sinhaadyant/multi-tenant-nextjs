"use client";

import React from 'react';
import { X, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Role } from '@/hooks/useTenantRolesAPI';

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  role: Role;
  loading: boolean;
}

const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Delete Role
                </CardTitle>
                <CardDescription>
                  This action cannot be undone
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
          
          <CardContent className="space-y-4">
            {/* Warning Message */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                You are about to delete the role "{role.name}". This action will permanently remove the role and all its associated permissions.
              </p>
            </div>

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
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Users:</span>
                <span className="ml-2 font-medium">{role.userCount}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Permissions:</span>
                <span className="ml-2 font-medium">{role.permissions.length}</span>
              </div>
            </div>

            {/* Additional Warnings */}
            {role.userCount > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Users Assigned</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  This role is currently assigned to {role.userCount} user(s). Deleting this role will remove it from all users.
                </p>
              </div>
            )}

            {role.isSystem && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">System Role</span>
                </div>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  This is a system role. Deleting it may affect system functionality.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Role
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
