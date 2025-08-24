const axios = require('axios');

async function testSuperadminNotificationSending() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';
  const TEST_USER_ID = 'cmephpc52000quk8yzieibuth'; // User ID from the support API test

  try {
    console.log('🧪 Testing Superadmin Notification Sending');
    console.log('==========================================');

    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Superadmin login failed: ' + loginResponse.data.message);
    }

    const superadminToken = loginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Create a notification targeting specific user
    console.log('\n2. Creating notification for specific user...');
    const createNotificationData = {
      title: 'Test Notification from Superadmin',
      message: 'This is a test notification sent to a specific user.',
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: [TEST_USER_ID],
      status: 'sent' // Set to sent immediately
    };

    const createResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, createNotificationData, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Notification created successfully');
    console.log('📋 Notification ID:', createResponse.data.data.notification.id);
    console.log('📊 Status:', createResponse.data.data.notification.status);

    // Step 3: Check if user notification was created
    console.log('\n3. Checking if user notification was created...');
    
    // First, let's check the notification details
    const notificationId = createResponse.data.data.notification.id;
    const notificationDetailsResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`
      }
    });

    console.log('📋 Notification details:');
    console.log('   - Title:', notificationDetailsResponse.data.data.notification.title);
    console.log('   - Status:', notificationDetailsResponse.data.data.notification.status);
    console.log('   - Target Type:', notificationDetailsResponse.data.data.notification.targetType);
    console.log('   - User Notifications Count:', notificationDetailsResponse.data.data.notification._count?.userNotifications);

    // Step 4: Check if the target user can see the notification
    console.log('\n4. Checking if target user can see the notification...');
    
    // Login as the target user
    const userLoginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: 'anil@cc.com',
      password: 'password123',
      tenantSlug: 'riyo'
    });

    if (!userLoginResponse.data.success) {
      throw new Error('User login failed: ' + userLoginResponse.data.message);
    }

    const userToken = userLoginResponse.data.data.token;
    console.log('✅ User login successful');

    // Check user's notifications using the header endpoint
    const userNotificationsResponse = await axios.get(`${BASE_URL}/api/tenant/riyo/notifications/header`, {
      headers: {
        'X-User-Email': 'anil@cc.com',
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10
      }
    });

    console.log('📋 User notifications:');
    console.log('   - Total notifications:', userNotificationsResponse.data.data.data.notifications.length);
    console.log('   - Unread count:', userNotificationsResponse.data.data.data.unreadCount);

    // Look for our test notification
    const testNotification = userNotificationsResponse.data.data.data.notifications.find(n => 
      n.title === 'Test Notification from Superadmin'
    );

    if (testNotification) {
      console.log('✅ Test notification found in user notifications!');
      console.log('   - Status:', testNotification.status);
      console.log('   - Is Read:', testNotification.isRead);
    } else {
      console.log('❌ Test notification NOT found in user notifications');
    }

    // Step 5: Test sending an existing notification
    console.log('\n5. Testing sending an existing notification...');
    
    // Create a draft notification first
    const draftNotificationData = {
      title: 'Draft Test Notification',
      message: 'This is a draft notification that will be sent.',
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: [TEST_USER_ID],
      status: 'draft'
    };

    const draftResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, draftNotificationData, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const draftNotificationId = draftResponse.data.data.notification.id;
    console.log('✅ Draft notification created:', draftNotificationId);

    // Now send the draft notification
    const sendResponse = await axios.patch(`${BASE_URL}/api/superadmin/notifications/${draftNotificationId}`, {
      action: 'send'
    }, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Send response:', sendResponse.data);

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Notification creation: Working');
    console.log('   ✅ Notification targeting: Working');
    console.log('   ❓ User notification delivery: Need to verify');
    console.log('   ❓ Send functionality: Need to verify');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testSuperadminNotificationSending();
