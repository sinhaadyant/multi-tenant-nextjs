const axios = require('axios');

// Test tenant notifications API with authentication
async function testTenantNotificationsComprehensive() {
  console.log('🧪 Testing Tenant Notifications API (Comprehensive)...');
  
  const tenantSlug = 'riyo';
  const baseUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications`;
  
  // First, let's get a valid token by logging in
  let authToken = null;
  
  try {
    console.log('\n🔐 Step 1: Getting authentication token...');
    
    // Try to login with a test user
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'riyo@cc.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ Authentication failed, trying without token...');
    }
  } catch (error) {
    console.log('⚠️ Authentication failed, proceeding with public tests...');
  }
  
  const headers = authToken ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  } : {
    'Content-Type': 'application/json'
  };
  
  try {
    // Test GET - List notifications
    console.log('\n📋 Step 2: Testing GET /notifications (list)...');
    const listResponse = await axios.get(`${baseUrl}?page=1&limit=10`, { headers });
    
    console.log('Status:', listResponse.status);
    console.log('✅ List response:', {
      success: listResponse.data.success,
      notificationsCount: listResponse.data.data?.notifications?.length || 0,
      total: listResponse.data.data?.pagination?.total || 0,
      permissions: listResponse.data.data?.permissions
    });

    // Test POST - Create notification
    console.log('\n📝 Step 3: Testing POST /notifications (create)...');
    const createData = {
      title: 'Test Notification from API',
      message: 'This is a test notification created via API testing',
      type: 'info',
      priority: 'medium',
      targetType: 'all_tenant_users',
      status: 'draft'
    };

    const createResponse = await axios.post(baseUrl, createData, { headers });
    
    console.log('Status:', createResponse.status);
    
    if (createResponse.data.success) {
      console.log('✅ Create response:', {
        success: createResponse.data.success,
        notificationId: createResponse.data.data?.notification?.id
      });
      
      const notificationId = createResponse.data.data?.notification?.id;
      
      // Test GET - Get single notification
      console.log('\n👁️ Step 4: Testing GET /notifications/[id] (single)...');
      const singleResponse = await axios.get(`${baseUrl}/${notificationId}`, { headers });
      
      console.log('Status:', singleResponse.status);
      if (singleResponse.data.success) {
        console.log('✅ Single notification response:', {
          success: singleResponse.data.success,
          title: singleResponse.data.data?.notification?.title
        });
      } else {
        console.log('❌ Single notification failed:', singleResponse.data.message);
      }
      
      // Test PUT - Update notification
      console.log('\n✏️ Step 5: Testing PUT /notifications (update)...');
      const updateData = {
        id: notificationId,
        title: 'Updated Test Notification',
        message: 'This notification has been updated via API testing',
        type: 'warning',
        priority: 'high',
        targetType: 'all_tenant_users',
        status: 'draft'
      };

      const updateResponse = await axios.put(baseUrl, updateData, { headers });
      
      console.log('Status:', updateResponse.status);
      
      if (updateResponse.data.success) {
        console.log('✅ Update response:', {
          success: updateResponse.data.success,
          title: updateResponse.data.data?.notification?.title
        });
      } else {
        console.log('❌ Update failed:', updateResponse.data.message);
      }

      // Test DELETE - Delete notification
      console.log('\n🗑️ Step 6: Testing DELETE /notifications (delete)...');
      const deleteResponse = await axios.delete(`${baseUrl}?id=${notificationId}`, { headers });
      
      console.log('Status:', deleteResponse.status);
      
      if (deleteResponse.data.success) {
        console.log('✅ Delete response:', {
          success: deleteResponse.data.success,
          message: deleteResponse.data.message
        });
      } else {
        console.log('❌ Delete failed:', deleteResponse.data.message);
      }
    } else {
      console.log('❌ Create failed:', createResponse.data.message);
    }

    // Test filtering and search
    console.log('\n🔍 Step 7: Testing filtering and search...');
    const filterResponse = await axios.get(`${baseUrl}?page=1&limit=5&type=info&priority=medium`, { headers });
    
    console.log('Status:', filterResponse.status);
    if (filterResponse.data.success) {
      console.log('✅ Filter response:', {
        success: filterResponse.data.success,
        notificationsCount: filterResponse.data.data?.notifications?.length || 0,
        filters: 'type=info&priority=medium'
      });
    } else {
      console.log('❌ Filter failed:', filterResponse.data.message);
    }

    // Test statistics
    console.log('\n📊 Step 8: Testing statistics...');
    const statsResponse = await axios.get(`${baseUrl}?page=1&limit=1`, { headers });
    
    console.log('Status:', statsResponse.status);
    if (statsResponse.data.success && statsResponse.data.data?.stats) {
      console.log('✅ Statistics response:', {
        total: statsResponse.data.data.stats.total,
        draft: statsResponse.data.data.stats.draft,
        sent: statsResponse.data.data.stats.sent,
        scheduled: statsResponse.data.data.stats.scheduled
      });
    } else {
      console.log('❌ Statistics failed:', statsResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

// Test WebSocket functionality
async function testWebSocket() {
  console.log('\n🔌 Step 9: Testing WebSocket connection...');
  
  try {
    // Test if WebSocket endpoint is available
    const wsResponse = await axios.get('http://localhost:3000/api/websocket');
    console.log('✅ WebSocket endpoint available');
  } catch (error) {
    console.log('⚠️ WebSocket endpoint not available:', error.message);
  }
}

// Test user notifications
async function testUserNotifications() {
  console.log('\n👤 Step 10: Testing user notifications...');
  
  const tenantSlug = 'riyo';
  const userNotificationsUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my`;
  
  try {
    const response = await axios.get(userNotificationsUrl);
    console.log('Status:', response.status);
    
    if (response.data.success) {
      console.log('✅ User notifications response:', {
        success: response.data.success,
        notificationsCount: response.data.data?.notifications?.length || 0,
        unreadCount: response.data.data?.unreadCount || 0
      });
    } else {
      console.log('❌ User notifications failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ User notifications test failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive tenant notifications tests...\n');
  
  await testTenantNotificationsComprehensive();
  await testWebSocket();
  await testUserNotifications();
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
