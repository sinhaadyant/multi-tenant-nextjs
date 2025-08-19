import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';


export interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  role?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

export interface UserFilters {
  search?: string;
  status?: string;
  tenantId?: string;
  roleId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UsersResponse {
  users: User[];
  stats: UserStats;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  tenantId: string;
  roleId?: string;
}

export interface UpdateUserData {
  name?: string;
  isActive?: boolean;
  roleId?: string;
}

// Fetch users with filters and pagination
export const useUsers = (filters: UserFilters = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/superadmin/users?${params.toString()}`);
      return response.data;
    },

    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Fetch single user details
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.get(`/superadmin/users/${id}`);
      return response.data.user;
    },
    enabled: !!id,
  });
};

// Create new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post('/superadmin/users', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('User created successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    },
  });
};

// Update user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await api.put(`/superadmin/users/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    },
  });
};

// Toggle user status
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/superadmin/users/${id}/status`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const status = variables.isActive ? 'activated' : 'suspended';
      toast.success(`User ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user status';
      toast.error(message);
    },
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/superadmin/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });
};

// Reset user password
export const useResetUserPassword = () => {
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
export const useExportUsers = () => {
  return useMutation({
    mutationFn: async (filters: UserFilters = {}) => {
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

// Fetch tenants for user creation
export const useTenants = (filters: any = {}) => {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/superadmin/tenants?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch roles for user creation (including global roles)
export const useRoles = (tenantId?: string) => {
  return useQuery({
    queryKey: ['roles', tenantId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tenantId) {
        params.append('tenantId', tenantId);
      }
      // Always include global roles
      params.append('includeGlobal', 'true');
      
      const response = await api.get(`/superadmin/roles?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 