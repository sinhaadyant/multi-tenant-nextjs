const axios = require('axios');

async function testAnilNotifications() {
  console.log('🧪 Testing notifications for anil@cc.com...');
  
  const tenantSlug = 'riyo';
  const baseUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications`;
  
  // Login with anil@cc.com
  let authToken = null;
  
  try {
    console.log('\n🔐 Step 1: Authenticating with anil@cc.com...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'anil@cc.com',
      password: 'Test@123',
      tenantSlug: 'riyo'
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.data?.token) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Authentication successful');
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
    // Test user notifications
    console.log('\n👤 Step 2: Testing user notifications for anil@cc.com...');
    const userNotificationsUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my`;
    const userResponse = await axios.get(userNotificationsUrl, { headers });
    
    console.log('Status:', userResponse.status);
    if (userResponse.data.success) {
      console.log('✅ User notifications response:', {
        success: userResponse.data.success,
        notificationsCount: userResponse.data.data?.notifications?.length || 0,
        unreadCount: userResponse.data.data?.unreadCount || 0,
        notifications: userResponse.data.data?.notifications || []
      });
    } else {
      console.log('❌ User notifications failed:', userResponse.data.message);
    }

    // Test all notifications list
    console.log('\n📋 Step 3: Testing all notifications list...');
    const listResponse = await axios.get(`${baseUrl}?page=1&limit=10`, { headers });
    
    console.log('Status:', listResponse.status);
    console.log('✅ List response:', {
      success: listResponse.data.success,
      notificationsCount: listResponse.data.data?.notifications?.length || 0,
      total: listResponse.data.data?.pagination?.total || 0,
      permissions: listResponse.data.data?.permissions
    });

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testAnilNotifications().catch(console.error);
