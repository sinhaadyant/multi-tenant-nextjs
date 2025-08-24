const { io } = require('socket.io-client');

async function testWebSocketConnection() {
  console.log('🔌 Testing WebSocket Connection');
  console.log('==============================');

  try {
    // Create socket connection
    const socket = io('http://localhost:3000', {
      path: '/api/websocket',
      transports: ['websocket', 'polling'],
      auth: {
        userId: 'test-user-id',
        userType: 'user',
        tenantId: 'test-tenant-id'
      }
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      console.log('🔗 Socket ID:', socket.id);
      console.log('🌐 Transport:', socket.io.engine.transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
    });

    // Listen for notifications
    socket.on('notification', (data) => {
      console.log('📨 Received notification:', data);
    });

    socket.on('notification_count_update', (data) => {
      console.log('📊 Notification count update:', data);
    });

    // Test room joining
    setTimeout(() => {
      console.log('👤 Joining user room...');
      socket.emit('join_user_room', { userId: 'test-user-id' });
    }, 1000);

    setTimeout(() => {
      console.log('🏢 Joining tenant room...');
      socket.emit('join_tenant_room', { tenantId: 'test-tenant-id' });
    }, 2000);

    // Keep connection alive for 10 seconds
    setTimeout(() => {
      console.log('🔌 Disconnecting...');
      socket.disconnect();
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error('❌ WebSocket test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWebSocketConnection();

