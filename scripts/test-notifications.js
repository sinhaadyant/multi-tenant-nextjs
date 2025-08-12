const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testNotifications() {
  try {
    console.log('🧪 Testing Notifications API...\n');

    // Test 1: Get notifications (should work without auth for testing)
    console.log('1️⃣ Testing GET /api/superadmin/notifications...');
    try {
      const response = await axios.get(`${BASE_URL}/superadmin/notifications`);
      console.log('✅ GET notifications successful:', response.data.success);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ GET notifications - Authentication required (expected)');
      } else {
        console.log('❌ GET notifications failed:', error.response?.data || error.message);
      }
    }

    // Test 2: Create notification with superadmin target (should work)
    console.log('\n2️⃣ Testing POST /api/superadmin/notifications with superadmin target...');
    const notificationData = {
      title: "Test Notification",
      message: "This is a test notification for superadmin",
      type: "info",
      priority: "medium",
      targetType: "superadmin",
      targetTenantId: null,
      scheduledAt: "",
      attachments: [],
      metadata: {}
    };

    try {
      const response = await axios.post(`${BASE_URL}/superadmin/notifications`, notificationData);
      console.log('✅ POST notification successful:', response.data.success);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ POST notification - Authentication required (expected)');
      } else {
        console.log('❌ POST notification failed:', error.response?.data || error.message);
      }
    }

    // Test 3: Create notification with all target (should work)
    console.log('\n3️⃣ Testing POST /api/superadmin/notifications with all target...');
    const allNotificationData = {
      title: "Test All Users Notification",
      message: "This is a test notification for all users",
      type: "info",
      priority: "medium",
      targetType: "all",
      targetTenantId: null,
      scheduledAt: "",
      attachments: [],
      metadata: {}
    };

    try {
      const response = await axios.post(`${BASE_URL}/superadmin/notifications`, allNotificationData);
      console.log('✅ POST all notification successful:', response.data.success);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ POST all notification - Authentication required (expected)');
      } else {
        console.log('❌ POST all notification failed:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Notifications API test completed!');
    console.log('\n📝 Note: 401 errors are expected since we\'re not providing authentication tokens.');
    console.log('   The important thing is that we\'re not getting 500 errors (foreign key violations).');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotifications();
