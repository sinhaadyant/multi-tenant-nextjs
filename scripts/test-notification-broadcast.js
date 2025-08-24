const { io } = require('socket.io-client');

// Test notification broadcasting
async function testNotificationBroadcast() {
  console.log('🧪 Testing notification broadcasting...');
  
  // Connect as a tenant user
  const userSocket = io('http://localhost:3000', {
    path: '/api/websocket',
    auth: {
      userId: 'test-user-id',
      userType: 'user',
      tenantId: 'test-tenant-id'
    },
    transports: ['websocket', 'polling']
  });

  // Connect as a superadmin
  const superAdminSocket = io('http://localhost:3000', {
    path: '/api/websocket',
    auth: {
      userId: 'test-superadmin-id',
      userType: 'superadmin'
    },
    transports: ['websocket', 'polling']
  });

  // Set up event listeners
  userSocket.on('connect', () => {
    console.log('✅ User connected');
  });

  superAdminSocket.on('connect', () => {
    console.log('✅ SuperAdmin connected');
  });

  userSocket.on('notification', (data) => {
    console.log('📨 User received notification:', data);
  });

  superAdminSocket.on('notification', (data) => {
    console.log('📨 SuperAdmin received notification:', data);
  });

  userSocket.on('notification_count_update', (data) => {
    console.log('📊 User count updated:', data);
  });

  superAdminSocket.on('notification_count_update', (data) => {
    console.log('📊 SuperAdmin count updated:', data);
  });

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate sending a notification via API
  console.log('📤 Simulating notification send...');
  
  try {
    const response = await fetch('http://localhost:3000/api/superadmin/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        title: 'Test Notification',
        message: 'This is a test notification from the WebSocket system',
        type: 'info',
        priority: 'medium',
        targetType: 'all',
        status: 'sent'
      })
    });

    if (response.ok) {
      console.log('✅ Notification sent successfully');
    } else {
      console.log('❌ Failed to send notification:', response.status);
    }
  } catch (error) {
    console.log('❌ Error sending notification:', error.message);
  }

  // Wait for notifications to be received
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Cleanup
  console.log('🧹 Cleaning up...');
  userSocket.disconnect();
  superAdminSocket.disconnect();
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Run the test
testNotificationBroadcast().catch(console.error);
