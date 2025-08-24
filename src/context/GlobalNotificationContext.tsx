'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useHeaderNotifications } from '@/hooks/useHeaderNotifications';
import { useSocketIO } from '@/hooks/useSocketIO';

interface GlobalNotificationContextType {
  unreadCount: number;
  isConnected: boolean;
  lastNotification: any;
  refreshNotifications: () => void;
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | undefined>(undefined);

export const useGlobalNotifications = () => {
  const context = useContext(GlobalNotificationContext);
  if (!context) {
    throw new Error('useGlobalNotifications must be used within a GlobalNotificationProvider');
  }
  return context;
};

interface GlobalNotificationProviderProps {
  children: React.ReactNode;
}

export const GlobalNotificationProvider: React.FC<GlobalNotificationProviderProps> = ({ children }) => {
  const { user, tenant } = useReduxAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  // Get header notifications data
  const { data: headerNotificationsData, refetch, isEnabled, error, isLoading } = useHeaderNotifications();

  // Initialize Socket.io connection
  const { isConnected: socketConnected } = useSocketIO({ enabled: !!user?.id });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Global Notification Context Debug:', {
      userId: user?.id,
      tenantId: user?.tenantId,
      userEmail: user?.email,
      isEnabled,
      isLoading,
      hasError: !!error,
      unreadCount: headerNotificationsData?.data?.unreadCount,
      notificationsCount: headerNotificationsData?.data?.notifications?.length
    });
  }, [user?.id, user?.tenantId, user?.email, isEnabled, isLoading, error, headerNotificationsData]);

  // Update unread count from header notifications
  useEffect(() => {
    if (headerNotificationsData?.data?.unreadCount !== undefined) {
      const newCount = headerNotificationsData.data.unreadCount;
      console.log('🔄 Global Context: Updating unread count:', { old: unreadCount, new: newCount });
      if (newCount !== unreadCount) {
        setUnreadCount(newCount);
      }
    }
  }, [headerNotificationsData?.data?.unreadCount, unreadCount]);

  // Detect new notifications and show toast
  useEffect(() => {
    if (unreadCount > prevUnreadCount && prevUnreadCount > 0) {
      const newNotificationsCount = unreadCount - prevUnreadCount;
      console.log('📨 New notification detected globally!', { newNotificationsCount, unreadCount, prevUnreadCount });
      
      // Show toast notification
      toast.success(
        `You have ${newNotificationsCount} new notification${newNotificationsCount > 1 ? 's' : ''}!`,
        {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }
      );
    }
    
    if (prevUnreadCount === 0 && unreadCount > 0) {
      // First time loading, don't show toast
      console.log('📨 Initial notification count loaded:', unreadCount);
    }
    
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  // Socket.io-based notification updates with fallback polling
  useEffect(() => {
    if (!user?.id || !user?.tenantId || !isEnabled) {
      console.log('🔌 Global notifications disabled - user not logged in or hook not enabled');
      setIsConnected(false);
      return;
    }

    console.log('🔌 Starting Socket.io-based notification system for user:', user.id);
    setIsConnected(socketConnected);

    // Initial fetch
    refetch();

    // Fallback polling every 10 seconds in case Socket.io fails
    const fallbackInterval = setInterval(() => {
      if (!socketConnected) {
        console.log('🔄 Fallback polling (Socket.io not connected)...');
        refetch();
      }
    }, 10000); // 10 seconds - fallback only

    return () => {
      console.log('🔌 Stopping notification system');
      clearInterval(fallbackInterval);
      setIsConnected(false);
    };
  }, [user?.id, user?.tenantId, isEnabled, refetch, socketConnected]);

  // Optimized refresh notifications function
  const refreshNotifications = useCallback(() => {
    console.log('🔄 Manual refresh of notifications');
    refetch();
  }, [refetch]);

  // Add a function to trigger refresh when new notifications are sent
  const triggerNotificationUpdate = useCallback(() => {
    console.log('🔄 Triggering notification update');
    // Small delay to ensure backend has processed the notification
    setTimeout(() => {
      refetch();
    }, 1000);
  }, [refetch]);

  // Update notification count in global state
  useEffect(() => {
    if (headerNotificationsData?.data?.notifications) {
      const notifications = headerNotificationsData.data.notifications;
      if (notifications.length > 0) {
        // Get the latest notification
        const latest = notifications[0];
        if (latest.id !== lastNotification?.id) {
          setLastNotification(latest);
        }
      }
    }
  }, [headerNotificationsData, lastNotification]);

  // Listen for Socket.io notification events
  useEffect(() => {
    const handleNotificationReceived = (event: CustomEvent) => {
      console.log('📨 Socket.io notification received in global context:', event.detail);
      setLastNotification(event.detail);
      // Trigger refresh to update notification count
      refetch();
    };

    window.addEventListener('notification-received', handleNotificationReceived as EventListener);

    return () => {
      window.removeEventListener('notification-received', handleNotificationReceived as EventListener);
    };
  }, [refetch]);

  const value: GlobalNotificationContextType = {
    unreadCount,
    isConnected, // Global context connection status
    lastNotification,
    refreshNotifications,
  };

  return (
    <GlobalNotificationContext.Provider value={value}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};
