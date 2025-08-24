import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useReduxAuth } from './useReduxAuth';
import React from 'react';

interface UseSocketIOProps {
  enabled?: boolean;
}

export const useSocketIO = ({ enabled = true }: UseSocketIOProps = {}) => {
  const { user, tenant } = useReduxAuth();
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!enabled || !user?.id || socketRef.current?.connected) {
      return;
    }

    try {
      // Create Socket.io connection
      const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('🔌 Socket.io connected:', socket.id);
        isConnectedRef.current = true;

        // Join user room after connection
        socket.emit('join', {
          userId: user.id,
          userType: 'user',
          tenantId: user.tenantId || tenant?.id,
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason);
        isConnectedRef.current = false;
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Socket.io connection error:', error);
        isConnectedRef.current = false;
      });

      // Notification events
      socket.on('notification', (notification) => {
        console.log('📨 Received notification via Socket.io:', notification);
        
        // Show custom toast notification with title only and ring loader
        toast.custom((t) => {
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
            <div
              className={`${
                t.visible ? 'animate-custom-enter' : 'animate-custom-leave'
              } max-w-sm w-full bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-2xl rounded-2xl pointer-events-auto border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm`}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <span className="relative block w-full h-12 rounded-full z-1 max-w-12">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full flex items-center justify-center shadow-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="absolute inset-0 rounded-full border-3 border-blue-400 border-t-transparent animate-spin shadow-lg"></div>
                    <span className="absolute -bottom-1 -right-1 z-10 h-4 w-4 rounded-full border-2 border-white bg-gradient-to-r from-green-400 to-green-500 dark:border-gray-900 shadow-lg"></span>
                  </span>

                  <span className="block flex-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                      {notification.title}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {notification.type}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Just now
                      </span>
                    </div>
                  </span>

                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:scale-110 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        }, {
          duration: 6000,
          position: 'bottom-right',
        });

        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('notification-received', { 
          detail: notification 
        }));
      });

    } catch (error) {
      console.error('Failed to connect Socket.io:', error);
    }
  }, [enabled, user?.id, user?.tenantId, tenant?.id]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting Socket.io...');
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);

  // Connect on mount and user change
  useEffect(() => {
    if (enabled && user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user?.id, connect, disconnect]);

  // Reconnect when user/tenant changes
  useEffect(() => {
    if (enabled && user?.id && socketRef.current?.connected) {
      // Re-join with new user data
      socketRef.current.emit('join', {
        userId: user.id,
        userType: 'user',
        tenantId: user.tenantId || tenant?.id,
      });
    }
  }, [enabled, user?.id, user?.tenantId, tenant?.id]);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
  };
};
