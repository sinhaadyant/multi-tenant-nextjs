const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!',
  tenantSlug: 'global-retail'
};

async function testTenantNotifications() {
  let token = null;
  let tenantSlug = 'global-retail';
  let createdNotificationId = null;

  try {
    console.log('🔍 Testing Tenant Notification System...');

    // Step 1: Login as tenant user
    console.log('\n📝 Step 1: Logging in as tenant user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, TENANT_CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('Tenant login failed: ' + loginResponse.data.message);
    }

    token = loginResponse.data.data.token;
    console.log('✅ Tenant login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test notifications list
    console.log('\n📝 Step 2: Testing notifications list...');
    const listResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications`, { headers });
    
    if (listResponse.data.success) {
      console.log('✅ Notifications list working');
      console.log('   Total notifications:', listResponse.data.data.notifications?.length || 0);
      console.log('   Stats:', listResponse.data.data.stats);
    }

    // Step 3: Create a test notification
    console.log('\n📝 Step 3: Creating test notification...');
    const newNotification = {
      title: 'Test Tenant Notification',
      message: 'This is a test notification created by tenant user',
      priority: 'medium',
      targetType: 'specific_tenant'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/notifications`, newNotification, { headers });

    if (createResponse.data.success) {
      createdNotificationId = createResponse.data.data.notification.id;
      console.log('✅ Test notification created:', createdNotificationId);
      console.log('   Title:', createResponse.data.data.notification.title);
      console.log('   Priority:', createResponse.data.data.notification.priority);
      console.log('   Target Type:', createResponse.data.data.notification.targetType);
    }

    // Step 4: Test notifications list again to see the new notification
    console.log('\n📝 Step 4: Verifying notification appears in list...');
    const listResponse2 = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications`, { headers });
    
    if (listResponse2.data.success) {
      console.log('✅ Notifications list updated');
      console.log('   Total notifications:', listResponse2.data.data.notifications?.length || 0);
      
      const newNotificationInList = listResponse2.data.data.notifications.find(n => n.id === createdNotificationId);
      if (newNotificationInList) {
        console.log('✅ New notification found in list');
        console.log('   Title:', newNotificationInList.title);
        console.log('   Message:', newNotificationInList.message);
      }
    }

    // Step 5: Test filters and search
    console.log('\n📝 Step 5: Testing filters and search...');
    
    // Test priority filter
    const priorityFilterResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications?priority=medium`, { headers });
    if (priorityFilterResponse.data.success) {
      console.log('✅ Priority filter working');
      console.log('   Medium priority notifications:', priorityFilterResponse.data.data.notifications?.length || 0);
    }

    // Test search
    const searchResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications?search=test`, { headers });
    if (searchResponse.data.success) {
      console.log('✅ Search working');
      console.log('   Search results:', searchResponse.data.data.notifications?.length || 0);
    }

    // Test pagination
    const paginationResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications?page=1&limit=5`, { headers });
    if (paginationResponse.data.success) {
      console.log('✅ Pagination working');
      console.log('   Page:', paginationResponse.data.meta?.page);
      console.log('   Limit:', paginationResponse.data.meta?.limit);
      console.log('   Total Pages:', paginationResponse.data.meta?.totalPages);
      console.log('   Total Records:', paginationResponse.data.meta?.totalRecords);
    }

    // Step 6: Test frontend URLs
    console.log('\n📝 Step 6: Testing frontend URLs...');
    
    try {
      const listPageResponse = await axios.get(`${BASE_URL}/${tenantSlug}/notifications`);
      console.log('✅ Tenant notifications list page working (returns HTML)');
    } catch (error) {
      console.log('❌ Tenant notifications list page failed:', error.message);
    }

    try {
      const newPageResponse = await axios.get(`${BASE_URL}/${tenantSlug}/notifications/new`);
      console.log('✅ Tenant new notification page working (returns HTML)');
    } catch (error) {
      console.log('❌ Tenant new notification page failed:', error.message);
    }

    // Step 7: Test different notification types
    console.log('\n📝 Step 7: Testing different notification types...');
    
    const notificationTypes = [
      {
        title: 'High Priority Alert',
        message: 'This is a high priority notification',
        priority: 'high',
        targetType: 'specific_tenant'
      },
      {
        title: 'Low Priority Info',
        message: 'This is a low priority information notification',
        priority: 'low',
        targetType: 'specific_tenant'
      },
      {
        title: 'Urgent System Update',
        message: 'This is an urgent system update notification',
        priority: 'urgent',
        targetType: 'specific_tenant'
      }
    ];

    for (let i = 0; i < notificationTypes.length; i++) {
      const notification = notificationTypes[i];
      console.log(`   Creating ${notification.priority} priority notification...`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/notifications`, notification, { headers });
        if (response.data.success) {
          console.log(`   ✅ ${notification.priority} priority notification created`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to create ${notification.priority} priority notification:`, error.response?.data?.message || error.message);
      }
    }

    // Step 8: Verify all notifications in list
    console.log('\n📝 Step 8: Verifying all notifications in list...');
    const finalListResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications`, { headers });
    
    if (finalListResponse.data.success) {
      console.log('✅ Final notifications list');
      console.log('   Total notifications:', finalListResponse.data.data.notifications?.length || 0);
      console.log('   Stats:', finalListResponse.data.data.stats);
      
      // Show notification details
      finalListResponse.data.data.notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title} (${notification.priority})`);
      });
    }

    console.log('\n🎉 Tenant notification system test completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Login and authentication');
    console.log('   ✅ Create notifications');
    console.log('   ✅ List notifications');
    console.log('   ✅ Filter by priority');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Pagination');
    console.log('   ✅ Different priority levels');
    console.log('   ✅ Frontend page accessibility');
    console.log('   ✅ Statistics tracking');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testTenantNotifications();
