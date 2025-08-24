const axios = require('axios');

async function testHeaderCount() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing Header Notification Count Updates');
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

    // Step 4: Send test notification
    console.log('\n4. Sending test notification...');
    const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, {
      title: 'Header Count Test',
      message: 'Testing header notification count updates.',
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

    // Step 5: Wait and check updated count
    console.log('\n5. Waiting for notification processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const updatedResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 'X-User-Email': USER_EMAIL }
    });

    const updatedData = updatedResponse.data.data?.data;
    const updatedUnreadCount = updatedData?.unreadCount || 0;
    console.log('📈 Updated unread count:', updatedUnreadCount);

    // Step 6: Verify count increase
    console.log('\n6. Verifying count increase...');
    if (updatedUnreadCount > initialUnreadCount) {
      console.log('✅ Unread count increased successfully');
      console.log('📊 Increase:', updatedUnreadCount - initialUnreadCount);
    } else {
      console.log('❌ Unread count did not increase');
      console.log('📊 Expected increase, but count remained:', updatedUnreadCount);
    }

    // Step 7: Check for our test notification
    console.log('\n7. Checking for test notification...');
    const testNotification = updatedData?.notifications?.find(n => 
      n.title === 'Header Count Test'
    );

    if (testNotification) {
      console.log('✅ Test notification found in header notifications');
      console.log('📖 Status:', testNotification.status);
    } else {
      console.log('❌ Test notification not found in header notifications');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Backend notification creation: Working');
    console.log('   ✅ Header API response: Working');
    console.log('   ✅ Count update: ' + (updatedUnreadCount > initialUnreadCount ? 'Working' : 'Failed'));
    console.log('   ❓ Frontend display: Need browser testing');

    console.log('\n🔗 Manual Testing Instructions:');
    console.log('   1. Open browser: http://localhost:3000/riyo/login');
    console.log('   2. Login as: anil@cc.com / password123');
    console.log('   3. Open browser console (F12)');
    console.log('   4. Look for: "📊 Header Notification Count Debug:"');
    console.log('   5. Send notification from superadmin');
    console.log('   6. Check if header count updates in real-time');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testHeaderCount();
