import { useState, useEffect, useCallback } from 'react';
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

  // Fetch roles for a specific tenant
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
      
      const response = await api.get(`/superadmin/roles?${params.toString()}`);
      
      if (response.data.success) {
        const rolesData = response.data.data?.roles || response.data.roles || [];
        setRoles(rolesData);
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

  // Create a new role
  const createRole = useCallback(async (roleData: CreateRoleData): Promise<Role> => {
    try {
      setError(null);
      
      const response = await api.post('/superadmin/roles', roleData);
      
      if (response.data.success) {
        const newRole = response.data.role;
        setRoles(prev => [...prev, newRole]);
        return newRole;
      } else {
        throw new Error(response.data.message || 'Failed to create role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
      throw err;
    }
  }, []);

  // Update an existing role
  const updateRole = useCallback(async (roleId: string, roleData: UpdateRoleData): Promise<Role> => {
    try {
      setError(null);
      
      const response = await api.put(`/superadmin/roles/${roleId}`, roleData);
      
      if (response.data.success) {
        const updatedRole = response.data.role;
        setRoles(prev => prev.map(role => 
          role.id === roleId ? updatedRole : role
        ));
        return updatedRole;
      } else {
        throw new Error(response.data.message || 'Failed to update role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      throw err;
    }
  }, []);

  // Delete a role
  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await api.delete(`/superadmin/roles/${roleId}`);
      
      if (response.data.success) {
        setRoles(prev => prev.filter(role => role.id !== roleId));
      } else {
        throw new Error(response.data.message || 'Failed to delete role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      throw err;
    }
  }, []);

  // Update role permissions
  const updateRolePermissions = useCallback(async (roleId: string, permissions: { moduleId: string; actions: string[] }[]): Promise<void> => {
    try {
      setError(null);
      
      const response = await api.post(`/superadmin/roles/${roleId}/permissions`, { permissions });
      
      if (response.data.success) {
        // Refresh roles to get updated permissions
        if (selectedTenant) {
          await fetchRoles(selectedTenant.id);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update role permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role permissions');
      throw err;
    }
  }, [selectedTenant, fetchRoles]);

  // Assign roles to users
  const assignRolesToUsers = useCallback(async (tenantId: string, assignments: RoleAssignment[]): Promise<void> => {
    try {
      setError(null);
      
      const response = await api.post('/superadmin/role-assignment', {
        tenantId,
        assignments
      });
      
      if (response.data.success) {
        // Refresh users to get updated role assignments
        await fetchUsers(tenantId);
      } else {
        throw new Error(response.data.message || 'Failed to assign roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign roles');
      throw err;
    }
  }, [fetchUsers]);

  // Load data for a selected tenant
  const loadTenantData = useCallback(async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    try {
      await Promise.all([
        fetchRoles(tenant.id),
        fetchUsers(tenant.id),
        fetchModules()
      ]);
    } catch (error) {
      console.error('Error loading tenant data:', error);
    }
  }, [fetchRoles, fetchUsers, fetchModules]);

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
    setError
  };
};
