const axios = require('axios');

async function createTestNotification() {
  console.log('📝 Creating test notification from superadmin...');
  
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
  
  // Step 2: Create notification
  console.log('\n📝 Step 2: Creating notification...');
  try {
    const createNotificationData = {
      title: 'Test Notification - ' + new Date().toLocaleTimeString(),
      message: 'This is a test notification sent from superadmin to anil@cc.com at ' + new Date().toLocaleString(),
      type: 'info',
      priority: 'medium',
      targetType: 'specific_users',
      targetUserIds: ['cmephpc52000quk8yzieibuth'], // anil@cc.com user ID
      status: 'sent' // Important: Set to sent to trigger delivery
    };
    
    const createResponse = await axios.post(
      'http://localhost:3000/api/superadmin/notifications',
      createNotificationData,
      { headers: superadminHeaders }
    );
    
    if (createResponse.data.success) {
      console.log('✅ Notification created successfully');
      console.log('Notification ID:', createResponse.data.data?.notification?.id);
      console.log('Notification Title:', createResponse.data.data?.notification?.title);
      console.log('Notification Status:', createResponse.data.data?.notification?.status);
      
      // Step 3: Wait a moment and check if notification was delivered
      console.log('\n⏳ Step 3: Waiting for notification delivery...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Check if anil@cc.com received the notification
      console.log('\n📋 Step 4: Checking if anil@cc.com received the notification...');
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
            console.log(`✅ anil@cc.com now has ${notifications.length} notifications (${unreadCount} unread)`);
            
            // Check if the new notification is there
            const newNotification = notifications.find(n => 
              n.title === createNotificationData.title
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
              console.log('Available notifications:');
              notifications.slice(0, 3).forEach((n, index) => {
                console.log(`${index + 1}. ${n.title} (${n.status})`);
              });
            }
          }
        }
      } catch (error) {
        console.log('❌ Error checking anil@cc.com notifications:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Failed to create notification:', createResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Error creating notification:', error.response?.data || error.message);
  }
}

createTestNotification().catch(console.error);
