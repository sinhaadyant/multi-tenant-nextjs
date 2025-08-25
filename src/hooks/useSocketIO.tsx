import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useReduxAuth } from './useReduxAuth';
import React from 'react';

interface UseSocketIOProps {
  enabled?: boolean;
}

interface AuthUser {
  id?: string;
  tenantId?: string;
}

export const useSocketIO = ({ enabled = true }: UseSocketIOProps = {}) => {
  const { user, tenant } = useReduxAuth() as { user: AuthUser | null; tenant: { id?: string } | null };
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
          userId: user.id!,
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
        
        // Show custom toast notification
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-custom-enter' : 'animate-custom-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 8000,
          position: 'top-right',
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
        userId: user.id!,
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
