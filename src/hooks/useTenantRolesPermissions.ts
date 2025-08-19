import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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

export interface Permission {
  id: string;
  name: string;
  description?: string;
  action: string;
  moduleKey: string;
  resource?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  module: Module;
  roleCount: number;
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

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
  roleCount: number;
  roles: Role[];
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
  user: User;
  role: Role;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
  isSystem: boolean;
  category: string;
}

export interface RoleAnalytics {
  totalRoles: number;
  activeRoles: number;
  totalPermissions: number;
  totalAssignments: number;
  roleDistribution: {
    roleId: string;
    roleName: string;
    userCount: number;
    percentage: number;
  }[];
  permissionUsage: {
    permissionId: string;
    permissionName: string;
    usageCount: number;
    percentage: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    details: string;
    timestamp: string;
    user: string;
  }[];
}

export interface CreateRoleData {
  name: string;
  description?: string;
  color?: string;
  permissions?: RolePermission[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  permissions?: RolePermission[];
}

export interface CreatePermissionData {
  name: string;
  description?: string;
  action: string;
  moduleKey: string;
  resource?: string;
  isActive?: boolean;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  action?: string;
  moduleKey?: string;
  resource?: string;
  isActive?: boolean;
}

export interface RoleAssignmentData {
  userId: string;
  roleId: string;
}

export interface Filters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  roleType?: 'all' | 'system' | 'custom';
  module?: 'all' | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Main hook for tenant roles and permissions management
export const useTenantRolesPermissions = (tenantSlug: string) => {
  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [analytics, setAnalytics] = useState<RoleAnalytics | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Permission states
  const [userPermissions, setUserPermissions] = useState({
    canViewRoles: false,
    canCreateRoles: false,
    canUpdateRoles: false,
    canDeleteRoles: false,
    canViewPermissions: false,
    canCreatePermissions: false,
    canUpdatePermissions: false,
    canDeletePermissions: false,
    canAssignRoles: false,
    canRemoveRoles: false,
  });

  // Fetch roles
  const fetchRoles = useCallback(async (filters: Filters = {}) => {
    if (!tenantSlug) return;
    
    setLoadingRoles(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/roles?${params}`);
      
      if (response.status === 200) {
        setRoles(response.data.roles || []);
        setUserPermissions(prev => ({
          ...prev,
          ...response.data.permissions
        }));
      } else {
        throw new Error('Failed to fetch roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, [tenantSlug]);

  // Fetch permissions
  const fetchPermissions = useCallback(async (filters: Filters = {}) => {
    if (!tenantSlug) return;
    
    setLoadingPermissions(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/permissions?${params}`);
      
      if (response.status === 200) {
        setPermissions(response.data.permissions || []);
        setModules(response.data.modules || []);
        setUserPermissions(prev => ({
          ...prev,
          ...response.data.permissions
        }));
      } else {
        throw new Error('Failed to fetch permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permissions');
      console.error('Error fetching permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  }, [tenantSlug]);

  // Fetch users
  const fetchUsers = useCallback(async (filters: Filters = {}) => {
    if (!tenantSlug) return;
    
    setLoadingUsers(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/users?${params}`);
      
      if (response.status === 200) {
        setUsers(response.data.users || []);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [tenantSlug]);

  // Fetch role assignments
  const fetchRoleAssignments = useCallback(async (filters: Filters = {}) => {
    if (!tenantSlug) return;
    
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/roles/assign?${params}`);
      
      if (response.status === 200) {
        setRoleAssignments(response.data.assignments || []);
        setUserPermissions(prev => ({
          ...prev,
          ...response.data.permissions
        }));
      } else {
        throw new Error('Failed to fetch role assignments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch role assignments');
      console.error('Error fetching role assignments:', err);
    }
  }, [tenantSlug]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!tenantSlug) return;
    
    setLoadingAnalytics(true);
    setError(null);
    
    try {
      const response = await api.get(`/tenant/${tenantSlug}/roles/analytics`);
      
      if (response.status === 200) {
        setAnalytics(response.data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [tenantSlug]);

  // Create role
  const createRole = useCallback(async (roleData: CreateRoleData) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/tenant/${tenantSlug}/roles`, roleData);
      
      if (response.status === 201 || response.status === 200) {
        await fetchRoles(); // Refresh roles list
        return response.data.role;
      } else {
        throw new Error('Failed to create role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoles]);

  // Update role
  const updateRole = useCallback(async (roleId: string, roleData: UpdateRoleData) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/tenant/${tenantSlug}/roles/${roleId}`, roleData);
      
      if (response.status === 200) {
        await fetchRoles(); // Refresh roles list
        return response.data.role;
      } else {
        throw new Error('Failed to update role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoles]);

  // Delete role
  const deleteRole = useCallback(async (roleId: string) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/tenant/${tenantSlug}/roles/${roleId}`);
      
      if (response.status === 200) {
        await fetchRoles(); // Refresh roles list
        return response.data;
      } else {
        throw new Error('Failed to delete role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoles]);

  // Create permission
  const createPermission = useCallback(async (permissionData: CreatePermissionData) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/tenant/${tenantSlug}/permissions`, permissionData);
      
      if (response.status === 201 || response.status === 200) {
        await fetchPermissions(); // Refresh permissions list
        return response.data.permission;
      } else {
        throw new Error('Failed to create permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create permission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchPermissions]);

  // Update permission
  const updatePermission = useCallback(async (permissionId: string, permissionData: UpdatePermissionData) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/tenant/${tenantSlug}/permissions/${permissionId}`, permissionData);
      
      if (response.status === 200) {
        await fetchPermissions(); // Refresh permissions list
        return response.data.permission;
      } else {
        throw new Error('Failed to update permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update permission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchPermissions]);

  // Delete permission
  const deletePermission = useCallback(async (permissionId: string) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/tenant/${tenantSlug}/permissions/${permissionId}`);
      
      if (response.status === 200) {
        await fetchPermissions(); // Refresh permissions list
        return response.data;
      } else {
        throw new Error('Failed to delete permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete permission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchPermissions]);

  // Assign role to user
  const assignRoleToUser = useCallback(async (userId: string, roleId: string) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/tenant/${tenantSlug}/roles/assign`, {
        userId,
        roleId
      });
      
      if (response.status === 201 || response.status === 200) {
        await fetchRoleAssignments(); // Refresh assignments
        return response.data.assignment;
      } else {
        throw new Error('Failed to assign role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoleAssignments]);

  // Remove role from user
  const removeRoleFromUser = useCallback(async (userId: string, roleId: string) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/tenant/${tenantSlug}/roles/assign`, {
        data: {
          assignments: [{ userId, roleId }]
        }
      });
      
      if (response.status === 200) {
        await fetchRoleAssignments(); // Refresh assignments
        return response.data;
      } else {
        throw new Error('Failed to remove role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoleAssignments]);

  // Bulk assign roles
  const bulkAssignRoles = useCallback(async (assignments: RoleAssignmentData[]) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/tenant/${tenantSlug}/roles/assign`, {
        assignments
      });
      
      if (response.status === 200) {
        await fetchRoleAssignments(); // Refresh assignments
        return response.data;
      } else {
        throw new Error('Failed to assign roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoleAssignments]);

  // Bulk remove roles
  const bulkRemoveRoles = useCallback(async (assignments: RoleAssignmentData[]) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/tenant/${tenantSlug}/roles/assign`, {
        data: { assignments }
      });
      
      if (response.status === 200) {
        await fetchRoleAssignments(); // Refresh assignments
        return response.data;
      } else {
        throw new Error('Failed to remove roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoleAssignments]);

  // Import role template
  const importRoleTemplate = useCallback(async (templateId: string) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/tenant/${tenantSlug}/roles/templates/${templateId}/import`);
      
      if (response.status === 201 || response.status === 200) {
        await fetchRoles(); // Refresh roles list
        return response.data;
      } else {
        throw new Error('Failed to import role template');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import role template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoles]);

  // Export roles
  const exportRoles = useCallback(async () => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/tenant/${tenantSlug}/roles/export`, {
        responseType: 'blob'
      });
      
      if (response.status === 200) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `roles-${tenantSlug}-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return response.data;
      } else {
        throw new Error('Failed to export roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  // Import roles
  const importRoles = useCallback(async (file: File) => {
    if (!tenantSlug) throw new Error('Tenant slug is required');
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/tenant/${tenantSlug}/roles/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.status === 201 || response.status === 200) {
        await fetchRoles(); // Refresh roles list
        return response.data;
      } else {
        throw new Error('Failed to import roles');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, fetchRoles]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchRoles(),
      fetchPermissions(),
      fetchUsers(),
      fetchRoleAssignments(),
      fetchAnalytics()
    ]);
  }, [fetchRoles, fetchPermissions, fetchUsers, fetchRoleAssignments, fetchAnalytics]);

  return {
    // Data
    roles,
    permissions,
    modules,
    users,
    roleAssignments,
    roleTemplates,
    analytics,
    
    // Loading states
    loading,
    loadingRoles,
    loadingPermissions,
    loadingUsers,
    loadingAnalytics,
    
    // Error state
    error,
    
    // Actions
    fetchRoles,
    fetchPermissions,
    fetchUsers,
    fetchRoleAssignments,
    fetchAnalytics,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    assignRoleToUser,
    removeRoleFromUser,
    bulkAssignRoles,
    bulkRemoveRoles,
    importRoleTemplate,
    exportRoles,
    importRoles,
    
    // Permissions
    ...userPermissions,
    
    // Utilities
    clearError,
    refreshData
  };
};
