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
  useSocketIO({ enabled: !!user?.id });



  // Update unread count from header notifications
  useEffect(() => {
    if (headerNotificationsData?.data?.unreadCount !== undefined) {
      const newCount = headerNotificationsData.data.unreadCount;

      if (newCount !== unreadCount) {
        setUnreadCount(newCount);
      }
    }
  }, [headerNotificationsData?.data?.unreadCount, unreadCount]);

  // Detect new notifications and show toast
  useEffect(() => {
    if (unreadCount > prevUnreadCount && prevUnreadCount > 0) {
      const newNotificationsCount = unreadCount - prevUnreadCount;

      
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
    }
    
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  // Socket.io-based notification updates with fallback polling
  useEffect(() => {
    if (!user?.id || !user?.tenantId || !isEnabled) {

      setIsConnected(false);
      return;
    }


    setIsConnected(true);

    // Initial fetch
    refetch();

    // Fallback polling every 10 seconds in case Socket.io fails
    const fallbackInterval = setInterval(() => {
      
      refetch();
    }, 10000); // 10 seconds - fallback only

    return () => {

      clearInterval(fallbackInterval);
      setIsConnected(false);
    };
  }, [user?.id, user?.tenantId, isEnabled, refetch]);

  // Optimized refresh notifications function
  const refreshNotifications = useCallback(() => {

    refetch();
  }, [refetch]);

  // Add a function to trigger refresh when new notifications are sent
  const triggerNotificationUpdate = useCallback(() => {

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
