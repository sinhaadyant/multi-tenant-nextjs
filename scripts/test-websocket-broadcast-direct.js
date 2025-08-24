const axios = require('axios');

async function testWebSocketBroadcastDirect() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing WebSocket Broadcasting Directly');
    console.log('========================================');

    // Step 1: Login as user and connect to WebSocket
    console.log('\n1. Logging in and connecting to WebSocket...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = loginResponse.data.data.user;
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);
    console.log('🏢 Tenant ID:', userData.tenant?.id);

    // Step 2: Connect to WebSocket
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
        console.log('✅ WebSocket connected successfully');
        console.log('🔗 Socket ID:', socket.id);
        resolve();
      });
    });

    // Step 3: Join rooms
    console.log('\n2. Joining rooms...');
    socket.emit('join_user_room', { userId: userData.id });
    socket.emit('join_tenant_room', { tenantId: userData.tenant?.id });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Listen for events
    console.log('\n3. Setting up event listeners...');
    let eventsReceived = [];

    socket.on('new_notification', (data) => {
      console.log('📨 Received new_notification:', data);
      eventsReceived.push({ type: 'new_notification', data });
    });

    socket.on('notification_count_update', (data) => {
      console.log('📊 Received notification_count_update:', data);
      eventsReceived.push({ type: 'notification_count_update', data });
    });

    // Step 5: Test direct WebSocket broadcast
    console.log('\n4. Testing direct WebSocket broadcast...');
    
    // Create a test notification object
    const testNotification = {
      id: 'test-notification-' + Date.now(),
      title: 'Direct WebSocket Test',
      message: 'This is a direct WebSocket broadcast test.',
      type: 'info',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      }
    };

    // Try to emit directly to the user's room
    console.log('📤 Emitting directly to user room...');
    socket.emit('test_notification', testNotification);

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 6: Check results
    console.log('\n5. Results:');
    console.log('📋 Total events received:', eventsReceived.length);
    
    if (eventsReceived.length === 0) {
      console.log('❌ No WebSocket events received!');
      console.log('\n🔍 This confirms the issue is with the WebSocket broadcasting.');
      console.log('   The WebSocket connection is working, but events are not being sent.');
    } else {
      eventsReceived.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type}:`, event.data);
      });
    }

    // Step 7: Test server-side broadcast
    console.log('\n6. Testing server-side broadcast...');
    try {
      // Login as superadmin
      const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: 'sinhaadyant74@gmail.com',
        password: 'password123'
      });

      const superadminToken = superadminLoginResponse.data.data.token;

      // Send notification via API (this should trigger WebSocket broadcast)
      const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
        title: 'Server-Side Broadcast Test',
        message: 'This notification should trigger WebSocket broadcast from the server.',
        type: 'info',
        priority: 'medium',
        targetType: 'specific_users',
        targetUserIds: [userData.id],
        status: 'sent'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      console.log('✅ Server-side notification sent successfully');
      console.log('📨 Notification ID:', notificationResponse.data.data.notification.id);

      // Wait for WebSocket events
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('\n7. Final Results:');
      console.log('📋 Total events received:', eventsReceived.length);
      
      if (eventsReceived.length === 0) {
        console.log('❌ Still no WebSocket events received!');
        console.log('\n🚨 ISSUE CONFIRMED: WebSocket broadcasting is not working.');
        console.log('   The server is not calling the broadcast method or the method is not working.');
      } else {
        eventsReceived.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.type}:`, event.data);
        });
      }

    } catch (error) {
      console.error('❌ Failed to send server-side notification:', error.message);
    }

    // Cleanup
    socket.disconnect();
    
    console.log('\n🎉 Direct WebSocket broadcast test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWebSocketBroadcastDirect();
