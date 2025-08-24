const axios = require('axios');

async function testWebSocketBroadcasting() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing WebSocket Broadcasting');
    console.log('================================');

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

    // Step 2: Test WebSocket connection and listen for events
    console.log('\n2. Setting up WebSocket connection...');
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

    let eventsReceived = [];

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      console.log('🔗 Socket ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
    });

    // Listen for all notification events
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

    // Wait for connection
    await new Promise(resolve => {
      socket.on('connect', resolve);
      setTimeout(resolve, 2000);
    });

    // Step 3: Join rooms
    console.log('\n3. Joining rooms...');
    socket.emit('join_user_room', { userId: userData.id });
    socket.emit('join_tenant_room', { tenantId: userData.tenant?.id });

    // Wait a bit for room joining
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Send a test notification via API
    console.log('\n4. Sending test notification via API...');
    try {
      // Login as superadmin
      const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: 'sinhaadyant74@gmail.com',
        password: 'password123'
      });

      const superadminToken = superadminLoginResponse.data.data.token;

      // Send notification
      const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
        title: 'WebSocket Broadcasting Test',
        message: 'This notification should trigger WebSocket events.',
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

    // Step 5: Wait for events and check results
    console.log('\n5. Waiting for WebSocket events...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 6: Check results
    console.log('\n6. Results:');
    console.log('📋 Total events received:', eventsReceived.length);
    
    if (eventsReceived.length === 0) {
      console.log('❌ No WebSocket events received!');
      console.log('🔍 This indicates the WebSocket broadcasting is not working.');
    } else {
      eventsReceived.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type}:`, event.data);
      });
    }

    // Step 7: Check if notification was delivered via API
    console.log('\n7. Checking notification delivery via API...');
    try {
      const headerNotificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
        headers: { 'X-User-Email': USER_EMAIL }
      });

      const notifications = headerNotificationsResponse.data.data?.data?.notifications || [];
      const unreadCount = headerNotificationsResponse.data.data?.data?.unreadCount || 0;

      console.log('✅ Header notifications API working');
      console.log('📋 Total notifications:', notifications.length);
      console.log('📈 Unread notifications:', unreadCount);

      // Check if our test notification is there
      const testNotification = notifications.find(n => 
        n.title === 'WebSocket Broadcasting Test'
      );

      if (testNotification) {
        console.log('✅ Test notification found in API response');
        console.log('📖 Status:', testNotification.status);
      } else {
        console.log('❌ Test notification not found in API response');
      }
    } catch (error) {
      console.error('❌ Failed to check header notifications:', error.message);
    }

    // Cleanup
    socket.disconnect();
    
    console.log('\n🎉 WebSocket broadcasting test completed!');
    
    if (eventsReceived.length === 0) {
      console.log('\n🚨 ISSUE DETECTED: WebSocket events are not being received!');
      console.log('   This means the real-time delivery is not working.');
      console.log('   The notification is being created but not broadcasted via WebSocket.');
    } else {
      console.log('\n✅ WebSocket broadcasting is working correctly!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testWebSocketBroadcasting();
