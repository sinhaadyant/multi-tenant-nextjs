const axios = require('axios');

async function testRealtimeNotifications() {
  console.log('🧪 Testing real-time notification system...');
  
  // Step 1: Login as superadmin
  let superadminToken = null;
  try {
    console.log('\n🔐 Step 1: Authenticating as superadmin...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/superadmin/auth/login', {
      email: 'sinhaadyant74@gmail.com',
      password: 'Test@123'
    });
    
    if (loginResponse.data.success && loginResponse.data.data?.token) {
      superadminToken = loginResponse.data.data.token;
      console.log('✅ Superadmin authentication successful');
    } else {
      console.log('❌ Superadmin authentication failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Superadmin authentication error:', error.response?.data || error.message);
    return;
  }
  
  const superadminHeaders = {
    'Authorization': `Bearer ${superadminToken}`,
    'Content-Type': 'application/json'
  };
  
  // Step 2: Get anil@cc.com user ID
  console.log('\n👤 Step 2: Getting anil@cc.com user ID...');
  const anilUserId = 'cmephpc52000quk8yzieibuth'; // From previous tests
  console.log('✅ anil@cc.com user ID:', anilUserId);
  
  // Step 3: Check current notifications for anil@cc.com
  console.log('\n📋 Step 3: Checking current notifications for anil@cc.com...');
  try {
    const anilLoginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'anil@cc.com',
      password: 'Test@123',
      tenantSlug: 'riyo'
    });
    
    if (anilLoginResponse.data.success && anilLoginResponse.data.data?.token) {
      const anilToken = anilLoginResponse.data.data.token;
      const anilHeaders = {
        'Authorization': `Bearer ${anilToken}`,
        'Content-Type': 'application/json'
      };
      
      const userNotificationsResponse = await axios.get(
        'http://localhost:3000/api/tenant/riyo/notifications/my',
        { headers: anilHeaders }
      );
      
      if (userNotificationsResponse.data.success) {
        const notifications = userNotificationsResponse.data.data?.notifications || [];
        const unreadCount = userNotificationsResponse.data.data?.unreadCount || 0;
        console.log(`✅ anil@cc.com has ${notifications.length} notifications (${unreadCount} unread)`);
      }
    }
  } catch (error) {
    console.log('❌ Error checking anil@cc.com notifications:', error.response?.data || error.message);
  }
  
  // Step 4: Create a new notification from superadmin to anil@cc.com
  console.log('\n📝 Step 4: Creating new notification from superadmin...');
  try {
    const createNotificationData = {
      title: 'Real-time Test Notification',
      message: 'This notification should appear in real-time for anil@cc.com via WebSocket!',
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: [anilUserId],
      status: 'sent' // Set to sent to trigger delivery
    };
    
    const createResponse = await axios.post(
      'http://localhost:3000/api/superadmin/notifications',
      createNotificationData,
      { headers: superadminHeaders }
    );
    
    if (createResponse.data.success) {
      console.log('✅ Notification created successfully');
      console.log('Notification ID:', createResponse.data.data?.notification?.id);
      
      // Step 5: Wait a moment and check if notification was delivered
      console.log('\n⏳ Step 5: Waiting for notification delivery...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 6: Check if anil@cc.com received the notification
      console.log('\n📋 Step 6: Checking if anil@cc.com received the notification...');
      try {
        const anilLoginResponse2 = await axios.post('http://localhost:3000/api/tenant/auth/login', {
          email: 'anil@cc.com',
          password: 'Test@123',
          tenantSlug: 'riyo'
        });
        
        if (anilLoginResponse2.data.success && anilLoginResponse2.data.data?.token) {
          const anilToken2 = anilLoginResponse2.data.data.token;
          const anilHeaders2 = {
            'Authorization': `Bearer ${anilToken2}`,
            'Content-Type': 'application/json'
          };
          
          const userNotificationsResponse2 = await axios.get(
            'http://localhost:3000/api/tenant/riyo/notifications/my',
            { headers: anilHeaders2 }
          );
          
          if (userNotificationsResponse2.data.success) {
            const notifications = userNotificationsResponse2.data.data?.notifications || [];
            const unreadCount = userNotificationsResponse2.data.data?.unreadCount || 0;
            console.log(`✅ anil@cc.com now has ${notifications.length} notifications (${unreadCount} unread)`);
            
            // Check if the new notification is there
            const newNotification = notifications.find(n => 
              n.title === 'Real-time Test Notification'
            );
            
            if (newNotification) {
              console.log('✅ New notification found in anil@cc.com list!');
              console.log('Notification details:', {
                id: newNotification.id,
                title: newNotification.title,
                status: newNotification.status,
                createdAt: newNotification.createdAt
              });
            } else {
              console.log('❌ New notification not found in anil@cc.com list');
            }
          }
        }
      } catch (error) {
        console.log('❌ Error checking updated notifications:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Failed to create notification:', createResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Error creating notification:', error.response?.data || error.message);
  }
  
  // Step 7: Test WebSocket endpoint
  console.log('\n🔌 Step 7: Testing WebSocket endpoint...');
  try {
    const wsResponse = await axios.get('http://localhost:3000/api/websocket', {
      timeout: 5000
    });
    console.log('✅ WebSocket endpoint is accessible');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ WebSocket endpoint not accessible (connection refused)');
    } else {
      console.log('⚠️ WebSocket endpoint test result:', error.message);
    }
  }
  
  console.log('\n🎉 Real-time notification test completed!');
}

testRealtimeNotifications().catch(console.error);
