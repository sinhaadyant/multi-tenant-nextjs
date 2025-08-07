import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  targetType: string;
  priority: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

export interface SendNotificationData {
  title: string;
  message: string;
  targetType: 'superadmin' | 'all_tenants' | 'specific_tenant';
  targetTenantId?: string;
  priority: 'low' | 'medium' | 'high';
}

// Fetch notifications for header
export const useNotifications = (options: { limit?: number; unreadOnly?: boolean } = {}) => {
  const { limit = 10, unreadOnly = false } = options;

  return useQuery({
    queryKey: ['notifications', { limit, unreadOnly }],
    queryFn: async (): Promise<NotificationResponse> => {
      try {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (unreadOnly) {
          params.append('unreadOnly', 'true');
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching notifications with params:', params.toString());
        }

        const response = await api.get(`/superadmin/notifications?${params.toString()}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Notifications API response:', response.data);
        }
        
        return response.data.data;
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching notifications:', error);
          console.error('❌ Error response:', error.response?.data);
          console.error('❌ Error status:', error.response?.status);
        }
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1,
  });
};

// Send notification
export const useSendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendNotificationData): Promise<any> => {
      const response = await api.post('/superadmin/notifications', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Notification sent successfully');
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to send notification';
      toast.error(errorMessage);
    },
  });
};

// Mark notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<any> => {
      const response = await api.patch(`/superadmin/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
      toast.error(errorMessage);
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<any> => {
      const response = await api.patch('/superadmin/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to mark notifications as read';
      toast.error(errorMessage);
    },
  });
}; 