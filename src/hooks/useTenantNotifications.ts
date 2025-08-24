import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

// Types
export interface TenantNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  status: 'draft' | 'sent' | 'scheduled' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  recipientsCount: number;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export interface UserNotification {
  id: string;
  notificationId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read';
  readAt?: Date;
  createdAt: Date;
  notificationCreatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationFilters {
  search?: string;
  type?: string;
  status?: string;
}

export interface NotificationStats {
  total: number;
  draft: number;
  sent: number;
  scheduled: number;
  cancelled: number;
}

export interface NotificationResponse {
  notifications: TenantNotification[];
  stats: NotificationStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserNotificationResponse {
  notifications: UserNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
  lastUpdated: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: Date;
  recipientIds?: string[];
}

export interface MarkReadData {
  notificationIds?: string[];
  markAllAsRead?: boolean;
}

// API functions
const fetchTenantNotifications = async (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: NotificationFilters;
    sortBy?: string;
    sortOrder?: string;
  }
): Promise<NotificationResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.filters?.type) searchParams.append('type', params.filters.type);
  if (params.filters?.status) searchParams.append('status', params.filters.status);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await api.get(`/tenant/${tenantSlug}/notifications?${searchParams.toString()}`);
  return response.data;
};

const fetchUserNotifications = async (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
  }
): Promise<UserNotificationResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.status) searchParams.append('status', params.status);
  if (params.type) searchParams.append('type', params.type);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await api.get(`/tenant/${tenantSlug}/notifications/my?${searchParams.toString()}`);
  return response.data;
};

const createTenantNotification = async (tenantSlug: string, data: CreateNotificationData): Promise<{ notification: TenantNotification }> => {
  const response = await api.post(`/tenant/${tenantSlug}/notifications`, data);
  return response.data;
};

const markNotificationsAsRead = async (tenantSlug: string, data: MarkReadData): Promise<{ message: string }> => {
  const response = await api.patch(`/tenant/${tenantSlug}/notifications/my/mark-read`, data);
  return response.data;
};

// React Query hooks
export const useTenantNotifications = (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: NotificationFilters;
    sortBy?: string;
    sortOrder?: string;
  } = {}
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenant-notifications', tenantSlug, params],
    queryFn: () => fetchTenantNotifications(tenantSlug, params),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const setPage = (page: number) => {
    queryClient.setQueryData(['tenant-notifications', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, page }
      };
    });
  };

  const setPageSize = (limit: number) => {
    queryClient.setQueryData(['tenant-notifications', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, limit }
      };
    });
  };

  return {
    notifications: query.data?.notifications,
    stats: query.data?.stats,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setPage,
    setPageSize
  };
};

export const useUserNotifications = (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-notifications', tenantSlug, params],
    queryFn: () => fetchUserNotifications(tenantSlug, params),
    enabled: !!tenantSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for user notifications)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const setPage = (page: number) => {
    queryClient.setQueryData(['user-notifications', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, page }
      };
    });
  };

  const setPageSize = (limit: number) => {
    queryClient.setQueryData(['user-notifications', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, limit }
      };
    });
  };

  return {
    notifications: query.data?.notifications,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setPage,
    setPageSize
  };
};

export const useCreateNotification = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationData) => createTenantNotification(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications', tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications', tenantSlug] });
      toast.success('Notification created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create notification');
    }
  });
};

export const useMarkNotificationsAsRead = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkReadData) => markNotificationsAsRead(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', tenantSlug] });
      toast.success('Notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark notifications as read');
    }
  });
}; 