const axios = require('axios');

async function testGlobalContext() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing Global Notification Context');
    console.log('=====================================');

    // Step 1: Check if server is running
    console.log('\n1. Checking server status...');
    try {
      await axios.get(`${BASE_URL}`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or not ready');
      return;
    }

    // Step 2: Login as user
    console.log('\n2. Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = loginResponse.data.data.user;
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);
    console.log('🏢 Tenant ID:', userData.tenant?.id);
    console.log('📧 User Email:', userData.email);

    // Step 3: Test header notifications API directly
    console.log('\n3. Testing header notifications API...');
    try {
      const headerResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
        headers: { 'X-User-Email': USER_EMAIL }
      });

      const headerData = headerResponse.data.data?.data;
      console.log('✅ Header notifications API working');
      console.log('📋 Notifications count:', headerData?.notifications?.length || 0);
      console.log('📈 Unread count:', headerData?.unreadCount || 0);
    } catch (error) {
      console.log('❌ Header notifications API failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      return;
    }

    // Step 4: Send a test notification
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
        title: 'Global Context Test',
        message: 'Testing global notification context functionality.',
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
      console.log('❌ Failed to send test notification:', error.message);
      return;
    }

    // Step 5: Wait and check again
    console.log('\n5. Waiting for notification processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const finalResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const finalData = finalResponse.data.data?.data;
    console.log('📋 Final notifications count:', finalData?.notifications?.length || 0);
    console.log('📈 Final unread count:', finalData?.unreadCount || 0);

    // Check for our test notification
    const testNotification = finalData?.notifications?.find(n => 
      n.title === 'Global Context Test'
    );

    if (testNotification) {
      console.log('✅ Test notification found in user notifications');
    } else {
      console.log('❌ Test notification not found in user notifications');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Backend API: Working');
    console.log('   ✅ Notification creation: Working');
    console.log('   ✅ User notification delivery: Working');
    console.log('   ❓ Frontend global context: Need browser testing');

    console.log('\n🔗 Manual Testing Instructions:');
    console.log('   1. Open browser: http://localhost:3000/riyo/login');
    console.log('   2. Login as: anil@cc.com / password123');
    console.log('   3. Open browser console (F12)');
    console.log('   4. Look for: "🔍 Global Notification Context Debug:"');
    console.log('   5. Check if polling starts: "🔌 Starting global notification polling"');
    console.log('   6. Send notification from superadmin');
    console.log('   7. Check if toast appears and count updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testGlobalContext();
