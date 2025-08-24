import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useReduxAuth } from './useReduxAuth';

export interface HeaderNotification {
  id: string;
  notificationId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'read' | 'unread';
  readAt?: string;
  createdAt: string;
  notificationCreatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HeaderNotificationsResponse {
  data: {
    notifications: HeaderNotification[];
    unreadCount: number;
    lastUpdated: string;
  };
}

// Hook for fetching header notifications (no permission checks)
export const useHeaderNotifications = (limit: number = 10) => {
  const { tenant, user } = useReduxAuth();
  const tenantSlug = tenant?.slug || 'riyo';

  return useQuery({
    queryKey: ['header-notifications', tenantSlug, limit],
    queryFn: async (): Promise<HeaderNotificationsResponse> => {
      if (!tenantSlug || !user?.email) {
        throw new Error('Tenant slug and user email are required');
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await api.get(`/tenant/${tenantSlug}/notifications/header?${params}`, {
        headers: {
          'X-User-Email': user.email
        }
      });
      
      // Handle the nested data structure from API response
      // API returns: { data: { data: { notifications, unreadCount, lastUpdated } } }
      // We need: { data: { notifications, unreadCount, lastUpdated } }
      const apiData = response.data?.data?.data || response.data?.data || response.data;
      
      return {
        data: apiData
      };
    },
    enabled: !!tenantSlug && !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache since WebSocket handles updates
    refetchInterval: false, // Disable automatic refetching - WebSocket handles real-time updates
    retry: 1,
  });
};

// Hook for marking header notifications as read
export const useMarkHeaderNotificationsAsRead = () => {
  const { tenant, user } = useReduxAuth();
  const tenantSlug = tenant?.slug || 'riyo';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { notificationIds?: string[], markAllAsRead?: boolean }): Promise<{ message: string }> => {
      if (!tenantSlug || !user?.email) {
        throw new Error('Tenant slug and user email are required');
      }

      const response = await api.patch(`/tenant/${tenantSlug}/notifications/header`, data, {
        headers: {
          'X-User-Email': user.email
        }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate header notifications
      queryClient.invalidateQueries({ queryKey: ['header-notifications', tenantSlug] });
    },
  });
};
