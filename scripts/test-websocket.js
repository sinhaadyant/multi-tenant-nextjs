const { io } = require('socket.io-client');

// Test WebSocket connection
async function testWebSocket() {
  console.log('🧪 Testing WebSocket connection...');
  
  const socket = io('http://localhost:3000', {
    path: '/api/websocket',
    auth: {
      userId: 'test-user-id',
      userType: 'user',
      tenantId: 'test-tenant-id'
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected successfully');
    console.log('Socket ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.log('❌ WebSocket connection error:', error.message);
  });

  socket.on('notification', (data) => {
    console.log('📨 Received notification:', data);
  });

  socket.on('notification_count_update', (data) => {
    console.log('📊 Notification count updated:', data);
  });

  // Test room joining
  setTimeout(() => {
    console.log('🔗 Joining test rooms...');
    socket.emit('join_user_room', { userId: 'test-user-id' });
    socket.emit('join_tenant_room', { tenantId: 'test-tenant-id' });
  }, 1000);

  // Test notification read
  setTimeout(() => {
    console.log('📖 Testing notification read...');
    socket.emit('notification_read', {
      notificationIds: ['test-notification-id']
    });
  }, 2000);

  // Cleanup after 5 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
}

// Test superadmin connection
async function testSuperAdminWebSocket() {
  console.log('🧪 Testing SuperAdmin WebSocket connection...');
  
  const socket = io('http://localhost:3000', {
    path: '/api/websocket',
    auth: {
      userId: 'test-superadmin-id',
      userType: 'superadmin'
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ SuperAdmin WebSocket connected successfully');
    console.log('Socket ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ SuperAdmin WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.log('❌ SuperAdmin WebSocket connection error:', error.message);
  });

  socket.on('notification', (data) => {
    console.log('📨 SuperAdmin received notification:', data);
  });

  // Test superadmin room joining
  setTimeout(() => {
    console.log('🔗 Joining superadmin room...');
    socket.emit('join_superadmin_room', {});
  }, 1000);

  // Cleanup after 3 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up SuperAdmin connection...');
    socket.disconnect();
  }, 3000);
}

// Run tests
async function runTests() {
  console.log('🚀 Starting WebSocket tests...\n');
  
  try {
    await testWebSocket();
    await testSuperAdminWebSocket();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Check if WebSocket server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    console.log('✅ Next.js server is running');
    return true;
  } catch (error) {
    console.log('❌ Next.js server is not running on port 3000');
    console.log('Please start the server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
}

main();
