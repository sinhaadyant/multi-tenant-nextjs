import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

export interface NotificationSocketData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SocketNotificationEvent {
  type: 'new_notification' | 'notification_read' | 'notification_count_update';
  data: NotificationSocketData | { unreadCount: number } | any;
  targetType: 'user' | 'superadmin' | 'tenant' | 'all';
  targetId?: string;
}

class NotificationSocket {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      // Use the same URL as the Next.js app since WebSocket is integrated
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      this.socket = io(baseUrl, {
        path: '/api/websocket',
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000, // Reduced timeout
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('socket_connected', { timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Notification events
    this.socket.on('new_notification', (data: NotificationSocketData) => {
      console.log('📨 Received new_notification:', data);
      this.emit('new_notification', data);
    });

    this.socket.on('notification', (data: SocketNotificationEvent) => {
      console.log('📨 Received notification:', data);
      this.handleNotification(data);
    });

    this.socket.on('notification_count_update', (data: { unreadCount: number }) => {
      console.log('📊 Notification count updated:', data);
      this.emit('notification_count_update', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🔌 WebSocket error:', error);
    });
  }

  private handleNotification(data: SocketNotificationEvent) {
    switch (data.type) {
      case 'new_notification':
        this.handleNewNotification(data.data as NotificationSocketData);
        break;
      case 'notification_read':
        this.emit('notification_read', data.data);
        break;
      case 'notification_count_update':
        this.emit('notification_count_update', data.data);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  private handleNewNotification(notification: NotificationSocketData) {
    // Show toast notification with simple text for now
    const message = notification.message.length > 100 
      ? `${notification.message.substring(0, 100)}...` 
      : notification.message;

    toast.success(`${notification.title}: ${message}`, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#fff',
        color: '#333',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    });

    // Emit event for components to handle
    this.emit('new_notification', notification);
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'announcement':
        return '📢';
      default:
        return 'ℹ️';
    }
  }

  // Public methods
  public connect(userId: string, userType: 'user' | 'superadmin', tenantId?: string) {
    if (!this.socket) {
      this.initializeSocket();
    }

    if (this.socket && !this.isConnected) {
      this.socket.auth = {
        userId,
        userType,
        tenantId,
      };
      
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  public emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // Also listen to socket events
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      this.eventListeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Join specific rooms
  public joinUserRoom(userId: string) {
    this.emit('join_user_room', { userId });
  }

  public joinTenantRoom(tenantId: string) {
    this.emit('join_tenant_room', { tenantId });
  }

  public joinSuperAdminRoom() {
    this.emit('join_superadmin_room', {});
  }

  // Leave rooms
  public leaveUserRoom(userId: string) {
    this.emit('leave_user_room', { userId });
  }

  public leaveTenantRoom(tenantId: string) {
    this.emit('leave_tenant_room', { tenantId });
  }

  public leaveSuperAdminRoom() {
    this.emit('leave_superadmin_room', {});
  }
}

// Create singleton instance
const notificationSocket = new NotificationSocket();

export default notificationSocket;
