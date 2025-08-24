import { useEffect, useRef, useCallback } from 'react';
import notificationSocket, { NotificationSocketData } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';

interface UseNotificationSocketProps {
  userId: string;
  userType: 'user' | 'superadmin';
  tenantId?: string;
  enabled?: boolean;
}

export const useNotificationSocket = ({
  userId,
  userType,
  tenantId,
  enabled = true
}: UseNotificationSocketProps) => {
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!enabled || isConnectedRef.current) return;

    try {
      notificationSocket.connect(userId, userType, tenantId);
      isConnectedRef.current = true;

      // Join appropriate rooms based on user type
      if (userType === 'superadmin') {
        notificationSocket.joinSuperAdminRoom();
      } else if (userType === 'user' && tenantId) {
        notificationSocket.joinUserRoom(userId);
        notificationSocket.joinTenantRoom(tenantId);
      }

      console.log('🔌 Notification socket connected for:', { userId, userType, tenantId });
    } catch (error) {
      console.error('Failed to connect notification socket:', error);
    }
  }, [userId, userType, tenantId, enabled]);

  const disconnect = useCallback(() => {
    if (!isConnectedRef.current) return;

    try {
      // Leave rooms
      if (userType === 'superadmin') {
        notificationSocket.leaveSuperAdminRoom();
      } else if (userType === 'user' && tenantId) {
        notificationSocket.leaveUserRoom(userId);
        notificationSocket.leaveTenantRoom(tenantId);
      }

      notificationSocket.disconnect();
      isConnectedRef.current = false;
      console.log('🔌 Notification socket disconnected');
    } catch (error) {
      console.error('Failed to disconnect notification socket:', error);
    }
  }, [userId, userType, tenantId]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: NotificationSocketData) => {
    console.log('📨 New notification received:', notification);
    
    // Invalidate relevant queries to refresh data
    if (userType === 'superadmin') {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-notifications'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications', tenantId] });
    }
  }, [queryClient, userType, tenantId]);

  // Handle notification count updates
  const handleCountUpdate = useCallback((data: { unreadCount: number }) => {
    console.log('📊 Notification count updated:', data);
    
    // Update notification count in cache
    if (userType === 'superadmin') {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: data.unreadCount
        };
      });
    } else {
      queryClient.setQueryData(['user-notifications', tenantId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: data.unreadCount
        };
      });
    }
  }, [queryClient, userType, tenantId]);

  // Handle notification read events
  const handleNotificationRead = useCallback((data: any) => {
    console.log('📖 Notification marked as read:', data);
    
    // Invalidate queries to refresh read status
    if (userType === 'superadmin') {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', tenantId] });
    }
  }, [queryClient, userType, tenantId]);

  useEffect(() => {
    if (!enabled) return;

    // Connect to socket
    connect();

    // Set up event listeners
    notificationSocket.on('new_notification', handleNewNotification);
    notificationSocket.on('notification_count_update', handleCountUpdate);
    notificationSocket.on('notification_read', handleNotificationRead);

    // Cleanup function
    return () => {
      notificationSocket.off('new_notification', handleNewNotification);
      notificationSocket.off('notification_count_update', handleCountUpdate);
      notificationSocket.off('notification_read', handleNotificationRead);
      disconnect();
    };
  }, [enabled, connect, disconnect, handleNewNotification, handleCountUpdate, handleNotificationRead]);

  // Reconnect on user/tenant change
  useEffect(() => {
    if (enabled && isConnectedRef.current) {
      disconnect();
      setTimeout(() => {
        connect();
      }, 100);
    }
  }, [userId, userType, tenantId, enabled, connect, disconnect]);

  return {
    isConnected: notificationSocket.isSocketConnected(),
    connect,
    disconnect,
  };
};
