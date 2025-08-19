const axios = require('axios');

// Test the notification read functionality
async function testNotificationRead() {
  try {
    console.log('Testing notification read functionality...');
    
    // First, let's test the read endpoint directly
    const notificationId = 'cme63jrh1008oukmoa3b3lbqm';
    const url = `http://localhost:3000/api/superadmin/notifications/${notificationId}/read`;
    
    console.log(`Testing URL: ${url}`);
    
    // Note: This will fail without proper authentication, but it will help us see the error
    const response = await axios.patch(url, {}, {
      headers: {
        'Content-Type': 'application/json',
        // You would need to add a valid Authorization header here
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error details:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    console.log('Response:', error.response?.data);
  }
}

// Run the test
testNotificationRead();
