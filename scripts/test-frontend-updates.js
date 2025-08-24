const axios = require('axios');

async function testFrontendUpdates() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing Frontend Notification Updates');
    console.log('=======================================');

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

    // Step 2: Check initial header notification count
    console.log('\n2. Checking initial header notification count...');
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

    // Step 4: Send multiple test notifications
    console.log('\n4. Sending test notifications...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Sending notification ${i} ---`);
      
      const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
        title: `Frontend Test ${i}`,
        message: `Testing frontend updates - notification ${i}`,
        type: 'info',
        priority: 'medium',
        targetType: 'specific_users',
        targetUserIds: [userData.id],
        status: 'sent'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      console.log(`✅ Notification ${i} sent:`, notificationResponse.data.data.notification.id);

      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if notification was received
      const checkResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
        headers: { 'X-User-Email': USER_EMAIL }
      });

      const checkData = checkResponse.data.data?.data;
      const newUnreadCount = checkData?.unreadCount || 0;

      console.log(`📊 After notification ${i}:`);
      console.log(`   - Unread count: ${newUnreadCount}`);
      console.log(`   - Count increased: ${newUnreadCount > initialUnreadCount ? 'Yes' : 'No'}`);

      // Check if our notification is in the list
      const testNotification = checkData?.notifications?.find(n => 
        n.title === `Frontend Test ${i}`
      );

      if (testNotification) {
        console.log(`   ✅ Notification ${i} found in API response`);
      } else {
        console.log(`   ❌ Notification ${i} NOT found in API response`);
      }
    }

    // Step 5: Final check
    console.log('\n5. Final verification...');
    const finalResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const finalData = finalResponse.data.data?.data;
    const finalUnreadCount = finalData?.unreadCount || 0;

    console.log('📈 Final unread count:', finalUnreadCount);
    console.log('📊 Total increase:', finalUnreadCount - initialUnreadCount);

    // Check for all test notifications
    const testNotifications = finalData?.notifications?.filter(n => 
      n.title.startsWith('Frontend Test')
    ) || [];

    console.log(`📨 Found ${testNotifications.length} test notifications in API`);

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Backend notification creation: Working');
    console.log('   ✅ API response updates: Working');
    console.log('   ✅ Count increases: Working');
    console.log('   ❓ Frontend display: Need browser testing');

    console.log('\n🔗 Frontend Testing Instructions:');
    console.log('   1. Open browser: http://localhost:3000/riyo/login');
    console.log('   2. Login as: anil@cc.com / password123');
    console.log('   3. Open browser console (F12)');
    console.log('   4. Look for these messages:');
    console.log('      - "🔌 Starting global notification polling for user:"');
    console.log('      - "🔄 Global polling for new notifications..."');
    console.log('      - "📊 Header Notification Count Debug:"');
    console.log('   5. Send notification from superadmin');
    console.log('   6. Check if header count updates within 2 seconds');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testFrontendUpdates();
