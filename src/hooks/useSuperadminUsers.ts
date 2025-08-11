import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface SuperadminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  role?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface SuperadminUserStats {
  total: number;
  active: number;
  inactive: number;
}

export interface SuperadminUserFilters {
  search?: string;
  status?: string;
  tenantId?: string;
  roleId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateSuperadminUserData {
  name: string;
  email: string;
  password: string;
  tenantId?: string;
  roleId?: string;
}

export interface UpdateSuperadminUserData {
  name?: string;
  email?: string;
  tenantId?: string;
  roleId?: string;
  isActive?: boolean;
}

// Fetch all users with filters
export const useSuperadminUsers = (filters: SuperadminUserFilters = {}) => {
  return useQuery({
    queryKey: ['superadmin-users', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching superadmin users with params:', params.toString());
        }
        const response = await api.get(`/superadmin/users?${params.toString()}`);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Superadmin users response:', response.data);
        }
        return response.data;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching superadmin users:', error);
          console.error('❌ Error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Fetch single user details
export const useSuperadminUser = (id: string) => {
  return useQuery({
    queryKey: ['superadmin-user', id],
    queryFn: async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching superadmin user details for ID:', id);
        }
        const response = await api.get(`/superadmin/users/${id}`);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Superadmin user details response:', response.data);
        }
        return response.data;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching superadmin user details:', error);
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Create new user
export const useCreateSuperadminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSuperadminUserData) => {
      const response = await api.post('/superadmin/users', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('User created successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    },
  });
};

// Update user
export const useUpdateSuperadminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSuperadminUserData }) => {
      const response = await api.put(`/superadmin/users/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-user', variables.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    },
  });
};

// Toggle user status
export const useToggleSuperadminUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/superadmin/users/${id}/status`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const status = variables.isActive ? 'activated' : 'suspended';
      toast.success(`User ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-user', variables.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user status';
      toast.error(message);
    },
  });
};

// Delete user
export const useDeleteSuperadminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/superadmin/users/${id}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('User deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });
};

// Reset user password
export const useResetSuperadminUserPassword = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/superadmin/users/${id}/reset-password`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Password reset successfully!');
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    },
  });
};

// Export users data
export const useExportSuperadminUsers = () => {
  return useMutation({
    mutationFn: async (filters: SuperadminUserFilters = {}) => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/superadmin/users/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export completed successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export data';
      toast.error(message);
    },
  });
}; 