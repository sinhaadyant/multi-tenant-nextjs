const axios = require('axios');

async function createNotificationForAnil() {
  console.log('📝 Creating notification for anil@cc.com...');
  
  const tenantSlug = 'riyo';
  const baseUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications`;
  
  // Login with riyo@cc.com (admin user)
  let authToken = null;
  
  try {
    console.log('\n🔐 Step 1: Authenticating with riyo@cc.com...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'riyo@cc.com',
      password: 'Test@123',
      tenantSlug: 'riyo'
    });
    
    if (loginResponse.data.success && loginResponse.data.data?.token) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Authentication successful');
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
    // Get anil@cc.com user ID
    console.log('\n👤 Step 2: Getting anil@cc.com user ID...');
    const anilUserId = 'cmephpc52000quk8yzieibuth'; // From the previous test
    
    // Create notification for anil@cc.com
    console.log('\n📝 Step 3: Creating notification for anil@cc.com...');
    const createData = {
      title: 'Welcome Anil!',
      message: 'This is a test notification specifically for anil@cc.com. You should see this in your header notifications.',
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: [anilUserId],
      status: 'sent' // Set to sent so it gets delivered immediately
    };

    const createResponse = await axios.post(baseUrl, createData, { headers });
    
    console.log('Status:', createResponse.status);
    
    if (createResponse.data.success) {
      console.log('✅ Create response:', {
        success: createResponse.data.success,
        notificationId: createResponse.data.data?.notification?.id
      });
      
      // Now test if anil@cc.com can see this notification
      console.log('\n👤 Step 4: Testing if anil@cc.com can see the notification...');
      
      // Login as anil@cc.com
      const anilLoginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
        email: 'anil@cc.com',
        password: 'Test@123',
        tenantSlug: 'riyo'
      });
      
      if (anilLoginResponse.data.success && anilLoginResponse.data.data?.token) {
        const anilToken = anilLoginResponse.data.data.token;
        const anilHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anilToken}`
        };
        
        // Check user notifications
        const userNotificationsUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my`;
        const userResponse = await axios.get(userNotificationsUrl, { headers: anilHeaders });
        
        console.log('Status:', userResponse.status);
        if (userResponse.data.success) {
          console.log('✅ Anil user notifications response:', {
            success: userResponse.data.success,
            notificationsCount: userResponse.data.data?.notifications?.length || 0,
            unreadCount: userResponse.data.data?.unreadCount || 0,
            notifications: userResponse.data.data?.notifications || []
          });
        } else {
          console.log('❌ Anil user notifications failed:', userResponse.data.message);
        }
      }
      
    } else {
      console.log('❌ Create failed:', createResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

createNotificationForAnil().catch(console.error);
