"use client";

import React from 'react';
import { SuperadminProfile } from '@/hooks/useSuperadminProfile';
import { User, Mail, Phone, Shield, Calendar, Clock } from '@/icons';

interface ProfileViewProps {
  profile: SuperadminProfile | null;
  isLoading: boolean;
}

const ProfileViewSkeleton: React.FC = () => (
  <div className="p-6 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700 w-3/4"></div>
      </div>
    </div>
    
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ profile, isLoading }) => {
  if (isLoading) {
    return <ProfileViewSkeleton />;
  }

  if (!profile) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          No profile data available
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
      <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
        Profile Information
      </h2>

      {/* Avatar and Basic Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-semibold text-white bg-brand-500 rounded-full">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
            profile.isActive ? 'bg-success-500' : 'bg-gray-400'
          }`}></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {profile.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile.isActive ? 'Active' : 'Inactive'} Account
          </p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{profile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{profile.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400">
            <Phone className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.phone || 'Not provided'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{profile.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Created</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDateTime(profile.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView; 