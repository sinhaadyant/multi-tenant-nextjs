"use client";

import React from 'react';
import { useSuperadminProfile } from '@/hooks/useSuperadminProfile';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';
import ChangePasswordModal from './ChangePasswordModal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useModal } from '@/hooks/useModal';

const ProfilePage: React.FC = () => {
  const { profile, isLoading, error, refetch } = useSuperadminProfile();
  const { isOpen: isPasswordModalOpen, openModal: openPasswordModal, closeModal: closePasswordModal } = useModal();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            Failed to Load Profile
          </h2>
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={refetch}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Profile Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your account information and security settings
            </p>
          </div>
          <button
            onClick={openPasswordModal}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
          >
            Change Password
          </button>
        </div>

        {/* Profile Content */}
        <div className="grid gap-6 lg:grid-cols-1">
          <ProfileView 
            profile={profile} 
            isLoading={isLoading} 
          />
          <ProfileEdit 
            profile={profile} 
            isLoading={isLoading}
            onProfileUpdated={refetch}
          />
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={closePasswordModal}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ProfilePage; 