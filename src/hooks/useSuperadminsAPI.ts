import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contactNumber?: string;
  avatar?: string;
  stats: {
    auditLogs: number;
    backups: number;
    notifications: number;
    reports: number;
  };
}

export interface SuperAdminStats {
  total: number;
  active: number;
  inactive: number;
}

export interface SuperAdminFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateInviteData {
  email: string;
  name: string;
}

// Fetch superadmins with filters
export const useSuperadmins = (filters: SuperAdminFilters = {}) => {
  return useQuery({
    queryKey: ['superadmins', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching superadmins with params:', params.toString());
        }
        
        const response = await api.get(`/superadmin/superadmins?${params.toString()}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Superadmins response:', response.data);
        }
        
        return response.data;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching superadmins:', error);
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Toggle superadmin status
export const useToggleSuperAdminStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/superadmin/superadmins/${id}/status`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const status = variables.isActive ? 'activated' : 'deactivated';
      toast.success(`Superadmin ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['superadmins'], exact: false });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update superadmin status';
      toast.error(message);
    },
  });
};

// Create superadmin invite
export const useCreateSuperAdminInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInviteData) => {
      const response = await api.post('/superadmin/superadmins/invite', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Superadmin invite created successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmins'], exact: false });
      return data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create superadmin invite';
      toast.error(message);
    },
  });
};
