import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// Types
export interface TenantRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  scope: 'TENANT';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissionCount: number;
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
  isAssigned?: boolean;
  hasOverrides?: boolean;
}

export interface CreateTenantRoleData {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateTenantRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface PermissionOverride {
  permissionId: string;
  permissionName: string;
  isGranted: boolean;
}

// Main hook for tenant roles management
export const useTenantRolesAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch global roles available to tenant
  const fetchGlobalRoles = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/tenant/${tenantId}/global-roles`);
      
      if (response.data.success) {
        return response.data.data?.roles || response.data.roles || [];
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

  // Fetch tenant-specific roles
  const fetchTenantRoles = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/tenant/${tenantId}/roles`);
      
      if (response.data.success) {
        return response.data.data?.roles || response.data.roles || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch tenant roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tenant roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign global role to tenant
  const assignGlobalRole = useCallback(async (tenantId: string, roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/tenant/${tenantId}/global-roles/${roleId}/assign`);
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to assign global role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign global role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unassign global role from tenant
  const unassignGlobalRole = useCallback(async (tenantId: string, roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/tenant/${tenantId}/global-roles/${roleId}/assign`);
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to unassign global role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unassign global role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create tenant-specific role
  const createTenantRole = useCallback(async (tenantId: string, roleData: CreateTenantRoleData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/tenant/${tenantId}/roles`, roleData);
      
      if (response.data.success) {
        return response.data.data?.role || response.data.role;
      } else {
        throw new Error(response.data.message || 'Failed to create tenant role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create tenant role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update tenant-specific role
  const updateTenantRole = useCallback(async (tenantId: string, roleId: string, roleData: UpdateTenantRoleData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/tenant/${tenantId}/roles/${roleId}`, roleData);
      
      if (response.data.success) {
        return response.data.data?.role || response.data.role;
      } else {
        throw new Error(response.data.message || 'Failed to update tenant role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete tenant-specific role
  const deleteTenantRole = useCallback(async (tenantId: string, roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/tenant/${tenantId}/roles/${roleId}`);
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete tenant role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete tenant role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get permission overrides for a global role in tenant
  const getPermissionOverrides = useCallback(async (tenantId: string, roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/tenant/${tenantId}/global-roles/${roleId}/overrides`);
      
      if (response.data.success) {
        return response.data.data?.overrides || response.data.overrides || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch permission overrides');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permission overrides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update permission overrides for a global role in tenant
  const updatePermissionOverrides = useCallback(async (tenantId: string, roleId: string, overrides: PermissionOverride[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/tenant/${tenantId}/global-roles/${roleId}/overrides`, {
        overrides
      });
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update permission overrides');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update permission overrides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchGlobalRoles,
    fetchTenantRoles,
    assignGlobalRole,
    unassignGlobalRole,
    createTenantRole,
    updateTenantRole,
    deleteTenantRole,
    getPermissionOverrides,
    updatePermissionOverrides,
    setError
  };
}; 