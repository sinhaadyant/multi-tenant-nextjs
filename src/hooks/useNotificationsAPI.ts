import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  type: 'superadmin' | 'tenant' | 'user';
  isActive: boolean;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  roles?: string[];
  userCount?: number;
}

export interface NotificationRecipients {
  superadmins: NotificationRecipient[];
  tenants: NotificationRecipient[];
  users: NotificationRecipient[];
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sendToAllSuperadmins?: boolean;
  sendToAllTenants?: boolean;
  selectedTenants?: string[];
  selectedUsers?: string[];
  customEmails?: string[];
  scheduledAt?: string;
  expiresAt?: string;
}

// Get notification recipients
export const useNotificationRecipients = (search?: string, type?: string) => {
  return useQuery({
    queryKey: ['notification-recipients', search, type],
    queryFn: async (): Promise<{ recipients: NotificationRecipients; stats: any }> => {
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (type) params.append('type', type);

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching notification recipients with params:', params.toString());
        }
        
        const response = await api.get(`/superadmin/notifications/recipients?${params.toString()}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Recipients response:', response.data);
        }
        
        return response.data;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching recipients:', error);
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Create notification
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationData) => {
      const response = await api.post('/superadmin/notifications/create', data);
      return response.data;
    },
    onSuccess: (data) => {
      const recipientCount = data.data?.notification?.totalRecipients || 0;
      toast.success(`Notification sent to ${recipientCount} recipients successfully!`);
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['notification-recipients'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create notification';
      toast.error(message);
    },
  });
};

// Get notifications (existing hook)
export const useNotifications = (filters: any = {}) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetching notifications with params:', params.toString());
        }
        
        const response = await api.get(`/superadmin/notifications?${params.toString()}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Notifications response:', response.data);
        }
        
        return response.data;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching notifications:', error);
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Mark notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/superadmin/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to mark notification as read';
      toast.error(message);
    },
  });
};

// Toggle notification status
export const useToggleNotificationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/superadmin/notifications/${id}/status`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const status = variables.isActive ? 'activated' : 'deactivated';
      toast.success(`Notification ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update notification status';
      toast.error(message);
    },
  });
};
