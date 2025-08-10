import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    description?: string;
    isActive: boolean;
    plan?: string;
    region?: string;
    features?: any;
  };
  roles: Array<{
    id: string;
    name: string;
    description?: string;
    permissions: Array<{
      id: string;
      name: string;
      module: string;
      action: string;
      submodule?: string;
    }>;
  }>;
}

export interface UpdateProfileData {
  name: string;
  contactNumber?: string;
  currentPassword?: string;
  newPassword?: string;
}

// API functions
const fetchUserProfile = async (tenantSlug: string): Promise<{ user: UserProfile }> => {
  const response = await api.get(`/tenant/${tenantSlug}/profile`);
  return response.data;
};

const updateUserProfile = async (tenantSlug: string, data: UpdateProfileData): Promise<{ user: Partial<UserProfile> }> => {
  const response = await api.put(`/tenant/${tenantSlug}/profile`, data);
  return response.data;
};

// React Query hooks
export const useUserProfile = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['user-profile', tenantSlug],
    queryFn: () => fetchUserProfile(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes (longer for profile data)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useUpdateProfile = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateUserProfile(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', tenantSlug] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });
}; 