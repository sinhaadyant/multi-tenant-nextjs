"use client";

import React from 'react';
import { Key, User, Trash2, AlertTriangle, Shield, Mail, Clock, Calendar } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';

interface UserActionsTabProps {
  user: any;
  onResetPassword: () => void;
  onToggleStatus: () => void;
  isLoading: boolean;
}

const UserActionsTab: React.FC<UserActionsTabProps> = ({
  user,
  onResetPassword,
  onToggleStatus,
  isLoading,
}) => {
  const actions = [
    {
      id: 'reset-password',
      title: 'Reset Password',
      description: 'Send a password reset email to the user',
      icon: Key,
      color: 'blue',
      action: onResetPassword,
      variant: 'outline' as const,
    },
    {
      id: 'toggle-status',
      title: user.isActive ? 'Suspend User' : 'Activate User',
      description: user.isActive 
        ? 'Temporarily disable user access to the system'
        : 'Re-enable user access to the system',
      icon: User,
      color: user.isActive ? 'orange' : 'green',
      action: onToggleStatus,
      variant: user.isActive ? 'warning' as const : 'success' as const,
    },
  ];

  const getActionIcon = (action: any) => {
    const Icon = action.icon;
    return <Icon className="w-6 h-6" />;
  };

  const getActionColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      orange: 'text-orange-600 dark:text-orange-400',
      red: 'text-red-600 dark:text-red-400',
      purple: 'text-purple-600 dark:text-purple-400',
    };
    return colorMap[color] || 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          User Actions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage user account and perform administrative actions
        </p>
      </div>

      {/* User Status Overview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Account Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </p>
                <Badge
                  variant="light"
                  color={user.isActive ? 'success' : 'error'}
                  size="sm"
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Verified
                </p>
                <Badge
                  variant="light"
                  color="success"
                  size="sm"
                >
                  Verified
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Login
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Member Since
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Available Actions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${getActionColor(action.color)}`}>
                  {getActionIcon(action)}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                  <div className="mt-4">
                    <Button
                      variant={action.variant}
                      onClick={action.action}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Processing...
                        </>
                      ) : (
                        action.title
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Security Information
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account Security
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Password and access management
                </p>
              </div>
            </div>
            <Badge variant="light" color="success" size="sm">
              Secure
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session Management
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Active sessions and login history
                </p>
              </div>
            </div>
            <Badge variant="light" color="info" size="sm">
              {user.lastLogin ? 'Active' : 'No Sessions'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Risk Assessment
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Account security risk level
                </p>
              </div>
            </div>
            <Badge variant="light" color="success" size="sm">
              Low Risk
            </Badge>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Notes
            </h5>
            <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Password reset emails are sent to the user's registered email address</li>
              <li>• Suspended users cannot access the system until reactivated</li>
              <li>• All actions are logged for audit purposes</li>
              <li>• Changes take effect immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActionsTab;
