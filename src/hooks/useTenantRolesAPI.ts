import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

// Types
export interface TenantRole {
  id: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Array<{
    id: string;
    name: string;
    description?: string;
    module: string;
    action: string;
  }>;
}

export interface TenantRoleFilters {
  status: 'all' | 'active' | 'inactive';
  type: 'all' | 'template' | 'custom';
  search: string;
}

export interface TenantRoleStats {
  total: number;
  active: number;
  inactive: number;
  templates: number;
}

export interface TenantRolePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TenantRoleResponse {
  roles: TenantRole[];
  pagination: TenantRolePagination;
  stats: TenantRoleStats;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface ToggleRoleStatusData {
  roleId: string;
  isActive: boolean;
}

// API functions
const fetchTenantRoles = async (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: TenantRoleFilters;
  }
): Promise<TenantRoleResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  
  if (params.filters) {
    if (params.filters.status !== 'all') searchParams.append('status', params.filters.status);
    if (params.filters.type !== 'all') searchParams.append('type', params.filters.type);
  }

  const response = await api.get(`/api/tenant/${tenantSlug}/roles?${searchParams.toString()}`);
  return response.data;
};

const createTenantRole = async (tenantSlug: string, data: CreateRoleData): Promise<{ role: TenantRole }> => {
  const response = await api.post(`/api/tenant/${tenantSlug}/roles`, data);
  return response.data;
};

const updateTenantRole = async (tenantSlug: string, roleId: string, data: UpdateRoleData): Promise<{ role: TenantRole }> => {
  const response = await api.put(`/api/tenant/${tenantSlug}/roles/${roleId}`, data);
  return response.data;
};

const deleteTenantRole = async (tenantSlug: string, roleId: string): Promise<void> => {
  await api.delete(`/api/tenant/${tenantSlug}/roles/${roleId}`);
};

const toggleTenantRoleStatus = async (tenantSlug: string, data: ToggleRoleStatusData): Promise<{ role: TenantRole }> => {
  const response = await api.patch(`/api/tenant/${tenantSlug}/roles/${data.roleId}/status`, {
    isActive: data.isActive
  });
  return response.data;
};

const fetchTenantRole = async (tenantSlug: string, roleId: string): Promise<{ role: TenantRole }> => {
  const response = await api.get(`/api/tenant/${tenantSlug}/roles/${roleId}`);
  return response.data;
};

const fetchTenantPermissions = async (tenantSlug: string): Promise<{
  modules: Array<{
    name: string;
    description?: string;
    permissions: Array<{
      id: string;
      name: string;
      description?: string;
      module: string;
      submodule?: string;
      action: string;
    }>;
  }>;
  totalPermissions: number;
  totalModules: number;
}> => {
  const response = await api.get(`/api/tenant/${tenantSlug}/permissions`);
  return response.data;
};

// React Query hooks
export const useTenantRoles = (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: TenantRoleFilters;
  }
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenant-roles', tenantSlug, params],
    queryFn: () => fetchTenantRoles(tenantSlug, params),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const setPage = (page: number) => {
    queryClient.setQueryData(['tenant-roles', tenantSlug, params], (old: any) => {
      if (old) {
        return {
          ...old,
          pagination: {
            ...old.pagination,
            page
          }
        };
      }
      return old;
    });
  };

  const setPageSize = (limit: number) => {
    queryClient.setQueryData(['tenant-roles', tenantSlug, params], (old: any) => {
      if (old) {
        return {
          ...old,
          pagination: {
            ...old.pagination,
            limit
          }
        };
      }
      return old;
    });
  };

  return {
    roles: query.data?.roles,
    stats: query.data?.stats,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setPage,
    setPageSize
  };
};

export const useTenantRole = (tenantSlug: string, roleId: string) => {
  return useQuery({
    queryKey: ['tenant-role', tenantSlug, roleId],
    queryFn: () => fetchTenantRole(tenantSlug, roleId),
    enabled: !!tenantSlug && !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTenantPermissions = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['tenant-permissions', tenantSlug],
    queryFn: () => fetchTenantPermissions(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateRole = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleData) => createTenantRole(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating role:', error);
      toast.error(error.response?.data?.message || 'Failed to create role');
    }
  });
};

export const useUpdateRole = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleData }) =>
      updateTenantRole(tenantSlug, roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ['tenant-role', tenantSlug, roleId] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  });
};

export const useDeleteRole = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteTenantRole(tenantSlug, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting role:', error);
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  });
};

export const useToggleRoleStatus = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ToggleRoleStatusData) => toggleTenantRoleStatus(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role status updated successfully');
    },
    onError: (error: any) => {
      console.error('Error toggling role status:', error);
      toast.error(error.response?.data?.message || 'Failed to update role status');
    }
  });
}; 