import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isTemplate: boolean;
  isSystem: boolean;
  isActive: boolean;
  color?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Permission[];
  assignedUsers: User[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  moduleKey: string;
  moduleName: string;
  action: string;
  resource?: string;
  category?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface RoleFilters {
  search: string;
  status: string;
  type: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CreateRoleData {
  name: string;
  description?: string;
  isDefault: boolean;
  color?: string;
  priority: number;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isDefault?: boolean;
  color?: string;
  priority?: number;
  isActive?: boolean;
}

export interface CloneRoleData {
  name: string;
  description?: string;
  color?: string;
  priority?: number;
}

export interface RoleAssignmentData {
  userId: string;
  roleId: string;
}

export interface BulkRoleAssignmentData {
  userIds: string[];
  roleId: string;
}

export interface RolePermissionsData {
  permissions: string[];
  action: 'assign' | 'remove' | 'replace';
}

// API functions
const api = axios.create({
  baseURL: '/api',
});

const getRoles = async (tenantSlug: string, filters: RoleFilters, page: number = 1, limit: number = 10) => {
  const params = new URLSearchParams({
    tenantSlug,
    page: page.toString(),
    limit: limit.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { isActive: filters.status }),
    ...(filters.type && { type: filters.type }),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const response = await api.get(`/tenant/${tenantSlug}/roles?${params}`);
  return response.data;
};

const getRole = async (tenantSlug: string, roleId: string) => {
  const response = await api.get(`/tenant/${tenantSlug}/roles/${roleId}`);
  return response.data;
};

const createRole = async (tenantSlug: string, data: CreateRoleData) => {
  const response = await api.post(`/tenant/${tenantSlug}/roles`, data);
  return response.data;
};

const updateRole = async (tenantSlug: string, roleId: string, data: UpdateRoleData) => {
  const response = await api.put(`/tenant/${tenantSlug}/roles/${roleId}`, data);
  return response.data;
};

const deleteRole = async (tenantSlug: string, roleId: string) => {
  const response = await api.delete(`/tenant/${tenantSlug}/roles/${roleId}`);
  return response.data;
};

const cloneRole = async (tenantSlug: string, roleId: string, data: CloneRoleData) => {
  const response = await api.post(`/tenant/${tenantSlug}/roles/${roleId}/clone`, data);
  return response.data;
};

const getRolePermissions = async (tenantSlug: string, roleId: string) => {
  const response = await api.get(`/tenant/${tenantSlug}/roles/${roleId}/permissions`);
  return response.data;
};

const updateRolePermissions = async (tenantSlug: string, roleId: string, data: RolePermissionsData) => {
  const response = await api.put(`/tenant/${tenantSlug}/roles/${roleId}/permissions`, data);
  return response.data;
};

const assignRole = async (tenantSlug: string, data: RoleAssignmentData) => {
  const response = await api.post(`/tenant/${tenantSlug}/roles/assign`, data);
  return response.data;
};

// Hook
export const useTenantRoles = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RoleFilters>({
    search: '',
    status: '',
    type: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Queries
  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['tenant-roles', tenantSlug, filters, page, limit],
    queryFn: () => getRoles(tenantSlug, filters, page, limit),
    enabled: !!tenantSlug,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleData) => createRole(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleData }) =>
      updateRole(tenantSlug, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => deleteRole(tenantSlug, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const cloneRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: CloneRoleData }) =>
      cloneRole(tenantSlug, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role cloned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clone role');
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: RolePermissionsData }) =>
      updateRolePermissions(tenantSlug, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role permissions');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: (data: RoleAssignmentData) => assignRole(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign role');
    },
  });

  // Actions
  const updateFilters = useCallback((newFilters: Partial<RoleFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      type: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const setPageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // Computed values
  const roles = rolesData?.data?.roles || [];
  const pagination = rolesData?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  return {
    // Data
    roles,
    pagination,
    isLoading: isLoadingRoles,
    error: rolesError,

    // Filters and pagination
    filters,
    page,
    limit,

    // Actions
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
    refetchRoles,

    // Mutations
    createRole: createRoleMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate,
    cloneRole: cloneRoleMutation.mutate,
    updatePermissions: updatePermissionsMutation.mutate,
    assignRole: assignRoleMutation.mutate,

    // Mutation states
    isCreating: createRoleMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,
    isCloning: cloneRoleMutation.isPending,
    isUpdatingPermissions: updatePermissionsMutation.isPending,
    isAssigning: assignRoleMutation.isPending,
  };
};

// Individual role hook
export const useTenantRole = (tenantSlug: string, roleId: string) => {
  const queryClient = useQueryClient();

  const {
    data: roleData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tenant-role', tenantSlug, roleId],
    queryFn: () => getRole(tenantSlug, roleId),
    enabled: !!tenantSlug && !!roleId,
  });

  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
    error: permissionsError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['tenant-role-permissions', tenantSlug, roleId],
    queryFn: () => getRolePermissions(tenantSlug, roleId),
    enabled: !!tenantSlug && !!roleId,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: RolePermissionsData) =>
      updateRolePermissions(tenantSlug, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-role', tenantSlug, roleId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-role-permissions', tenantSlug, roleId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
      toast.success('Role permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role permissions');
    },
  });

  return {
    role: roleData?.data?.role,
    permissions: permissionsData?.data,
    isLoading,
    error,
    isLoadingPermissions,
    permissionsError,
    refetch,
    refetchPermissions,
    updatePermissions: updatePermissionsMutation.mutate,
    isUpdatingPermissions: updatePermissionsMutation.isPending,
  };
}; 