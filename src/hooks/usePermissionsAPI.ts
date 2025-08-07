import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionData {
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  module?: string;
  action?: string;
}

export const usePermissionsAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all permissions
  const fetchPermissions = useCallback(async (): Promise<Permission[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/superadmin/permissions');
      
      if (response.success) {
        return response.data.permissions;
      } else {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permissions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new permission
  const createPermission = useCallback(async (permissionData: CreatePermissionData): Promise<Permission> => {
    try {
      setError(null);
      
      const response = await api.post('/superadmin/permissions', permissionData);
      
      if (response.success) {
        return response.data.permission;
      } else {
        throw new Error(response.message || 'Failed to create permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create permission');
      throw err;
    }
  }, []);

  // Update an existing permission
  const updatePermission = useCallback(async (permissionId: string, permissionData: UpdatePermissionData): Promise<Permission> => {
    try {
      setError(null);
      
      const response = await api.put(`/superadmin/permissions/${permissionId}`, permissionData);
      
      if (response.success) {
        return response.data.permission;
      } else {
        throw new Error(response.message || 'Failed to update permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update permission');
      throw err;
    }
  }, []);

  // Delete a permission
  const deletePermission = useCallback(async (permissionId: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await api.delete(`/superadmin/permissions/${permissionId}`);
      
      if (response.success) {
        return;
      } else {
        throw new Error(response.message || 'Failed to delete permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete permission');
      throw err;
    }
  }, []);

  // Get a single permission by ID
  const getPermission = useCallback(async (permissionId: string): Promise<Permission> => {
    try {
      setError(null);
      
      const response = await api.get(`/superadmin/permissions/${permissionId}`);
      
      if (response.success) {
        return response.data.permission;
      } else {
        throw new Error(response.message || 'Failed to fetch permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permission');
      throw err;
    }
  }, []);

  // Get permissions by module
  const getPermissionsByModule = useCallback(async (module: string): Promise<Permission[]> => {
    try {
      setError(null);
      
      const response = await api.get(`/superadmin/permissions?module=${module}`);
      
      if (response.success) {
        return response.data.permissions;
      } else {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permissions');
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    getPermission,
    getPermissionsByModule
  };
}; 