const axios = require('axios');

async function testBrowserWebSocket() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing Browser WebSocket Connection');
    console.log('=====================================');

    // Step 1: Login as user to get credentials
    console.log('\n1. Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = loginResponse.data.data.user;
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);
    console.log('🏢 Tenant ID:', userData.tenant?.id);

    // Step 2: Test WebSocket connection with the same credentials
    console.log('\n2. Testing WebSocket connection...');
    const { io } = require('socket.io-client');
    
    const socket = io(BASE_URL, {
      path: '/api/websocket',
      transports: ['websocket', 'polling'],
      auth: {
        userId: userData.id,
        userType: 'user',
        tenantId: userData.tenant?.id
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
    socket.on('new_notification', (data) => {
      console.log('📨 Received new_notification:', data);
    });

    socket.on('notification_count_update', (data) => {
      console.log('📊 Received notification_count_update:', data);
    });

    socket.on('notification', (data) => {
      console.log('📨 Received notification:', data);
    });

    // Test room joining
    setTimeout(() => {
      console.log('\n3. Joining user room...');
      socket.emit('join_user_room', { userId: userData.id });
    }, 1000);

    setTimeout(() => {
      console.log('🏢 Joining tenant room...');
      socket.emit('join_tenant_room', { tenantId: userData.tenant?.id });
    }, 2000);

    // Step 3: Send a test notification to this user
    setTimeout(async () => {
      console.log('\n4. Sending test notification...');
      try {
        // Login as superadmin
        const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
          email: 'sinhaadyant74@gmail.com',
          password: 'password123'
        });

        const superadminToken = superadminLoginResponse.data.data.token;

        // Send notification
        const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
          title: 'Browser WebSocket Test',
          message: 'This notification should trigger WebSocket events in the browser.',
          type: 'info',
          priority: 'medium',
          targetType: 'specific_users',
          targetUserIds: [userData.id],
          status: 'sent'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });

        console.log('✅ Test notification sent successfully');
        console.log('📨 Notification ID:', notificationResponse.data.data.notification.id);
      } catch (error) {
        console.error('❌ Failed to send test notification:', error.message);
      }
    }, 3000);

    // Keep connection alive for 10 seconds
    setTimeout(() => {
      console.log('\n5. Test completed, disconnecting...');
      socket.disconnect();
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testBrowserWebSocket();
