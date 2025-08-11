const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing SuperAdmin login...');
    
    const response = await axios.post('http://localhost:3000/api/superadmin/auth/login', {
      email: 'admin@superadmin.com',
      password: 'Admin123!'
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('Token:', response.data.data.token);
    } else {
      console.log('❌ Login failed:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin(); 