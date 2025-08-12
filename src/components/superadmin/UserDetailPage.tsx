"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Shield, Key, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { useUser, useUpdateUser, useResetUserPassword, useToggleUserStatus } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRolesAPI';
import { usePermissions } from '@/hooks/usePermissions';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { toast } from 'react-hot-toast';
import UserDetailsTab from './UserDetailsTab';
import UserModulesTab from './UserModulesTab';
import UserRolesTab from './UserRolesTab';
import UserPermissionsTab from './UserPermissionsTab';
import UserActionsTab from './UserActionsTab';

interface UserDetailPageProps {
  userId: string;
}

type TabType = 'details' | 'modules' | 'roles' | 'permissions' | 'actions';

const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId }) => {
  const router = useRouter();
  const { confirm } = useConfirmModalContext();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isEditing, setIsEditing] = useState(false);

  // Data hooks
  const { data: userData, isLoading, error, refetch } = useUser(userId);
  const { data: rolesData } = useRoles();
  const { data: permissionsData } = usePermissions();
  
  // Mutation hooks
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetUserPassword();
  const toggleStatusMutation = useToggleUserStatus();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
    isActive: true,
  });

  // Update form data when user data loads
  useEffect(() => {
    if (userData?.data?.user) {
      const user = userData.data.user;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        roleId: user.role?.id || '',
        isActive: user.isActive ?? true,
      });
    }
  }, [userData]);

  const user = userData?.data?.user;
  const roles = rolesData?.roles || [];
  const permissions = permissionsData?.permissions || [];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: formData,
      });
      
      toast.success('User updated successfully!');
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  // Handle reset password
  const handleResetPassword = () => {
    confirm({
      title: 'Reset Password',
      message: `Are you sure you want to reset the password for "${user?.name}"? They will receive an email with a new temporary password.`,
      confirmText: 'Reset Password',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await resetPasswordMutation.mutateAsync(userId);
          toast.success('Password reset email sent successfully!');
        } catch (error: any) {
          toast.error(error.message || 'Failed to reset password');
        }
      },
    });
  };

  // Handle toggle status
  const handleToggleStatus = () => {
    const action = user?.isActive ? 'suspend' : 'activate';
    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} user "${user?.name}"? ${user?.isActive ? 'They will not be able to access the system until reactivated.' : 'They will regain access to the system.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      variant: user?.isActive ? 'warning' : 'success',
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({
            id: userId,
            isActive: !user?.isActive,
          });
          toast.success(`User ${action}d successfully!`);
          refetch();
        } catch (error: any) {
          toast.error(error.message || `Failed to ${action} user`);
        }
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Failed to load user
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error.message || 'An error occurred while fetching user details.'}
          </p>
          <div className="mt-4 flex justify-center space-x-3">
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User not found
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            User not found
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The user you're looking for doesn't exist or has been deleted.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details' as TabType, label: 'Details', icon: User },
    { id: 'modules' as TabType, label: 'Modules', icon: Settings },
    { id: 'roles' as TabType, label: 'Roles', icon: Shield },
    { id: 'permissions' as TabType, label: 'Permissions', icon: Key },
    { id: 'actions' as TabType, label: 'Actions', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    User Details
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage user information and permissions
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  variant="light"
                  color={user.isActive ? 'success' : 'error'}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {user.role && (
                  <Badge variant="light" color="info">
                    {user.role.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                  {user.lastLogin && (
                    <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {resetPasswordMutation.isPending ? 'Sending...' : 'Reset Password'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={toggleStatusMutation.isPending}
                >
                  {user.isActive ? (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      {toggleStatusMutation.isPending ? 'Suspending...' : 'Suspend'}
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      {toggleStatusMutation.isPending ? 'Activating...' : 'Activate'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <UserDetailsTab
                user={user}
                roles={roles}
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSubmit={handleSubmit}
                isLoading={updateUserMutation.isPending}
              />
            )}
            
            {activeTab === 'modules' && (
              <UserModulesTab user={user} permissions={permissions} />
            )}
            
            {activeTab === 'roles' && (
              <UserRolesTab user={user} roles={roles} />
            )}
            
            {activeTab === 'permissions' && (
              <UserPermissionsTab user={user} permissions={permissions} />
            )}
            
            {activeTab === 'actions' && (
              <UserActionsTab
                user={user}
                onResetPassword={handleResetPassword}
                onToggleStatus={handleToggleStatus}
                isLoading={resetPasswordMutation.isPending || toggleStatusMutation.isPending}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;

