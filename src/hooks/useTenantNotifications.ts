import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useReduxAuth } from './useReduxAuth';

export interface TenantNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetType: 'all_tenant_users' | 'specific_users';
  targetUserIds?: string[];
  status: 'draft' | 'sent' | 'scheduled';
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  recipientsCount: number;
  readCount: number;
}

export interface TenantNotificationsResponse {
  notifications: TenantNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    draft: number;
    sent: number;
    scheduled: number;
  };
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetType: 'all_tenant_users' | 'specific_users';
  targetUserIds?: string[];
  scheduledAt?: string;
  status: 'draft' | 'sent' | 'scheduled';
}



// Hook for fetching tenant notifications list
export const useTenantNotifications = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  type?: string,
  status?: string,
  priority?: string
) => {
  const { tenant } = useReduxAuth();
  const tenantSlug = tenant?.slug || 'riyo';

  return useQuery({
    queryKey: ['tenant-notifications', tenantSlug, page, limit, search, sortBy, sortOrder, type, status, priority],
    queryFn: async (): Promise<TenantNotificationsResponse> => {
      if (!tenantSlug) throw new Error('Tenant slug is required');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(type && { type }),
        ...(status && { status }),
        ...(priority && { priority })
      });

      const response = await api.get(`/tenant/${tenantSlug}/notifications?${params}`);
      return response.data;
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a new notification
export const useCreateTenantNotification = () => {
  const { tenant } = useReduxAuth();
  const tenantSlug = tenant?.slug || 'riyo';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationData): Promise<{ notification: TenantNotification }> => {
      if (!tenantSlug) throw new Error('Tenant slug is required');

      const response = await api.post(`/tenant/${tenantSlug}/notifications`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications list
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications', tenantSlug] });
    },
  });
};



// Hook for fetching user's own notifications (existing functionality)
export const useUserNotifications = () => {
  const { tenant } = useReduxAuth();
  const tenantSlug = tenant?.slug || 'riyo';

  return useQuery({
    queryKey: ['user-notifications', tenantSlug],
    queryFn: async () => {
      if (!tenantSlug) throw new Error('Tenant slug is required');

      const response = await api.get(`/tenant/${tenantSlug}/notifications/my`);
      return response.data;
    },
    enabled: !!tenantSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for marking notifications as read
export const useMarkNotificationsAsRead = () => {
  const { tenant } = useReduxAuth();
  const tenantSlug = tenant?.slug || 'riyo';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { notificationIds?: string[], markAllAsRead?: boolean }): Promise<{ message: string }> => {
      if (!tenantSlug) throw new Error('Tenant slug is required');

      const response = await api.patch(`/tenant/${tenantSlug}/notifications/my/mark-read`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user notifications
      queryClient.invalidateQueries({ queryKey: ['user-notifications', tenantSlug] });
    },
  });
}; 