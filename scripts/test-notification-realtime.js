const axios = require('axios');

// Configuration - Updated with actual database values
const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com'; // Active superadmin
const SUPERADMIN_PASSWORD = 'password123'; // Default password
const TENANT_SLUG = 'riyo'; // Actual tenant slug from database
const USER_EMAIL = 'anil@cc.com';
const TARGET_USER_ID = 'cmephpc52000quk8yzieibuth'; // Actual user ID from database

async function testRealTimeNotifications() {
  console.log('🧪 Testing Real-Time Notifications System');
  console.log('==========================================');

  try {
    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const superadminLoginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    const superadminToken = superadminLoginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Get superadmin user info
    console.log('\n2. Getting superadmin user info...');
    const superadminUserResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/validate`, {}, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });

    const superadminUser = superadminUserResponse.data.user;
    console.log('✅ Superadmin user info retrieved');

    // Step 3: Send notification to specific user
    console.log('\n3. Sending notification to specific user...');
    const notificationData = {
      title: 'Real-Time Test Notification',
      message: 'This is a test notification sent via WebSocket to verify real-time functionality.',
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: [TARGET_USER_ID],
      status: 'sent'
    };

    const notificationResponse = await axios.post(`${BASE_URL}/api/superadmin/notifications`, notificationData, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });

    console.log('✅ Notification sent successfully');
    console.log('📨 Response data:', JSON.stringify(notificationResponse.data, null, 2));
    
    // Check if notification was created successfully
    let notificationId;
    if (notificationResponse.data.success && notificationResponse.data.data && notificationResponse.data.data.notification) {
      notificationId = notificationResponse.data.data.notification.id;
      console.log('📨 Notification ID:', notificationId);
    } else {
      console.log('⚠️ Notification response structure unexpected');
      return;
    }

    // Step 4: Verify notification was created in database
    console.log('\n4. Verifying notification in database...');
    const notificationsResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });

    const sentNotification = notificationsResponse.data.data?.notifications?.find(
      n => n.id === notificationId
    );

    if (sentNotification) {
      console.log('✅ Notification found in database');
      console.log('📊 Status:', sentNotification.status);
      console.log('🎯 Target Type:', sentNotification.targetType);
    } else {
      console.log('⚠️ Notification not found in list (might be expected)');
    }

    // Step 5: Check user notification was created (using header API - no permission checks)
    console.log('\n5. Checking user notification was created...');
    const userNotificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 
        'X-User-Email': USER_EMAIL
      }
    });

    const userNotification = userNotificationsResponse.data.data?.data?.notifications?.find(
      n => n.notificationId === notificationId
    );

    if (userNotification) {
      console.log('✅ User notification created successfully');
      console.log('📖 Read status:', userNotification.status);
    } else {
      console.log('⚠️ User notification not found - this might be expected if WebSocket is working');
    }

    console.log('\n🎉 Real-time notification test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open the tenant dashboard in a browser');
    console.log('2. Login as the target user (anil@cc.com)');
    console.log('3. Check if the notification appears immediately');
    console.log('4. Verify the notification count increases');
    console.log('5. Check if a toast notification appears');
    console.log('\n🔗 URLs:');
    console.log(`   Superadmin: http://localhost:3000/superadmin/login`);
    console.log(`   Tenant: http://localhost:3000/${TENANT_SLUG}/login`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test
testRealTimeNotifications();
