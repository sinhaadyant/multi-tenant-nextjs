const axios = require('axios');

// Test tenant notifications API with proper authentication
async function testTenantNotificationsWithAuth() {
  console.log('🧪 Testing Tenant Notifications API (With Authentication)...');
  
  const tenantSlug = 'riyo';
  const baseUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications`;
  
  // Login with a valid user
  let authToken = null;
  
  try {
    console.log('\n🔐 Step 1: Authenticating with riyo@cc.com...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'riyo@cc.com',
      password: 'Test@123',
      tenantSlug: 'riyo'
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.data?.token) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Authentication successful');
      console.log('Token:', authToken.substring(0, 20) + '...');
    } else if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Authentication successful (alternative format)');
      console.log('Token:', authToken.substring(0, 20) + '...');
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data || error.message);
    return;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
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
      message: 'This is a test notification created via API testing with authentication',
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
      
      console.log('\n✅ Update and Delete functionality removed from tenant notifications');
    } else {
      console.log('❌ Create failed:', createResponse.data.message);
    }

    // Test filtering and search
    console.log('\n🔍 Step 5: Testing filtering and search...');
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
    console.log('\n📊 Step 6: Testing statistics...');
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

    // Test user notifications
    console.log('\n👤 Step 7: Testing user notifications...');
    const userNotificationsUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my`;
    const userResponse = await axios.get(userNotificationsUrl, { headers });
    
    console.log('Status:', userResponse.status);
    if (userResponse.data.success) {
      console.log('✅ User notifications response:', {
        success: userResponse.data.success,
        notificationsCount: userResponse.data.data?.notifications?.length || 0,
        unreadCount: userResponse.data.data?.unreadCount || 0
      });
    } else {
      console.log('❌ User notifications failed:', userResponse.data.message);
    }

    // Test creating notification for specific users
    console.log('\n👥 Step 8: Testing specific user notification...');
    const specificUserData = {
      title: 'Specific User Notification',
      message: 'This notification is sent to specific users only',
      type: 'success',
      priority: 'high',
      targetType: 'specific_users',
      targetUserIds: ['user1', 'user2'], // This will fail but tests the validation
      status: 'draft'
    };

    const specificUserResponse = await axios.post(baseUrl, specificUserData, { headers });
    
    console.log('Status:', specificUserResponse.status);
    if (specificUserResponse.data.success) {
      console.log('✅ Specific user notification created');
    } else {
      console.log('❌ Specific user notification failed (expected):', specificUserResponse.data.message);
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
    const wsResponse = await axios.get('http://localhost:3000/api/websocket');
    console.log('✅ WebSocket endpoint available');
  } catch (error) {
    console.log('⚠️ WebSocket endpoint not available:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting authenticated tenant notifications tests...\n');
  
  await testTenantNotificationsWithAuth();
  await testWebSocket();
  
  console.log('\n🎉 All authenticated tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
