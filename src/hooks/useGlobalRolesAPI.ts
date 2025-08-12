import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// Types
export interface GlobalRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  scope: 'GLOBAL';
  createdAt: string;
  updatedAt: string;
  tenantCount: number;
  permissionCount: number;
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

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  userCount: number;
}

export interface RoleUsage {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userCount: number;
  hasOverrides: boolean;
  overrides: PermissionOverride[];
}

export interface PermissionOverride {
  permissionId: string;
  permissionName: string;
  isGranted: boolean;
}

export interface CreateGlobalRoleData {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateGlobalRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface GlobalRoleFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  sortBy?: 'name' | 'createdAt' | 'tenantCount' | 'permissionCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Main hook for global roles management
export const useGlobalRolesAPI = () => {
  const [roles, setRoles] = useState<GlobalRole[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch global roles
  const fetchGlobalRoles = useCallback(async (filters: GlobalRoleFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('scope', 'GLOBAL');
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
        throw new Error(response.data.message || 'Failed to fetch global roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch global roles');
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

  // Fetch tenants
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
        const tenantsData = response.data.data || response.data;
        setTenants(tenantsData);
        return tenantsData;
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

  // Create global role
  const createGlobalRole = useCallback(async (roleData: CreateGlobalRoleData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/superadmin/roles', {
        ...roleData,
        scope: 'GLOBAL'
      });
      
      if (response.data.success) {
        const newRole = response.data.data?.role || response.data.role;
        setRoles(prev => [newRole, ...prev]);
        return newRole;
      } else {
        throw new Error(response.data.message || 'Failed to create global role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create global role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update global role
  const updateGlobalRole = useCallback(async (roleId: string, roleData: UpdateGlobalRoleData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/superadmin/roles/${roleId}`, roleData);
      
      if (response.data.success) {
        const updatedRole = response.data.data?.role || response.data.role;
        setRoles(prev => prev.map(role => role.id === roleId ? updatedRole : role));
        return updatedRole;
      } else {
        throw new Error(response.data.message || 'Failed to update global role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update global role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete global role
  const deleteGlobalRole = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/superadmin/roles/${roleId}`);
      
      if (response.data.success) {
        setRoles(prev => prev.filter(role => role.id !== roleId));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete global role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete global role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update role permissions
  const updateRolePermissions = useCallback(async (roleId: string, permissions: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/superadmin/roles/${roleId}/permissions`, {
        permissions
      });
      
      if (response.data.success) {
        const updatedRole = response.data.data?.role || response.data.role;
        setRoles(prev => prev.map(role => role.id === roleId ? updatedRole : role));
        return updatedRole;
      } else {
        throw new Error(response.data.message || 'Failed to update role permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role permissions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get role usage across tenants
  const getRoleUsage = useCallback(async (roleId: string): Promise<RoleUsage[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/superadmin/roles/${roleId}/usage`);
      
      if (response.data.success) {
        return response.data.data?.usage || response.data.usage || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch role usage');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch role usage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get tenant-specific role overrides
  const getTenantRoleOverrides = useCallback(async (roleId: string, tenantId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/superadmin/roles/${roleId}/tenants/${tenantId}/overrides`);
      
      if (response.data.success) {
        return response.data.data?.overrides || response.data.overrides || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch role overrides');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch role overrides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update tenant-specific role overrides
  const updateTenantRoleOverrides = useCallback(async (roleId: string, tenantId: string, overrides: PermissionOverride[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/superadmin/roles/${roleId}/tenants/${tenantId}/overrides`, {
        overrides
      });
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update role overrides');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role overrides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    roles,
    modules,
    tenants,
    loading,
    error,
    fetchGlobalRoles,
    fetchModules,
    fetchTenants,
    createGlobalRole,
    updateGlobalRole,
    deleteGlobalRole,
    updateRolePermissions,
    getRoleUsage,
    getTenantRoleOverrides,
    updateTenantRoleOverrides,
    setError
  };
};
