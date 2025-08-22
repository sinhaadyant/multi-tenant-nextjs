import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  userCount: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isGlobal: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Permission[];
}

export interface Module {
  id: string;
  moduleKey: string;
  moduleName: string;
  description?: string;
  icon?: string;
  path?: string;
  isActive: boolean;
  isVisible: boolean;
  orderIndex: number;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  action: string;
  moduleKey: string;
  resource?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleId?: string;
  roleName?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  tenantId?: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
}

export interface RoleFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  tenantId?: string;
  sortBy?: 'name' | 'createdAt' | 'userCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  tenantId?: string;
  roleId?: string;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Main hook for roles and permissions management
export const useRolesPermissionsAPI = () => {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch tenants with pagination and search
  const fetchTenants = useCallback(async (filters: { search?: string; page?: number; limit?: number } = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/superadmin/tenants?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch tenants');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tenants');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch roles for a specific tenant (tenant-specific only)
  const fetchRoles = useCallback(async (tenantId: string, filters: RoleFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 fetchRoles API call:', {
          url: `/superadmin/roles?${params.toString()}`,
          tenantId,
          filters
        });
      }
      
      const response = await api.get(`/superadmin/roles?${params.toString()}`);
      
      if (response.data.success) {
        const rolesData = response.data.data?.roles || response.data.roles || [];
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 fetchRoles Debug:', {
            rolesCount: rolesData.length,
            roles: rolesData.map((r: any) => ({ 
              id: r.id, 
              name: r.name, 
              isGlobal: r.isGlobal, 
              tenantId: r.tenantId,
              tenantName: r.tenantName 
            }))
          });
        }
        
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch global roles
  const fetchGlobalRoles = useCallback(async (filters: RoleFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('isGlobal', 'true');
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/superadmin/roles?${params.toString()}`);
      
      if (response.data.success) {
        const globalRolesData = response.data.data?.roles || response.data.roles || [];
        return globalRolesData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch global roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch global roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tenant-specific roles only (no global roles)
  const fetchAllRolesForTenant = useCallback(async (tenantId: string, filters: RoleFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 fetchAllRolesForTenant called with:', { tenantId, filters });
      }
      
      // Fetch only tenant-specific roles
      const tenantRolesResponse = await fetchRoles(tenantId, filters);
      
      // Extract roles array from tenant roles response
      const tenantRoles = tenantRolesResponse?.data?.roles || tenantRolesResponse?.roles || [];
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 fetchAllRolesForTenant result:', {
          tenantRolesCount: tenantRoles.length,
          tenantRoles: tenantRoles.map((r: any) => ({ 
            id: r.id, 
            name: r.name, 
            isGlobal: r.isGlobal, 
            tenantId: r.tenantId 
          }))
        });
      }
      
      // Set only tenant-specific roles
      setRoles(Array.isArray(tenantRoles) ? tenantRoles : []);
      return tenantRoles;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tenant roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  // Fetch modules
  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/superadmin/modules');
      
      if (response.data.success) {
        const modulesData = response.data.data?.modules || response.data.modules || [];
        setModules(modulesData);
        return modulesData;
      } else {
        throw new Error(response.data.message || 'Failed to fetch modules');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch modules');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users for a specific tenant
  const fetchUsers = useCallback(async (tenantId: string, filters: UserFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.roleId) params.append('roleId', filters.roleId);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/superadmin/users?${params.toString()}`);
      
      if (response.data.success) {
        const usersData = response.data.data?.users || response.data.users || [];
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 fetchUsers Debug:', {
            usersCount: usersData.length,
            usersWithRoles: usersData.filter((u: any) => u.roleId).length,
            sampleUser: usersData[0] || null
          });
        }
        
        setUsers(usersData);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new role with React Query mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: CreateRoleData): Promise<Role> => {
      const response = await api.post('/superadmin/roles', roleData);
      
      if (response.data.success) {
        return response.data.role;
      } else {
        throw new Error(response.data.message || 'Failed to create role');
      }
    },
    onSuccess: (newRole) => {
      // Update local state
      setRoles(prev => Array.isArray(prev) ? [...prev, newRole] : [newRole]);
      
      // Invalidate React Query cache for roles
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-roles'] });
      
      // If we have a selected tenant, also invalidate tenant-specific queries
      if (selectedTenant) {
        queryClient.invalidateQueries({ queryKey: ['roles', selectedTenant.id] });
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedTenant.slug] });
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create role');
    }
  });

  // Update an existing role with React Query mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, roleData }: { roleId: string; roleData: UpdateRoleData }): Promise<Role> => {
      const response = await api.put(`/superadmin/roles/${roleId}`, roleData);
      
      if (response.data.success) {
        return response.data.role;
      } else {
        throw new Error(response.data.message || 'Failed to update role');
      }
    },
    onSuccess: (updatedRole) => {
      // Update local state
      setRoles(prev => Array.isArray(prev) ? prev.map(role =>
        role.id === updatedRole.id ? updatedRole : role
      ) : [updatedRole]);
      
      // Invalidate React Query cache for roles
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-roles'] });
      
      // If we have a selected tenant, also invalidate tenant-specific queries
      if (selectedTenant) {
        queryClient.invalidateQueries({ queryKey: ['roles', selectedTenant.id] });
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedTenant.slug] });
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update role');
    }
  });

  // Delete a role with React Query mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string): Promise<void> => {
      const response = await api.delete(`/superadmin/roles/${roleId}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete role');
      }
    },
    onSuccess: (_, roleId) => {
      // Update local state
      setRoles(prev => Array.isArray(prev) ? prev.filter(role => role.id !== roleId) : []);
      
      // Invalidate React Query cache for roles
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-roles'] });
      
      // If we have a selected tenant, also invalidate tenant-specific queries
      if (selectedTenant) {
        queryClient.invalidateQueries({ queryKey: ['roles', selectedTenant.id] });
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedTenant.slug] });
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete role');
    }
  });

  // Legacy functions for backward compatibility
  const createRole = useCallback(async (roleData: CreateRoleData): Promise<Role> => {
    return createRoleMutation.mutateAsync(roleData);
  }, [createRoleMutation]);

  const updateRole = useCallback(async (roleId: string, roleData: UpdateRoleData): Promise<Role> => {
    return updateRoleMutation.mutateAsync({ roleId, roleData });
  }, [updateRoleMutation]);

  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    return deleteRoleMutation.mutateAsync(roleId);
  }, [deleteRoleMutation]);

  // Update role permissions with React Query mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: { moduleId: string; actions: string[] }[] }): Promise<any> => {
      const response = await api.post(`/superadmin/roles/${roleId}/permissions`, { permissions });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update role permissions');
      }
    },
    onSuccess: (data, { roleId }) => {
      // Update the specific role with new permissions in the local state
      const updatedRole = data.role;
      if (updatedRole) {
        setRoles(prev => Array.isArray(prev) ? prev.map(role =>
          role.id === roleId ? updatedRole : role
        ) : [updatedRole]);
      } else {
        // Fallback: refresh all roles to get updated permissions
        if (selectedTenant) {
          fetchAllRolesForTenant(selectedTenant.id);
        }
      }
      
      // Invalidate React Query cache for roles
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-roles'] });
      
      // If we have a selected tenant, also invalidate tenant-specific queries
      if (selectedTenant) {
        queryClient.invalidateQueries({ queryKey: ['roles', selectedTenant.id] });
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedTenant.slug] });
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update role permissions');
    }
  });

  // Legacy function for backward compatibility
  const updateRolePermissions = useCallback(async (roleId: string, permissions: { moduleId: string; actions: string[] }[]): Promise<void> => {
    return updateRolePermissionsMutation.mutateAsync({ roleId, permissions });
  }, [updateRolePermissionsMutation]);

  // Assign roles to users with React Query mutation
  const assignRolesToUsersMutation = useMutation({
    mutationFn: async ({ tenantId, assignments }: { tenantId: string; assignments: RoleAssignment[] }): Promise<any> => {
      const response = await api.post('/superadmin/role-assignment', {
        tenantId,
        assignments
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to assign roles');
      }
    },
    onSuccess: (data, { tenantId }) => {
      // Refresh users to get updated role assignments
      fetchUsers(tenantId);
      
      // Invalidate React Query cache for users and roles
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-roles'] });
      
      // If we have a selected tenant, also invalidate tenant-specific queries
      if (selectedTenant) {
        queryClient.invalidateQueries({ queryKey: ['users', selectedTenant.id] });
        queryClient.invalidateQueries({ queryKey: ['roles', selectedTenant.id] });
        queryClient.invalidateQueries({ queryKey: ['tenant-users', selectedTenant.slug] });
        queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedTenant.slug] });
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to assign roles');
    }
  });

  // Legacy function for backward compatibility
  const assignRolesToUsers = useCallback(async (tenantId: string, assignments: RoleAssignment[]): Promise<void> => {
    return assignRolesToUsersMutation.mutateAsync({ tenantId, assignments });
  }, [assignRolesToUsersMutation]);

  // Load all data for a specific tenant
  const loadTenantData = useCallback(async (tenant: Tenant) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedTenant(tenant);
      
      // Fetch all data in parallel
      await Promise.all([
        fetchAllRolesForTenant(tenant.id),
        fetchModules(),
        fetchUsers(tenant.id)
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllRolesForTenant, fetchModules, fetchUsers]);

  // Clear all data
  const clearData = useCallback(() => {
    setSelectedTenant(null);
    setRoles([]);
    setUsers([]);
    setModules([]);
    setError(null);
  }, []);

  return {
    // State
    selectedTenant,
    roles,
    modules,
    users,
    loading,
    error,
    
    // Actions
    fetchTenants,
    fetchRoles,
    fetchGlobalRoles,
    fetchAllRolesForTenant,
    fetchModules,
    fetchUsers,
    createRole,
    updateRole,
    deleteRole,
    updateRolePermissions,
    assignRolesToUsers,
    loadTenantData,
    clearData,
    setSelectedTenant,
    setError,
    
    // Mutations for direct access
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,
    updateRolePermissionsMutation,
    assignRolesToUsersMutation
  };
};
