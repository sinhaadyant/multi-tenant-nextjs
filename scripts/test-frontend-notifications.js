const axios = require('axios');

async function testFrontendNotifications() {
  console.log('🧪 Testing frontend notification endpoints...');
  
  const tenantSlug = 'riyo';
  
  // Test 1: Check if the notification API endpoint is accessible
  console.log('\n🔍 Step 1: Testing notification API accessibility...');
  try {
    const response = await axios.get(`http://localhost:3000/api/tenant/${tenantSlug}/notifications/my`);
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ API not accessible:', error.response?.status, error.response?.data?.message);
  }
  
  // Test 2: Test with authentication
  console.log('\n🔐 Step 2: Testing with anil@cc.com authentication...');
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'anil@cc.com',
      password: 'Test@123',
      tenantSlug: 'riyo'
    });
    
    if (loginResponse.data.success && loginResponse.data.data?.token) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful');
      
      // Test user notifications with auth
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const userNotificationsResponse = await axios.get(
        `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my`,
        { headers }
      );
      
      console.log('Status:', userNotificationsResponse.status);
      console.log('User notifications:', userNotificationsResponse.data);
      
      // Test mark as read
      if (userNotificationsResponse.data.data?.notifications?.length > 0) {
        const notificationId = userNotificationsResponse.data.data.notifications[0].id;
        console.log('\n📝 Step 3: Testing mark as read...');
        
        const markReadResponse = await axios.patch(
          `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my/mark-read`,
          { notificationIds: [notificationId] },
          { headers }
        );
        
        console.log('Mark as read status:', markReadResponse.status);
        console.log('Mark as read response:', markReadResponse.data);
        
        // Test mark all as read
        console.log('\n📝 Step 4: Testing mark all as read...');
        const markAllReadResponse = await axios.patch(
          `http://localhost:3000/api/tenant/${tenantSlug}/notifications/my/mark-read`,
          { markAllAsRead: true },
          { headers }
        );
        
        console.log('Mark all as read status:', markAllReadResponse.status);
        console.log('Mark all as read response:', markAllReadResponse.data);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendNotifications().catch(console.error);
