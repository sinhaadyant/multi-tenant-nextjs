import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: RolePermission[];
}

export interface RolePermission {
  id: string;
  moduleKey: string;
  moduleName: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  color?: string;
  permissions: RolePermission[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  permissions?: RolePermission[];
}

export interface RolesResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export interface Module {
  moduleKey: string;
  moduleName: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roles?: Role[];
}

// Validation schemas
export const validateCreateRole = (data: CreateRoleData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Role name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Role name must be at least 2 characters long');
  } else if (data.name.trim().length > 50) {
    errors.push('Role name must be less than 50 characters');
  }

  if (data.description && data.description.length > 200) {
    errors.push('Description must be less than 200 characters');
  }

  if (!data.color || !/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('Valid color is required');
  }

  if (!data.permissions || data.permissions.length === 0) {
    errors.push('At least one permission is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateRole = (data: UpdateRoleData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Role name is required');
    } else if (data.name.trim().length < 2) {
      errors.push('Role name must be at least 2 characters long');
    } else if (data.name.trim().length > 50) {
      errors.push('Role name must be less than 50 characters');
    }
  }

  if (data.description && data.description.length > 200) {
    errors.push('Description must be less than 200 characters');
  }

  if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('Valid color is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Main hook
export const useTenantRolesAPI = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const queryClient = useQueryClient();

  // Fetch roles with pagination and filters
  const useRoles = (page: number = 1, limit: number = 10, search?: string, status?: string) => {
    return useQuery({
      queryKey: ['tenant-roles', tenantSlug, page, limit, search, status],
      queryFn: async (): Promise<RolesResponse> => {
        const response = await api.get(`/tenant/${tenantSlug}/roles`, {
          params: {
            page,
            limit,
            search: search || undefined,
            status: status !== 'all' ? status : undefined
          }
        });
        return response.data.data;
      },
      enabled: !!tenantSlug,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Fetch all roles for dropdowns
  const useAllRoles = () => {
    return useQuery({
      queryKey: ['tenant-all-roles', tenantSlug],
      queryFn: async (): Promise<Role[]> => {
        const response = await api.get(`/tenant/${tenantSlug}/roles`, {
          params: { page: 1, limit: 1000 }
        });
        return response.data.data.roles;
      },
      enabled: !!tenantSlug,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Fetch modules for permissions
  const useModules = () => {
    return useQuery({
      queryKey: ['tenant-modules', tenantSlug],
      queryFn: async (): Promise<Module[]> => {
        const response = await api.get(`/tenant/${tenantSlug}/modules`);
        return response.data.data.modules || [];
      },
      enabled: !!tenantSlug,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Fetch users for role assignment
  const useUsers = () => {
    return useQuery({
      queryKey: ['tenant-users-for-assignment', tenantSlug],
      queryFn: async (): Promise<User[]> => {
        const response = await api.get(`/tenant/${tenantSlug}/users`, {
          params: { page: 1, limit: 1000 }
        });
        return response.data.data.users || [];
      },
      enabled: !!tenantSlug,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create role mutation
  const useCreateRole = () => {
    return useMutation({
      mutationFn: async (roleData: CreateRoleData): Promise<Role> => {
        // Validate data
        const validation = validateCreateRole(roleData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await api.post(`/tenant/${tenantSlug}/roles`, roleData);
        return response.data.data;
      },
      onSuccess: (newRole) => {
        // Invalidate and refetch roles
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        
        // Add to cache optimistically
        queryClient.setQueryData(['tenant-roles', tenantSlug], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              roles: [newRole, ...oldData.roles],
              stats: {
                ...oldData.stats,
                total: oldData.stats.total + 1,
                active: newRole.isActive ? oldData.stats.active + 1 : oldData.stats.active
              }
            };
          }
          return oldData;
        });

        toast.success('Role created successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create role');
      }
    });
  };

  // Update role mutation
  const useUpdateRole = () => {
    return useMutation({
      mutationFn: async ({ roleId, roleData }: { roleId: string; roleData: UpdateRoleData }): Promise<Role> => {
        // Validate data
        const validation = validateUpdateRole(roleData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await api.put(`/tenant/${tenantSlug}/roles/${roleId}`, roleData);
        return response.data.data;
      },
      onSuccess: (updatedRole) => {
        // Invalidate and refetch roles
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        
        // Update cache optimistically
        queryClient.setQueryData(['tenant-roles', tenantSlug], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              roles: oldData.roles.map((role: Role) => 
                role.id === updatedRole.id ? updatedRole : role
              )
            };
          }
          return oldData;
        });

        toast.success('Role updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update role');
      }
    });
  };

  // Delete role mutation
  const useDeleteRole = () => {
    return useMutation({
      mutationFn: async (roleId: string): Promise<void> => {
        const response = await api.delete(`/tenant/${tenantSlug}/roles/${roleId}`);
        return response.data;
      },
      onSuccess: (_, roleId) => {
        // Invalidate and refetch roles
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        
        // Remove from cache optimistically
        queryClient.setQueryData(['tenant-roles', tenantSlug], (oldData: any) => {
          if (oldData) {
            const deletedRole = oldData.roles.find((role: Role) => role.id === roleId);
            return {
              ...oldData,
              roles: oldData.roles.filter((role: Role) => role.id !== roleId),
              stats: {
                ...oldData.stats,
                total: oldData.stats.total - 1,
                active: deletedRole?.isActive ? oldData.stats.active - 1 : oldData.stats.active
              }
            };
          }
          return oldData;
        });

        toast.success('Role deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete role');
      }
    });
  };

  // Bulk delete roles mutation
  const useBulkDeleteRoles = () => {
    return useMutation({
      mutationFn: async (roleIds: string[]): Promise<void> => {
        const response = await api.post(`/tenant/${tenantSlug}/roles/bulk-delete`, {
          roleIds
        });
        return response.data;
      },
      onSuccess: (_, roleIds) => {
        // Invalidate and refetch roles
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        
        toast.success(`${roleIds.length} roles deleted successfully`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete roles');
      }
    });
  };

  // Toggle role status mutation
  const useToggleRoleStatus = () => {
    return useMutation({
      mutationFn: async ({ roleId, isActive }: { roleId: string; isActive: boolean }): Promise<Role> => {
        const response = await api.patch(`/tenant/${tenantSlug}/roles/${roleId}/status`, {
          isActive
        });
        return response.data.data;
      },
      onSuccess: (updatedRole) => {
        // Invalidate and refetch roles
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        
        toast.success(`Role ${updatedRole.isActive ? 'activated' : 'deactivated'} successfully`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update role status');
      }
    });
  };

  // Assign role to user mutation
  const useAssignRole = () => {
    return useMutation({
      mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }): Promise<void> => {
        const response = await api.post(`/tenant/${tenantSlug}/roles/${roleId}/assign`, {
          userId
        });
        return response.data;
      },
      onSuccess: () => {
        // Invalidate and refetch roles and users
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-users-for-assignment', tenantSlug] });
        
        toast.success('Role assigned successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to assign role');
      }
    });
  };

  // Remove role from user mutation
  const useRemoveRole = () => {
    return useMutation({
      mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }): Promise<void> => {
        const response = await api.delete(`/tenant/${tenantSlug}/roles/${roleId}/assign/${userId}`);
        return response.data;
      },
      onSuccess: () => {
        // Invalidate and refetch roles and users
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-all-roles', tenantSlug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-users-for-assignment', tenantSlug] });
        
        toast.success('Role removed successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to remove role');
      }
    });
  };

  return {
    // Queries
    useRoles,
    useAllRoles,
    useModules,
    useUsers,
    
    // Mutations
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useBulkDeleteRoles,
    useToggleRoleStatus,
    useAssignRole,
    useRemoveRole,
    
    // Validation
    validateCreateRole,
    validateUpdateRole
  };
}; 