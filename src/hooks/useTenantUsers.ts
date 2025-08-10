import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

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

const deleteTenantUser = async (tenantSlug: string, userId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/tenant/${tenantSlug}/users/${userId}`);
  return response.data;
};

const toggleUserStatus = async (tenantSlug: string, userId: string, isActive: boolean): Promise<{ user: TenantUser }> => {
  const response = await api.patch(`/tenant/${tenantSlug}/users/${userId}/status`, { isActive });
  return response.data;
};

// React Query hooks
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenant-users', tenantSlug, params],
    queryFn: () => fetchTenantUsers(tenantSlug, params),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const setPage = (page: number) => {
    queryClient.setQueryData(['tenant-users', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, page }
      };
    });
  };

  const setPageSize = (limit: number) => {
    queryClient.setQueryData(['tenant-users', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, limit }
      };
    });
  };

  return {
    users: query.data?.users,
    stats: query.data?.stats,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setPage,
    setPageSize
  };
};

export const useTenantUser = (tenantSlug: string, userId: string) => {
  return useQuery({
    queryKey: ['tenant-user', tenantSlug, userId],
    queryFn: () => fetchTenantUser(tenantSlug, userId),
    enabled: !!tenantSlug && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateUser = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => createTenantUser(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantSlug] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });
};

export const useUpdateUser = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateTenantUser(tenantSlug, userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ['tenant-user', tenantSlug, userId] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });
};

export const useDeleteUser = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteTenantUser(tenantSlug, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantSlug] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });
};

export const useToggleUserStatus = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserStatus(tenantSlug, userId, isActive),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ['tenant-user', tenantSlug, userId] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  });
}; 