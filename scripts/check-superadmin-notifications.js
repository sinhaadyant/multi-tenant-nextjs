const axios = require('axios');

async function checkSuperadminNotifications() {
  console.log('🔍 Checking superadmin notifications for anil@cc.com...');
  
  // Login as superadmin
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
  
  try {
    // Check all superadmin notifications
    console.log('\n📋 Step 2: Checking all superadmin notifications...');
    const notificationsResponse = await axios.get(
      'http://localhost:3000/api/superadmin/notifications?page=1&limit=50',
      { headers: superadminHeaders }
    );
    
    console.log('Status:', notificationsResponse.status);
    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data?.notifications || [];
      console.log(`✅ Found ${notifications.length} superadmin notifications`);
      
      // Look for notifications targeting anil@cc.com
      const anilNotifications = notifications.filter(n => 
        n.targetType === 'specific_users' && 
        n.targetUserIds && 
        n.targetUserIds.includes('cmephpc52000quk8yzieibuth') // anil@cc.com user ID
      );
      
      console.log(`\n👤 Step 3: Notifications targeting anil@cc.com: ${anilNotifications.length}`);
      anilNotifications.forEach((notification, index) => {
        console.log(`\nNotification ${index + 1}:`);
        console.log(`- ID: ${notification.id}`);
        console.log(`- Title: ${notification.title}`);
        console.log(`- Message: ${notification.message}`);
        console.log(`- Type: ${notification.type}`);
        console.log(`- Status: ${notification.status}`);
        console.log(`- Target Type: ${notification.targetType}`);
        console.log(`- Target User IDs: ${notification.targetUserIds}`);
        console.log(`- Created At: ${notification.createdAt}`);
      });
    } else {
      console.log('❌ Failed to fetch superadmin notifications:', notificationsResponse.data.message);
    }
    
    // Check if anil@cc.com has any user notifications
    console.log('\n👤 Step 4: Checking anil@cc.com user notifications...');
    
    // Login as anil@cc.com
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
      
      console.log('Status:', userNotificationsResponse.status);
      if (userNotificationsResponse.data.success) {
        const userNotifications = userNotificationsResponse.data.data?.notifications || [];
        console.log(`✅ anil@cc.com has ${userNotifications.length} notifications`);
        console.log(`Unread count: ${userNotificationsResponse.data.data?.unreadCount || 0}`);
        
        userNotifications.forEach((notification, index) => {
          console.log(`\nUser Notification ${index + 1}:`);
          console.log(`- ID: ${notification.id}`);
          console.log(`- Notification ID: ${notification.notificationId}`);
          console.log(`- Title: ${notification.title}`);
          console.log(`- Message: ${notification.message}`);
          console.log(`- Status: ${notification.status}`);
          console.log(`- Created At: ${notification.createdAt}`);
        });
      } else {
        console.log('❌ Failed to fetch user notifications:', userNotificationsResponse.data.message);
      }
    } else {
      console.log('❌ Failed to login as anil@cc.com');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

checkSuperadminNotifications().catch(console.error);
