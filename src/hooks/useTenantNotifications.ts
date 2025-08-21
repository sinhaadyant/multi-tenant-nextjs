import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

// Types
export interface TenantNotification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetType: 'user' | 'specific_tenant' | 'all_tenants';
  targetTenantId?: string;
  createdBy?: string;
  createdByType: 'user' | 'superadmin';
  metadata?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantNotificationsFilters {
  page?: number;
  limit?: number;
  priority?: string;
  search?: string;
  sortBy?: 'createdAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TenantNotificationsResponse {
  notifications: TenantNotification[];
  stats: {
    total: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
}

export interface CreateTenantNotificationData {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  targetType?: 'user' | 'specific_tenant' | 'all_tenants';
  metadata?: Record<string, any>;
}

// Hooks
export const useTenantNotifications = (filters: TenantNotificationsFilters = {}) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  return useQuery({
    queryKey: ['tenant-notifications', tenantSlug, filters],
    queryFn: async (): Promise<TenantNotificationsResponse> => {
      const searchParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/tenant/${tenantSlug}/notifications?${searchParams.toString()}`);
      return response.data.data;
    },
    enabled: !!tenantSlug,
  });
};

export const useCreateTenantNotification = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTenantNotificationData): Promise<{ notification: TenantNotification }> => {
      const response = await api.post(`/tenant/${tenantSlug}/notifications`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications', tenantSlug] });
    },
  });
};

export const useTenantNotificationStats = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  return useQuery({
    queryKey: ['tenant-notification-stats', tenantSlug],
    queryFn: async () => {
      const response = await api.get(`/tenant/${tenantSlug}/notifications?limit=1`);
      return response.data.data.stats;
    },
    enabled: !!tenantSlug,
  });
}; 