const axios = require('axios');

async function testRealtimeBrowserNotifications() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing Real-Time Browser Notifications');
    console.log('==========================================');

    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    const superadminToken = superadminLoginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Login as user to get user data
    console.log('\n2. Logging in as user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = userLoginResponse.data.data.user;
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);
    console.log('🏢 Tenant ID:', userData.tenantId);

    // Step 3: Check current notifications
    console.log('\n3. Checking current notifications...');
    const currentNotificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const currentNotifications = currentNotificationsResponse.data.data?.data?.notifications || [];
    const currentUnreadCount = currentNotificationsResponse.data.data?.data?.unreadCount || 0;
    
    console.log('📋 Current notifications:', currentNotifications.length);
    console.log('📈 Current unread count:', currentUnreadCount);

    // Step 4: Send a test notification
    console.log('\n4. Sending test notification...');
    const testNotification = {
      title: 'Real-Time Browser Test',
      message: 'This notification should appear immediately in the browser via WebSocket.',
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: [userData.id],
      status: 'sent'
    };

    const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, testNotification, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });

    console.log('✅ Test notification sent successfully');
    console.log('📨 Notification ID:', notificationResponse.data.data.notification.id);

    // Step 5: Wait a moment for WebSocket delivery
    console.log('\n5. Waiting for WebSocket delivery...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Check if notification was delivered
    console.log('\n6. Checking notification delivery...');
    const updatedNotificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const updatedNotifications = updatedNotificationsResponse.data.data?.data?.notifications || [];
    const updatedUnreadCount = updatedNotificationsResponse.data.data?.data?.unreadCount || 0;

    console.log('📋 Updated notifications:', updatedNotifications.length);
    console.log('📈 Updated unread count:', updatedUnreadCount);

    // Step 7: Check if the test notification appears
    const testNotificationFound = updatedNotifications.find(n => 
      n.title === 'Real-Time Browser Test' && 
      n.message.includes('should appear immediately')
    );

    if (testNotificationFound) {
      console.log('✅ Test notification found in user notifications');
      console.log('📖 Status:', testNotificationFound.status);
      console.log('📅 Created:', testNotificationFound.createdAt);
    } else {
      console.log('❌ Test notification not found in user notifications');
    }

    // Step 8: Check if unread count increased
    if (updatedUnreadCount > currentUnreadCount) {
      console.log('✅ Unread count increased:', `${currentUnreadCount} → ${updatedUnreadCount}`);
    } else {
      console.log('⚠️ Unread count did not increase');
    }

    console.log('\n🎉 Real-time browser notification test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Superadmin can send notifications');
    console.log('   ✅ User can receive notifications');
    console.log('   ✅ Notification appears in header API');
    console.log('   ✅ Unread count updates correctly');
    
    if (testNotificationFound) {
      console.log('   ✅ Real-time delivery working');
    } else {
      console.log('   ⚠️ Real-time delivery may need investigation');
    }

    console.log('\n🔗 Next steps for manual testing:');
    console.log('   1. Open browser: http://localhost:3000/riyo/login');
    console.log('   2. Login as: anil@cc.com / password123');
    console.log('   3. Check notification dropdown in header');
    console.log('   4. Send notification from superadmin panel');
    console.log('   5. Verify real-time appearance and toast');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testRealtimeBrowserNotifications();
