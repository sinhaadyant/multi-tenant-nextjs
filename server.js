const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io server
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Store connected users
  const connectedUsers = new Map(); // userId -> socket

  // Handle user connections
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Handle user authentication and room joining
    socket.on('join', (data) => {
      const { userId, userType, tenantId } = data;
      
      console.log(`🔌 User ${userId} (${userType}) joining room`);
      
      // Store user info
      socket.userId = userId;
      socket.userType = userType;
      socket.tenantId = tenantId;
      
      // Join user-specific room
      socket.join(`user_${userId}`);
      
      // Join tenant room if applicable
      if (tenantId) {
        socket.join(`tenant_${tenantId}`);
      }
      
      // Join superadmin room if applicable
      if (userType === 'superadmin') {
        socket.join('superadmin_room');
      }
      
      // Store connected user
      connectedUsers.set(userId, socket);
      
      console.log(`✅ User ${userId} joined rooms successfully`);
      console.log(`📊 Connected users: ${connectedUsers.size}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`🔌 User ${socket.userId} disconnected`);
        connectedUsers.delete(socket.userId);
        console.log(`📊 Connected users: ${connectedUsers.size}`);
      }
    });
  });

  // Create sendNotification function
  const sendNotification = (targetType, targetIds, notificationData) => {
    console.log(`📨 Sending notification to ${targetType}:`, targetIds);
    
    switch (targetType) {
      case 'user':
        targetIds.forEach(userId => {
          const userSocket = connectedUsers.get(userId);
          if (userSocket) {
            userSocket.emit('notification', notificationData);
            console.log(`✅ Notification sent to user ${userId}`);
          } else {
            console.log(`⚠️ User ${userId} not connected`);
          }
        });
        break;
        
      case 'tenant':
        targetIds.forEach(tenantId => {
          io.to(`tenant_${tenantId}`).emit('notification', notificationData);
          console.log(`✅ Notification sent to tenant ${tenantId}`);
        });
        break;
        
      case 'superadmin':
        io.to('superadmin_room').emit('notification', notificationData);
        console.log(`✅ Notification sent to superadmins`);
        break;
        
      case 'all':
        io.emit('notification', notificationData);
        console.log(`✅ Notification sent to all users`);
        break;
        
      default:
        console.log(`❌ Unknown target type: ${targetType}`);
    }
  };

  // Make sendNotification available globally
  global.sendNotification = sendNotification;
  global.connectedUsers = connectedUsers;

  console.log('✅ Socket.io server initialized successfully');
  console.log('🔌 WebSocket server integrated with Next.js');

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
