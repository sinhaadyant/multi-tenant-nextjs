'use client';

import React from 'react';
import { useGlobalNotifications } from '@/context/GlobalNotificationContext';

interface GlobalNotificationBadgeProps {
  className?: string;
  showCount?: boolean;
}

export const GlobalNotificationBadge: React.FC<GlobalNotificationBadgeProps> = ({ 
  className = '', 
  showCount = true 
}) => {
  const { unreadCount, isConnected } = useGlobalNotifications();

  if (!isConnected) {
    return null; // Don't show badge if not connected
  }

  return (
    <div className={`relative ${className}`}>
      {showCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {!isConnected && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gray-400" title="Real-time notifications disconnected"></span>
      )}
    </div>
  );
};
