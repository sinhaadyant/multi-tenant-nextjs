import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { QUERY_KEYS, useQueryInvalidation } from '@/lib/queryUtils';

// Types
export interface TenantUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  contactNumber?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  rolesCount: number;
}

export interface TenantUserFilters {
  search?: string;
  status?: string;
  role?: string;
}

export interface TenantUserStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export interface TenantUserResponse {
  users: TenantUser[];
  stats: TenantUserStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  contactNumber?: string;
  roleIds?: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  contactNumber?: string;
  roleIds?: string[];
}

// API functions
const fetchTenantUsers = async (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: TenantUserFilters;
    sortBy?: string;
    sortOrder?: string;
  }
): Promise<TenantUserResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.filters?.status) searchParams.append('status', params.filters.status);
  if (params.filters?.role) searchParams.append('role', params.filters.role);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await api.get(`/tenant/${tenantSlug}/users?${searchParams.toString()}`);
  return response.data;
};

const fetchTenantUser = async (tenantSlug: string, userId: string): Promise<{ user: TenantUser }> => {
  const response = await api.get(`/tenant/${tenantSlug}/users/${userId}`);
  return response.data;
};

const createTenantUser = async (tenantSlug: string, data: CreateUserData): Promise<{ user: TenantUser }> => {
  const response = await api.post(`/tenant/${tenantSlug}/users`, data);
  return response.data;
};

const updateTenantUser = async (tenantSlug: string, userId: string, data: UpdateUserData): Promise<{ user: TenantUser }> => {
  const response = await api.put(`/tenant/${tenantSlug}/users/${userId}`, data);
  return response.data;
};

const deleteTenantUser = async (tenantSlug: string, userId: string): Promise<void> => {
  await api.delete(`/tenant/${tenantSlug}/users/${userId}`);
};

const bulkUserOperations = async (
  tenantSlug: string,
  data: { userIds: string[]; action: string; roleIds?: string[] }
): Promise<any> => {
  const response = await api.patch(`/tenant/${tenantSlug}/users`, data);
  return response.data;
};

const toggleUserStatus = async (tenantSlug: string, userId: string, isActive: boolean): Promise<any> => {
  const response = await api.patch(`/tenant/${tenantSlug}/users/${userId}`, { isActive });
  return response.data;
};

const fetchTenantRoles = async (tenantSlug: string): Promise<any> => {
  const response = await api.get(`/tenant/${tenantSlug}/roles`);
  return response.data;
};

const exportUsers = async (tenantSlug: string, filters: any): Promise<Blob> => {
  const response = await api.get(`/tenant/${tenantSlug}/users/export`, {
    params: filters,
    responseType: 'blob'
  });
  return response.data;
};

// React Query hooks
// Hook for fetching tenant users
export const useTenantUsers = (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: TenantUserFilters;
    sortBy?: string;
    sortOrder?: string;
  } = {}
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.TENANT_USERS(tenantSlug), params],
    queryFn: () => fetchTenantUsers(tenantSlug, params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single tenant user
export const useTenantUser = (tenantSlug: string, userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.TENANT_USER(tenantSlug, userId),
    queryFn: () => fetchTenantUser(tenantSlug, userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for creating a tenant user
export const useCreateTenantUser = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  const { invalidateUser } = useQueryInvalidation();

  return useMutation({
    mutationFn: (data: CreateUserData) => createTenantUser(tenantSlug, data),
    onSuccess: (data) => {
      // Invalidate user lists and stats
      invalidateUser(tenantSlug);
      
      // Optimistically update the user list
      queryClient.setQueryData(
        [...QUERY_KEYS.TENANT_USERS(tenantSlug)],
        (oldData: TenantUserResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            users: [data.user, ...oldData.users],
            stats: {
              ...oldData.stats,
              total: oldData.stats.total + 1,
              active: data.user.isActive ? oldData.stats.active + 1 : oldData.stats.active,
            },
          };
        }
      );
      
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
};

// Hook for updating a tenant user
export const useUpdateTenantUser = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  const { invalidateUser } = useQueryInvalidation();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateTenantUser(tenantSlug, userId, data),
    onSuccess: (data, variables) => {
      // Invalidate user lists and specific user
      invalidateUser(tenantSlug, variables.userId);
      
      // Optimistically update the user list
      queryClient.setQueryData(
        [...QUERY_KEYS.TENANT_USERS(tenantSlug)],
        (oldData: TenantUserResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            users: oldData.users.map(user =>
              user.id === variables.userId ? data.user : user
            ),
          };
        }
      );
      
      // Update the specific user cache
      queryClient.setQueryData(
        QUERY_KEYS.TENANT_USER(tenantSlug, variables.userId),
        { user: data.user }
      );
      
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
};

// Hook for deleting a tenant user
export const useDeleteTenantUser = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  const { invalidateUser } = useQueryInvalidation();

  return useMutation({
    mutationFn: (userId: string) => deleteTenantUser(tenantSlug, userId),
    onSuccess: (data, userId) => {
      // Invalidate user lists and stats
      invalidateUser(tenantSlug);
      
      // Optimistically update the user list
      queryClient.setQueryData(
        [...QUERY_KEYS.TENANT_USERS(tenantSlug)],
        (oldData: TenantUserResponse | undefined) => {
          if (!oldData) return oldData;
          const deletedUser = oldData.users.find(user => user.id === userId);
          return {
            ...oldData,
            users: oldData.users.filter(user => user.id !== userId),
            stats: {
              ...oldData.stats,
              total: oldData.stats.total - 1,
              active: deletedUser?.isActive ? oldData.stats.active - 1 : oldData.stats.active,
            },
          };
        }
      );
      
      // Remove the specific user cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.TENANT_USER(tenantSlug, userId),
      });
      
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
};

// Hook for bulk user operations
export const useBulkUserOperations = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  const { invalidateBulkUsers } = useQueryInvalidation();

  return useMutation({
    mutationFn: (data: { userIds: string[]; action: string; roleIds?: string[] }) =>
      bulkUserOperations(tenantSlug, data),
    onSuccess: (data, variables) => {
      // Invalidate user lists and stats
      invalidateBulkUsers(tenantSlug);
      
      toast.success(`Bulk ${variables.action} completed successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform bulk operation');
    },
  });
}; 

// Hook for toggling user status
export const useToggleUserStatus = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  const { invalidateUserStatus } = useQueryInvalidation();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserStatus(tenantSlug, userId, isActive),
    onSuccess: (data, variables) => {
      // Invalidate user lists and stats
      invalidateUserStatus(tenantSlug);
      
      // Optimistically update the user list
      queryClient.setQueryData(
        [...QUERY_KEYS.TENANT_USERS(tenantSlug)],
        (oldData: TenantUserResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            users: oldData.users.map(user =>
              user.id === variables.userId ? { ...user, isActive: variables.isActive } : user
            ),
            stats: {
              ...oldData.stats,
              active: variables.isActive ? oldData.stats.active + 1 : oldData.stats.active - 1,
            },
          };
        }
      );
      
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
};

// Hook for exporting users
export const useExportUsers = (tenantSlug: string) => {
  return useMutation({
    mutationFn: (filters: any) => exportUsers(tenantSlug, filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${tenantSlug}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Users exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export users');
    },
  });
};

// Hook for fetching tenant roles
export const useTenantRoles = (tenantSlug: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.TENANT_ROLES(tenantSlug),
    queryFn: () => fetchTenantRoles(tenantSlug),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}; 