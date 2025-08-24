"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useHeaderNotifications, useMarkHeaderNotificationsAsRead } from "@/hooks/useHeaderNotifications";
import { useParams } from "next/navigation";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { useGlobalNotifications } from "@/context/GlobalNotificationContext";
import { useSocketIO } from "@/hooks/useSocketIO";
import { toast } from "react-hot-toast";

export default function TenantNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, tenant } = useReduxAuth();

  // Fetch header notifications for display (no real-time updates)
  const { 
    data: headerNotificationsData, 
    isLoading, 
    refetch
  } = useHeaderNotifications(10);
  
  // Use global notification context for real-time updates
  const { unreadCount: globalUnreadCount, isConnected: globalIsConnected, refreshNotifications } = useGlobalNotifications();
  
  const notifications = headerNotificationsData?.data?.notifications || [];
  // Use global unread count for real-time updates, fallback to local data
  const unreadCount = globalUnreadCount !== undefined ? globalUnreadCount : (headerNotificationsData?.data?.unreadCount || 0);
  
  // Track previous unread count to show notification indicator
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);
  const [showNewNotificationIndicator, setShowNewNotificationIndicator] = useState(false);

  // Initialize Socket.io connection
  const { isConnected: socketConnected } = useSocketIO({ enabled: !!user?.id });

  // Debug unread count changes
  useEffect(() => {
    console.log('📊 Header Notification Count Debug:', {
      globalUnreadCount,
      localUnreadCount: headerNotificationsData?.data?.unreadCount,
      finalUnreadCount: unreadCount,
      isConnected: globalIsConnected,
      socketConnected,
      hasNotifications: notifications.length > 0
    });
  }, [globalUnreadCount, headerNotificationsData?.data?.unreadCount, unreadCount, globalIsConnected, socketConnected, notifications.length]);

  // Optimized updates - sync with global context
  useEffect(() => {
    if (globalUnreadCount !== undefined && globalUnreadCount !== headerNotificationsData?.data?.unreadCount) {
      console.log('🔄 Global context update: Refreshing header notifications');
      refetch();
    }
  }, [globalUnreadCount, headerNotificationsData?.data?.unreadCount, refetch]);

  // Mark notification as read mutation
  const markReadMutation = useMarkHeaderNotificationsAsRead();

  // Auto-refresh notifications every 30 seconds when dropdown is open
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, refetch]);

  // Detect new notifications and show indicator (using global context)
  useEffect(() => {
    if (unreadCount > prevUnreadCount && prevUnreadCount > 0) {
      console.log('📨 New notification detected in dropdown!');
      setShowNewNotificationIndicator(true);
      
      // Hide indicator after 3 seconds
      setTimeout(() => {
        setShowNewNotificationIndicator(false);
      }, 3000);
    }
    
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await markReadMutation.mutateAsync({ notificationIds: [notificationId] });
      // Optimistically update the UI
      if (notifications) {
        const updatedNotifications = notifications.map(n => 
          n.id === notificationId ? { ...n, status: 'read' as const } : n
        );
        // The mutation will trigger a refetch, but we can update optimistically
      }
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markReadMutation.mutateAsync({ markAllAsRead: true });
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'announcement':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 z-10 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
            <span className="text-xs text-white font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        {!globalIsConnected && (
          <span className="absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full bg-gray-400" title="Real-time notifications disconnected"></span>
        )}
        {showNewNotificationIndicator && (
          <span className="absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full bg-green-500 animate-pulse" title="New notification received!"></span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({unreadCount} unread)
              </span>
            )}
          </h5>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                refetch();
              }}
              className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title="Refresh notifications"
            >
              🔄
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, index) => (
              <li key={index}>
                <div className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 dark:border-gray-800">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 dark:bg-gray-700"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 dark:bg-gray-700"></div>
                  </div>
                </div>
              </li>
            ))
          ) : !notifications || notifications.length === 0 ? (
            <li>
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            </li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={() => {
                    if (notification.status === 'unread') {
                      handleNotificationClick(notification.id);
                    }
                    closeDropdown();
                  }}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    {notification.status === 'unread' && (
                      <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-blue-500 dark:border-gray-900"></span>
                    )}
                  </span>

                  <span className="block flex-1">
                    <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                      <span className={`font-medium ${
                        notification.status === 'unread' 
                          ? 'text-gray-800 dark:text-white/90' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </span>
                    </span>
                    <span className={`block text-theme-xs mb-1 ${
                      notification.status === 'unread' 
                        ? 'text-gray-700 dark:text-gray-200' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {notification.message.length > 60 
                        ? `${notification.message.substring(0, 60)}...` 
                        : notification.message
                      }
                    </span>
                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span className="capitalize">{notification.type}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatDate(notification.createdAt)}</span>
                      {notification.status === 'unread' && (
                        <>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">New</span>
                        </>
                      )}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        {notifications && notifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Showing {notifications.length} notifications
                {!globalIsConnected && !socketConnected && (
                  <span className="ml-2 text-orange-500">(offline)</span>
                )}
              </span>
              <button
                onClick={() => refetch()}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Refresh notifications"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </Dropdown>
    </div>
  );
}
