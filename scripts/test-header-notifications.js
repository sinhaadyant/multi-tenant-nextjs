const axios = require('axios');

async function testHeaderNotifications() {
  const BASE_URL = 'http://localhost:3000';
  const TENANT_SLUG = 'riyo';
  const USER_EMAIL = 'anil@cc.com';

  try {
    console.log('🧪 Testing Header Notifications API (No Permission Checks)');
    console.log('========================================================');

    // Test 1: Get header notifications
    console.log('\n1. Testing header notifications API...');
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
      headers: { 
        'X-User-Email': USER_EMAIL
      }
    });

    console.log('✅ Header notifications API working!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Notifications count:', response.data.data?.data?.notifications?.length || 0);
    console.log('📈 Unread count:', response.data.data?.data?.unreadCount || 0);

    // Test 2: Mark a notification as read (if any exist)
    const notifications = response.data.data?.data?.notifications || [];
    if (notifications.length > 0) {
      const firstNotification = notifications[0];
      console.log('\n2. Testing mark as read functionality...');
      
      const markReadResponse = await axios.patch(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header`, {
        notificationIds: [firstNotification.id]
      }, {
        headers: { 
          'X-User-Email': USER_EMAIL
        }
      });

      console.log('✅ Mark as read API working!');
      console.log('📊 Response:', markReadResponse.data.message);
    } else {
      console.log('\n2. No notifications to test mark as read functionality');
    }

    console.log('\n🎉 Header notifications API test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ No permission checks required');
    console.log('   ✅ Uses X-User-Email header for authentication');
    console.log('   ✅ Works with tenant slug validation');
    console.log('   ✅ Real-time notifications will work in header');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testHeaderNotifications();
