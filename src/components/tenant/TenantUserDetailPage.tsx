"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

interface User {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
    color?: string;
  }>;
  recentActivity?: Array<{
    action: string;
    details: string;
    createdAt: string;
    ipAddress?: string;
  }>;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface UserDetailResponse {
  user: User;
  permissions: {
    canUpdate: boolean;
    canDelete: boolean;
  };
}

const TenantUserDetailPage: React.FC<{ userId: string }> = ({ userId }) => {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const queryClient = useQueryClient();
  const { confirm } = useConfirmModalContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    isActive: true,
    roleIds: [] as string[]
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Fetch user details
  const {
    data: userData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tenant-user-detail', tenantSlug, userId],
    queryFn: async (): Promise<UserDetailResponse> => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/tenant/${tenantSlug}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    },
    enabled: !!tenantSlug && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch roles for the form
  const { data: rolesData } = useQuery({
    queryKey: ['tenant-roles', tenantSlug],
    queryFn: async (): Promise<Role[]> => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/tenant/${tenantSlug}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { page: 1, limit: 100 }
      });
      return response.data.data.roles || [];
    },
    enabled: !!tenantSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.put(`/api/tenant/${tenantSlug}/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-user-detail'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setIsEditing(false);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      await axios.delete(`/api/tenant/${tenantSlug}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      router.push(`/${tenantSlug}/users`);
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.post(`/api/tenant/${tenantSlug}/users/${userId}/reset-password`, {
        password
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      setShowPasswordReset(false);
      setNewPassword('');
    }
  });

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (userData?.user) {
      setFormData({
        name: userData.user.name,
        email: userData.user.email,
        contactNumber: userData.user.contactNumber || '',
        isActive: userData.user.isActive,
        roleIds: userData.user.roles.map(role => role.id)
      });
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId) 
        ? prev.roleIds.filter(id => id !== roleId)
        : [roleId] // Only allow one role
    }));
  };

  const handleSave = async () => {
    try {
      await updateUserMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleCancel = () => {
    if (userData?.user) {
      setFormData({
        name: userData.user.name,
        email: userData.user.email,
        contactNumber: userData.user.contactNumber || '',
        isActive: userData.user.isActive,
        roleIds: userData.user.roles.map(role => role.id)
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${userData?.user.name || userData?.user.email}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteUserMutation.mutateAsync();
        } catch (error) {
          console.error('Failed to delete user:', error);
        }
      },
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync(newPassword);
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading User
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load user'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            User Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The user you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push(`/${tenantSlug}/users`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const { user, permissions } = userData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/${tenantSlug}/users`)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit User' : user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditing ? 'Update user information' : 'User details and management'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && permissions?.canUpdate && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
          
          {!isEditing && (
            <button
              onClick={() => setShowPasswordReset(true)}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              <Lock className="w-4 h-4 mr-2" />
              Reset Password
            </button>
          )}
          
          {!isEditing && permissions?.canDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {user.contactNumber || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              {isEditing ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Roles and Permissions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Roles & Permissions
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned Roles
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {rolesData?.map((role) => (
                    <label key={role.id} className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {role.name}
                        {role.description && (
                          <span className="text-gray-500 dark:text-gray-400 ml-1">
                            - {role.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {user.roles.map((role) => (
                    <span
                      key={role.id}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role.name)}`}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity and Timestamps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activity Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Login
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Created
              </label>
              <p className="text-gray-900 dark:text-white">
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900 dark:text-white">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          
          <div className="space-y-3">
            {user.recentActivity && user.recentActivity.length > 0 ? (
              user.recentActivity.map((activity, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.details}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateUserMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {updateUserMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reset Password
              </h3>
              <button
                onClick={() => setShowPasswordReset(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password"
                  minLength={8}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowPasswordReset(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending || !newPassword || newPassword.length < 8}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantUserDetailPage;
