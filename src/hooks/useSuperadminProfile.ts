import { useState, useEffect } from 'react';

export interface SuperadminProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileUpdateData {
  name?: string;
  phone?: string;
  avatar?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export const useSuperadminProfile = () => {
  const [profile, setProfile] = useState<SuperadminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/superadmin/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      setProfile({
        ...data.profile,
        role: 'Superadmin', // Always set role as Superadmin
        phone: data.profile.phone || '',
        avatar: data.profile.avatar || '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updateData: ProfileUpdateData): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/superadmin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfile(prev => prev ? {
        ...prev,
        ...data.profile,
        phone: data.profile.phone || prev.phone,
        avatar: data.profile.avatar || prev.avatar,
      } : null);

      return { success: true, message: data.message || 'Profile updated successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      return { success: false, message: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async (passwordData: PasswordChangeData): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/superadmin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return { success: true, message: data.message || 'Password changed successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      return { success: false, message: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<{ success: boolean; message: string; avatarUrl?: string }> => {
    setIsUpdating(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/superadmin/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload avatar');
      }

      // Update profile with new avatar URL
      setProfile(prev => prev ? {
        ...prev,
        avatar: data.avatarUrl,
      } : null);

      return { 
        success: true, 
        message: data.message || 'Avatar uploaded successfully',
        avatarUrl: data.avatarUrl 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      return { success: false, message: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    isUpdating,
    refetch: fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
}; 