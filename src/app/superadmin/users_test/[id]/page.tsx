"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Globe, 
  MapPin, 
  Settings,
  Activity,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Key,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useSuperadminUser, 
  useToggleSuperadminUserStatus, 
  useDeleteSuperadminUser,
  useResetSuperadminUserPassword,
  SuperadminUser
} from '@/hooks/useSuperadminUsers';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { useToast } from '@/hooks/useToast';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const userId = params.id as string;

  // Debug logging for params
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 User Detail Page Params:', {
      params,
      userId,
      userIdType: typeof userId,
      userIdLength: userId?.length
    });
  }

  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  // API hooks
  const { data: userData, isLoading: userLoading, error: userError } = useSuperadminUser(userId);
  const toggleStatusMutation = useToggleSuperadminUserStatus();
  const deleteMutation = useDeleteSuperadminUser();
  const resetPasswordMutation = useResetSuperadminUserPassword();

  const user = userData?.data?.user;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 User Detail Page Debug:', {
      userId,
      userData,
      user,
      userLoading,
      userError
    });
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const handleEditUser = () => {
    router.push(`/superadmin/users/${userId}/edit`);
  };

  const handleDeleteUser = () => {
    if (user) {
      confirm({
        title: 'Delete User',
        message: `Are you sure you want to delete "${user.name}"? This action cannot be undone and will permanently remove the user and all associated data.`,
        confirmText: 'Delete User',
        variant: 'danger',
        onConfirm: () => deleteMutation.mutate(userId),
      });
    }
  };

  const handleToggleStatus = () => {
    if (user) {
      const action = user.isActive ? 'suspend' : 'activate';
      confirm({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} "${user.name}"? ${user.isActive ? 'They will not be able to access the system until reactivated.' : 'They will regain access to the system.'}`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        variant: user.isActive ? 'warning' : 'success',
        onConfirm: () => toggleStatusMutation.mutate({
          id: userId,
          isActive: !user.isActive
        }),
      });
    }
  };

  const handleResetPassword = () => {
    if (user) {
      confirm({
        title: 'Reset Password',
        message: `Are you sure you want to reset password for "${user.name}"? They will receive an email with a new temporary password.`,
        confirmText: 'Reset Password',
        variant: 'warning',
        onConfirm: () => resetPasswordMutation.mutate(userId),
      });
    }
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-48"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (userError) {
    console.error('❌ User Detail Page Error:', userError);
  }

  if (userError || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading user
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {userError?.message || 'An error occurred while loading the user data.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              User Details & Management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(user.isActive)}
          <button
            onClick={handleEditUser}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Edit className="w-4 h-4 mr-2 inline" />
            Edit
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              user.isActive
                ? 'text-yellow-700 bg-yellow-100 border border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-800'
                : 'text-green-700 bg-green-100 border border-green-300 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 dark:hover:bg-green-800'
            }`}
          >
            {user.isActive ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={handleResetPassword}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 dark:hover:bg-blue-800"
          >
            <Key className="w-4 h-4 mr-2 inline" />
            Reset Password
          </button>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700 dark:hover:bg-red-800"
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.id.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tenant</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.tenant?.name || 'No Tenant'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {format(new Date(user.createdAt), 'PPP')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{user.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                      <dd className="text-sm text-gray-900 dark:text-white font-mono">{user.id}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                      <dd>{getStatusBadge(user.isActive)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tenant</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {user.tenant?.name || 'No Tenant Assigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {user.role?.name || 'No Role Assigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {user.lastLogin 
                          ? format(new Date(user.lastLogin), 'PPP p')
                          : 'Never'
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(user.createdAt), 'PPP')}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Activity</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recent activity for this user
                  </p>
                </div>
              </div>

              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Activity logs will be implemented here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 