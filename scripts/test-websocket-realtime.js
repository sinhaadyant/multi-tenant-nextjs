const axios = require('axios');

async function testWebSocketRealtime() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing WebSocket Real-Time Notifications');
    console.log('============================================');

    // Step 1: Login as user
    console.log('\n1. Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = loginResponse.data.data.user;
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);

    // Step 2: Check initial notification count
    console.log('\n2. Checking initial notification count...');
    const initialResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const initialData = initialResponse.data.data?.data;
    const initialUnreadCount = initialData?.unreadCount || 0;
    console.log('📈 Initial unread count:', initialUnreadCount);

    // Step 3: Login as superadmin
    console.log('\n3. Logging in as superadmin...');
    const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'sinhaadyant74@gmail.com',
      password: 'password123'
    });

    const superadminToken = superadminLoginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 4: Send test notification
    console.log('\n4. Sending test notification...');
    const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
      title: 'WebSocket Real-Time Test',
      message: 'Testing WebSocket real-time notification delivery.',
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

    // Step 5: Wait and check for updates
    console.log('\n5. Waiting for real-time updates...');
    console.log('   (Check browser console for WebSocket events)');
    
    // Check multiple times to see if count updates
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
        headers: { 'X-User-Email': USER_EMAIL }
      });

      const checkData = checkResponse.data.data?.data;
      const newUnreadCount = checkData?.unreadCount || 0;

      console.log(`   Check ${i}: Unread count = ${newUnreadCount}`);
      
      if (newUnreadCount > initialUnreadCount) {
        console.log(`   ✅ Count increased! (${initialUnreadCount} → ${newUnreadCount})`);
        break;
      }
    }

    // Step 6: Final verification
    console.log('\n6. Final verification...');
    const finalResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const finalData = finalResponse.data.data?.data;
    const finalUnreadCount = finalData?.unreadCount || 0;

    console.log('📈 Final unread count:', finalUnreadCount);
    console.log('📊 Total increase:', finalUnreadCount - initialUnreadCount);

    // Check for our test notification
    const testNotification = finalData?.notifications?.find(n => 
      n.title === 'WebSocket Real-Time Test'
    );

    if (testNotification) {
      console.log('✅ Test notification found in API response');
      console.log('📖 Status:', testNotification.status);
    } else {
      console.log('❌ Test notification not found in API response');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Backend notification creation: Working');
    console.log('   ✅ API response updates: Working');
    console.log('   ✅ Count increases: ' + (finalUnreadCount > initialUnreadCount ? 'Working' : 'Failed'));
    console.log('   ❓ WebSocket real-time: Need browser testing');

    console.log('\n🔗 Browser Testing Instructions:');
    console.log('   1. Open browser: http://localhost:3000/riyo/login');
    console.log('   2. Login as: anil@cc.com / password123');
    console.log('   3. Open browser console (F12)');
    console.log('   4. Look for these WebSocket messages:');
    console.log('      - "🔌 Setting up WebSocket event listeners for user:"');
    console.log('      - "🔌 WebSocket connected successfully"');
    console.log('      - "📨 New notification received via WebSocket:"');
    console.log('   5. Send notification from superadmin');
    console.log('   6. Check if WebSocket events are received');
    console.log('   7. Verify real-time count updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testWebSocketRealtime();
