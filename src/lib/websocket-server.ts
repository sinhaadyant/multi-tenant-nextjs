import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from './prisma';

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

class NotificationWebSocketServer {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map(); // userId -> socket
  private userRooms = new Map(); // userId -> Set of room names
  private tenantRooms = new Map(); // tenantId -> Set of user IDs
  private superAdminRooms = new Set(); // Set of superadmin user IDs

  initialize(httpServer: NetServer) {
    this.io = new SocketIOServer(httpServer, {
      path: '/api/websocket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('🔌 WebSocket server initialized');
  }

  private setupMiddleware() {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const auth = socket.handshake.auth;
        
        if (!auth.userId || !auth.userType) {
          return next(new Error('Authentication failed: Missing user info'));
        }

        // Verify user exists in database
        if (auth.userType === 'superadmin') {
          const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: auth.userId }
          });
          
          if (!superAdmin || !superAdmin.isActive) {
            return next(new Error('Authentication failed: Invalid superadmin'));
          }
        } else if (auth.userType === 'user') {
          const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            include: { tenant: true }
          });
          
          if (!user || !user.isActive) {
            return next(new Error('Authentication failed: Invalid user'));
          }
          
          // Add tenant info to socket
          socket.tenantId = user.tenantId;
        }

        // Store user info in socket
        socket.userId = auth.userId;
        socket.userType = auth.userType;
        
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userId} (${socket.userType})`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, socket);
      
      // Join default rooms based on user type
      if (socket.userType === 'superadmin') {
        this.joinSuperAdminRoom(socket.userId);
      } else if (socket.userType === 'user' && socket.tenantId) {
        this.joinUserRoom(socket.userId);
        this.joinTenantRoom(socket.userId, socket.tenantId);
      }

      // Handle room joining
      socket.on('join_user_room', (data) => {
        this.joinUserRoom(data.userId);
      });

      socket.on('join_tenant_room', (data) => {
        this.joinTenantRoom(socket.userId, data.tenantId);
      });

      socket.on('join_superadmin_room', () => {
        this.joinSuperAdminRoom(socket.userId);
      });

      // Handle room leaving
      socket.on('leave_user_room', (data) => {
        this.leaveUserRoom(data.userId);
      });

      socket.on('leave_tenant_room', (data) => {
        this.leaveTenantRoom(socket.userId, data.tenantId);
      });

      socket.on('leave_superadmin_room', () => {
        this.leaveSuperAdminRoom(socket.userId);
      });

      // Handle notification read events
      socket.on('notification_read', async (data) => {
        try {
          await this.handleNotificationRead(socket.userId, data);
        } catch (error) {
          console.error('Error handling notification read:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
        this.handleUserDisconnect(socket.userId);
      });
    });
  }

  private joinUserRoom(userId: string) {
    const roomName = `user_${userId}`;
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.join(roomName);
      
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId).add(roomName);
      
      console.log(`👤 User ${userId} joined user room`);
    }
  }

  private joinTenantRoom(userId: string, tenantId: string) {
    const roomName = `tenant_${tenantId}`;
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.join(roomName);
      
      if (!this.tenantRooms.has(tenantId)) {
        this.tenantRooms.set(tenantId, new Set());
      }
      this.tenantRooms.get(tenantId).add(userId);
      
      console.log(`🏢 User ${userId} joined tenant room ${tenantId}`);
    }
  }

  private joinSuperAdminRoom(userId: string) {
    const roomName = 'superadmin_room';
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.join(roomName);
      this.superAdminRooms.add(userId);
      console.log(`👑 SuperAdmin ${userId} joined superadmin room`);
    }
  }

  private leaveUserRoom(userId: string) {
    const roomName = `user_${userId}`;
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.leave(roomName);
      
      if (this.userRooms.has(userId)) {
        this.userRooms.get(userId).delete(roomName);
      }
      
      console.log(`👤 User ${userId} left user room`);
    }
  }

  private leaveTenantRoom(userId: string, tenantId: string) {
    const roomName = `tenant_${tenantId}`;
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.leave(roomName);
      
      if (this.tenantRooms.has(tenantId)) {
        this.tenantRooms.get(tenantId).delete(userId);
      }
      
      console.log(`🏢 User ${userId} left tenant room ${tenantId}`);
    }
  }

  private leaveSuperAdminRoom(userId: string) {
    const roomName = 'superadmin_room';
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.leave(roomName);
      this.superAdminRooms.delete(userId);
      console.log(`👑 SuperAdmin ${userId} left superadmin room`);
    }
  }

  private handleUserDisconnect(userId: string) {
    // Remove from connected users
    this.connectedUsers.delete(userId);
    
    // Clean up rooms
    if (this.userRooms.has(userId)) {
      this.userRooms.delete(userId);
    }
    
    // Remove from tenant rooms
    for (const [tenantId, users] of this.tenantRooms.entries()) {
      users.delete(userId);
      if (users.size === 0) {
        this.tenantRooms.delete(tenantId);
      }
    }
    
    // Remove from superadmin rooms
    this.superAdminRooms.delete(userId);
  }

  private async handleNotificationRead(userId: string, data: any) {
    try {
      // Update notification read status in database
      if (data.notificationIds && Array.isArray(data.notificationIds)) {
        await prisma.userNotification.updateMany({
          where: {
            id: { in: data.notificationIds },
            userId: userId
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
      }

      // Emit count update to user
      const unreadCount = await prisma.userNotification.count({
        where: {
          userId: userId,
          isActive: true,
          isRead: false
        }
      });

      this.sendToUser(userId, 'notification_count_update', { unreadCount });
      
    } catch (error) {
      console.error('Error handling notification read:', error);
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      console.log(`📨 Sent ${event} to user ${userId}`);
    }
  }

  // Send notification to all users in a tenant
  sendToTenant(tenantId: string, event: string, data: any) {
    const roomName = `tenant_${tenantId}`;
    if (this.io) {
      this.io.to(roomName).emit(event, data);
      console.log(`📨 Sent ${event} to tenant ${tenantId}`);
    }
  }

  // Send notification to all superadmins
  sendToSuperAdmins(event: string, data: any) {
    const roomName = 'superadmin_room';
    if (this.io) {
      this.io.to(roomName).emit(event, data);
      console.log(`📨 Sent ${event} to all superadmins`);
    }
  }

  // Send notification to all connected users
  sendToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`📨 Sent ${event} to all users`);
    }
  }

  // Broadcast new notification
  async broadcastNotification(notification: NotificationSocketData, targetType: string, targetIds: string[] = []) {
    const notificationData = {
      type: 'new_notification',
      data: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt,
        createdBy: notification.createdBy
      },
      targetType,
      targetId: targetIds.length === 1 ? targetIds[0] : undefined
    };

    switch (targetType) {
      case 'user':
        // Send to specific users
        for (const userId of targetIds) {
          this.sendToUser(userId, 'notification', notificationData);
          
          // Update unread count
          const unreadCount = await prisma.userNotification.count({
            where: {
              userId: userId,
              isActive: true,
              isRead: false
            }
          });
          
          this.sendToUser(userId, 'notification_count_update', { unreadCount });
        }
        break;

      case 'tenant':
        // Send to all users in specific tenants
        for (const tenantId of targetIds) {
          this.sendToTenant(tenantId, 'notification', notificationData);
          
          // Update counts for all users in tenant
          const users = this.tenantRooms.get(tenantId) || new Set();
          for (const userId of users) {
            const unreadCount = await prisma.userNotification.count({
              where: {
                userId: userId,
                isActive: true,
                isRead: false
              }
            });
            
            this.sendToUser(userId, 'notification_count_update', { unreadCount });
          }
        }
        break;

      case 'superadmin':
        // Send to all superadmins
        this.sendToSuperAdmins('notification', notificationData);
        
        // Update counts for all superadmins
        for (const userId of this.superAdminRooms) {
          const unreadCount = await prisma.userNotification.count({
            where: {
              userId: userId,
              isActive: true,
              isRead: false
            }
          });
          
          this.sendToUser(userId, 'notification_count_update', { unreadCount });
        }
        break;

      case 'all':
        // Send to all connected users
        this.sendToAll('notification', notificationData);
        break;
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users by type
  getConnectedUsersByType(userType: string) {
    const users: string[] = [];
    for (const [userId, socket] of this.connectedUsers.entries()) {
      if (socket.userType === userType) {
        users.push(userId);
      }
    }
    return users;
  }
}

// Create singleton instance
const notificationServer = new NotificationWebSocketServer();

export default notificationServer;
