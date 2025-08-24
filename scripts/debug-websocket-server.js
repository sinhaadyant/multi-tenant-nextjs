const axios = require('axios');

async function debugWebSocketServer() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🔍 Debugging WebSocket Server');
    console.log('============================');

    // Step 1: Login and get user data
    console.log('\n1. Logging in and getting user data...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = loginResponse.data.data.user;
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);
    console.log('🏢 Tenant ID:', userData.tenant?.id);

    // Step 2: Check if WebSocket server is accessible (with authentication)
    console.log('\n2. Testing WebSocket server accessibility...');
    try {
      const { io } = require('socket.io-client');
      
      const socket = io(BASE_URL, {
        path: '/api/websocket',
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: {
          userId: userData.id,
          userType: 'user',
          tenantId: userData.tenant?.id
        }
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket server is accessible');
          console.log('🔗 Socket ID:', socket.id);
          socket.disconnect();
          resolve();
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.log('❌ WebSocket server connection error:', error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.log('❌ WebSocket server is not accessible:', error.message);
      return;
    }

    // Step 3: Connect with authentication
    console.log('\n3. Connecting with authentication...');
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

    await new Promise((resolve) => {
      socket.on('connect', () => {
        console.log('✅ Authenticated WebSocket connection successful');
        console.log('🔗 Socket ID:', socket.id);
        resolve();
      });

      socket.on('connect_error', (error) => {
        console.log('❌ Authentication failed:', error.message);
        resolve();
      });
    });

    // Step 4: Join rooms
    console.log('\n4. Joining rooms...');
    socket.emit('join_user_room', { userId: userData.id });
    socket.emit('join_tenant_room', { tenantId: userData.tenant?.id });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Send a test notification
    console.log('\n5. Sending test notification...');
    try {
      const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: 'sinhaadyant74@gmail.com',
        password: 'password123'
      });

      const superadminToken = superadminLoginResponse.data.data.token;

      const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
        title: 'WebSocket Server Debug Test',
        message: 'Testing WebSocket server broadcasting.',
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
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }

    // Step 6: Wait for events
    console.log('\n6. Waiting for WebSocket events...');
    let eventsReceived = [];

    socket.on('new_notification', (data) => {
      console.log('📨 Received new_notification:', data);
      eventsReceived.push({ type: 'new_notification', data });
    });

    socket.on('notification_count_update', (data) => {
      console.log('📊 Received notification_count_update:', data);
      eventsReceived.push({ type: 'notification_count_update', data });
    });

    socket.on('notification', (data) => {
      console.log('📨 Received notification:', data);
      eventsReceived.push({ type: 'notification', data });
    });

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 7: Check results
    console.log('\n7. Results:');
    console.log('📋 Total events received:', eventsReceived.length);
    
    if (eventsReceived.length === 0) {
      console.log('❌ No WebSocket events received!');
      console.log('\n🔍 Possible issues:');
      console.log('   1. WebSocket server not properly initialized');
      console.log('   2. Broadcasting method not being called');
      console.log('   3. Room joining not working');
      console.log('   4. Event names mismatch');
    } else {
      eventsReceived.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type}:`, event.data);
      });
    }

    // Cleanup
    socket.disconnect();
    
    console.log('\n🎉 WebSocket server debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugWebSocketServer();
