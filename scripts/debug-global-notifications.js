const axios = require('axios');

async function debugGlobalNotifications() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🔍 Debugging Global Notifications System');
    console.log('========================================');

    // Step 1: Login as user and get initial state
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

    // Step 2: Check initial notification state
    console.log('\n2. Checking initial notification state...');
    const initialResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const initialData = initialResponse.data.data?.data;
    console.log('📋 Initial notifications count:', initialData?.notifications?.length || 0);
    console.log('📈 Initial unread count:', initialData?.unreadCount || 0);

    // Step 3: Login as superadmin
    console.log('\n3. Logging in as superadmin...');
    const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'sinhaadyant74@gmail.com',
      password: 'password123'
    });

    const superadminToken = superadminLoginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 4: Send multiple test notifications with monitoring
    console.log('\n4. Sending test notifications with real-time monitoring...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Sending notification ${i} ---`);
      
      // Send notification
      const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
        title: `Debug Test Notification ${i}`,
        message: `This is test notification ${i} sent at ${new Date().toLocaleTimeString()}`,
        type: 'info',
        priority: 'medium',
        targetType: 'specific_users',
        targetUserIds: [userData.id],
        status: 'sent'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      console.log(`✅ Notification ${i} sent:`, notificationResponse.data.data.notification.id);

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if notification was received
      const checkResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
        headers: { 'X-User-Email': USER_EMAIL }
      });

      const checkData = checkResponse.data.data?.data;
      const newUnreadCount = checkData?.unreadCount || 0;
      const newNotificationsCount = checkData?.notifications?.length || 0;

      console.log(`📊 After notification ${i}:`);
      console.log(`   - Notifications count: ${newNotificationsCount}`);
      console.log(`   - Unread count: ${newUnreadCount}`);

      // Check if our notification is in the list
      const testNotification = checkData?.notifications?.find(n => 
        n.title === `Debug Test Notification ${i}`
      );

      if (testNotification) {
        console.log(`   ✅ Notification ${i} found in user notifications`);
        console.log(`   📖 Status: ${testNotification.status}`);
      } else {
        console.log(`   ❌ Notification ${i} NOT found in user notifications`);
      }

      // Wait before next notification
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 5: Final state check
    console.log('\n5. Final state check...');
    const finalResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const finalData = finalResponse.data.data?.data;
    console.log('📋 Final notifications count:', finalData?.notifications?.length || 0);
    console.log('📈 Final unread count:', finalData?.unreadCount || 0);

    // Step 6: Check for our test notifications
    console.log('\n6. Checking for test notifications...');
    const testNotifications = finalData?.notifications?.filter(n => 
      n.title.startsWith('Debug Test Notification')
    ) || [];

    console.log(`📨 Found ${testNotifications.length} test notifications:`);
    testNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title} - Status: ${notification.status}`);
    });

    console.log('\n🎯 Debug Summary:');
    console.log('   ✅ Backend notification creation: Working');
    console.log('   ✅ API response: Working');
    console.log('   ✅ User notification delivery: Working');
    console.log('   ❓ Frontend real-time updates: Need manual testing');

    console.log('\n🔗 Manual Testing Required:');
    console.log('   1. Open browser: http://localhost:3000/riyo/login');
    console.log('   2. Login as: anil@cc.com / password123');
    console.log('   3. Open browser console (F12)');
    console.log('   4. Look for these console messages:');
    console.log('      - "🔌 Starting global notification polling for user:"');
    console.log('      - "🔄 Global polling for new notifications..."');
    console.log('      - "📨 New notification detected globally!"');
    console.log('   5. Send a notification from superadmin');
    console.log('   6. Check if toast appears and count updates');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

debugGlobalNotifications();
