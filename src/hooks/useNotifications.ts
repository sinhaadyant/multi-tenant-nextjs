import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'promotional' | 'system_update';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'sent' | 'scheduled' | 'cancelled';
  targetType: 'superadmin' | 'specific_users' | 'multiple_users' | 'entire_tenant' | 'multiple_tenants';
  targetTenantId?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByType: 'superadmin' | 'tenant_admin' | 'user';
  isRead?: boolean;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  metadata?: Record<string, any>;
  superAdmin?: {
    id: string;
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    userNotifications: number;
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount?: number;
  stats: {
    total: number;
    draft: number;
    sent: number;
    scheduled: number;
    cancelled: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'promotional' | 'system_update';
  priority: 'low' | 'medium' | 'high';
  targetType: 'superadmin' | 'specific_users' | 'multiple_users' | 'entire_tenant' | 'multiple_tenants';
  targetTenantId?: string;
  targetUserIds?: string[];
  scheduledAt?: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  search?: string;
  type?: string[];
  status?: string[];
  priority?: string[];
  targetType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Fetch notifications for superadmin
export const useNotifications = (filters: NotificationFilters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.type) filters.type.forEach(t => queryParams.append('type', t));
  if (filters.status) filters.status.forEach(s => queryParams.append('status', s));
  if (filters.priority) filters.priority.forEach(p => queryParams.append('priority', p));
  if (filters.targetType) filters.targetType.forEach(t => queryParams.append('targetType', t));
  if (filters.dateRange) queryParams.append('dateRange', JSON.stringify(filters.dateRange));
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async (): Promise<NotificationResponse> => {
      try {
        const response = await api.get(`/superadmin/notifications?${queryParams.toString()}`);
        return response.data.data || response.data;
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1,
  });
};

// Create notification
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationData): Promise<{ notification: Notification }> => {
      const response = await api.post('/superadmin/notifications', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Notification created successfully');
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create notification';
      toast.error(errorMessage);
    },
  });
};

// Update notification
export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateNotificationData> }): Promise<{ notification: Notification }> => {
      const response = await api.put(`/superadmin/notifications/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Notification updated successfully');
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update notification';
      toast.error(errorMessage);
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<any> => {
      const response = await api.delete(`/superadmin/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notification deleted successfully');
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete notification';
      toast.error(errorMessage);
    },
  });
};

// Send notification
export const useSendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<{ notification: Notification }> => {
      const response = await api.patch(`/superadmin/notifications/${notificationId}`, {
        action: 'send',
        notificationId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Notification sent successfully');
      // Invalidate notifications cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to send notification';
      toast.error(errorMessage);
    },
  });
};

// Get single notification
export const useNotification = (id: string) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: async (): Promise<{ notification: Notification }> => {
      const response = await api.get(`/superadmin/notifications/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
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