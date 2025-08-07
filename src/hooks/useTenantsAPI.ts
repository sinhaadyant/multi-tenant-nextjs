import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  isActive: boolean;
  plan: 'starter' | 'professional' | 'enterprise';
  region: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

export interface TenantStats {
  total: number;
  active: number;
  inactive: number;
}

export interface TenantFilters {
  search?: string;
  status?: string;
  plan?: string;
  region?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  admin_email: string;
  domain?: string;
  description?: string;
  plan?: string;
  region?: string;
  features?: string[];
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role?: {
    id: string;
    name: string;
  };
  lastLogin?: string;
  createdAt: string;
}

// Fetch tenants with filters
export const useTenants = (filters: TenantFilters = {}) => {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        console.log('🔍 Fetching tenants with params:', params.toString());
        const response = await api.get(`/superadmin/tenants?${params.toString()}`);
        console.log('✅ Tenants response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching tenants:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Fetch single tenant details
export const useTenant = (id: string) => {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      try {
        console.log('🔍 useTenant making API call for ID:', id);
        const response = await api.get(`/superadmin/tenants/${id}`);
        console.log('🔍 useTenant API Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ useTenant API Error:', error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Fetch tenant users
export const useTenantUsers = (tenantId: string, filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  return useQuery({
    queryKey: ['tenant-users', tenantId, filters],
    queryFn: async () => {
      try {
        console.log('🔍 useTenantUsers making API call for tenant ID:', tenantId, 'with filters:', filters);
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        const response = await api.get(`/superadmin/tenants/${tenantId}/users?${params.toString()}`);
        console.log('🔍 useTenantUsers API Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ useTenantUsers API Error:', error);
        throw error;
      }
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Create new tenant
export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTenantData) => {
      const response = await api.post('/superadmin/tenants', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Tenant created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create tenant';
      toast.error(message);
    },
  });
};

// Update tenant
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
      const response = await api.put(`/superadmin/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Tenant updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update tenant';
      toast.error(message);
    },
  });
};

// Toggle tenant status
export const useToggleTenantStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/superadmin/tenants/${id}/status`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const status = variables.isActive ? 'activated' : 'suspended';
      toast.success(`Tenant ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update tenant status';
      toast.error(message);
    },
  });
};

// Delete tenant
export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/superadmin/tenants/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tenant deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete tenant';
      toast.error(message);
    },
  });
};

// Check subdomain availability
export const useCheckSubdomain = (subdomain: string) => {
  return useQuery({
    queryKey: ['subdomain-check', subdomain],
    queryFn: async () => {
      const response = await api.get(`/superadmin/tenants/check-subdomain?subdomain=${subdomain}`);
      return response.data.data; // Access the actual data from the API response
    },
    enabled: !!subdomain && subdomain.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
};

// Toggle user status
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, userId, isActive }: { tenantId: string; userId: string; isActive: boolean }) => {
      const response = await api.patch(`/superadmin/tenants/${tenantId}/users/${userId}/status`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const status = variables.isActive ? 'activated' : 'suspended';
      toast.success(`User ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['tenant-users', variables.tenantId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user status';
      toast.error(message);
    },
  });
};

// Reset user password
export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: async ({ tenantId, userId }: { tenantId: string; userId: string }) => {
      const response = await api.post(`/superadmin/tenants/${tenantId}/users/${userId}/reset-password`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Password reset successfully!');
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    },
  });
};

// Export tenants data
export const useExportTenants = () => {
  return useMutation({
    mutationFn: async (filters: TenantFilters = {}) => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/superadmin/tenants/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tenants-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export completed successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export data';
      toast.error(message);
    },
  });
}; 

// Fetch activity logs for a specific tenant
export const useTenantActivityLogs = (tenantId: string, filters: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  return useQuery({
    queryKey: ['tenant-activity-logs', tenantId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/superadmin/audit-logs?${params.toString()}`);
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}; 