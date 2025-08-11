import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  isGlobal: boolean;
  isActive: boolean;
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

export interface CreateRoleData {
  name: string;
  description?: string;
  isGlobal?: boolean;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isGlobal?: boolean;
  isActive?: boolean;
  permissions?: string[];
}

export const useRolesAPI = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/superadmin/roles');
      
      if (response.data.success) {
        setRoles(response.data.data.roles);
      } else {
        setError(response.data.message || 'Failed to fetch roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
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
        // Add the new role to the list
        setRoles(prev => [...prev, response.data.data.role]);
        return response.data.data.role;
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
        // Update the role in the list
        setRoles(prev => prev.map(role => 
          role.id === roleId ? { ...role, ...response.data.data.role } : role
        ));
        return response.data.data.role;
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
        // Remove the role from the list
        setRoles(prev => prev.filter(role => role.id !== roleId));
      } else {
        throw new Error(response.data.message || 'Failed to delete role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      throw err;
    }
  }, []);

  // Get a single role by ID
  const getRole = useCallback(async (roleId: string): Promise<Role> => {
    try {
      setError(null);
      
      const response = await api.get(`/superadmin/roles/${roleId}`);
      
      if (response.data.success) {
        return response.data.data.role;
      } else {
        throw new Error(response.data.message || 'Failed to fetch role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch role');
      throw err;
    }
  }, []);

  // Refetch roles
  const refetch = useCallback(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    getRole,
    refetch
  };
}; 