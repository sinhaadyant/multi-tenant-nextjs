const axios = require('axios');

async function testUsersAPI() {
  try {
    console.log('🔍 Testing Users API directly...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'admin@techcorp.com',
      password: 'AdminPass123',
      tenantSlug: 'techcorp'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Got token');
    
    // Test users API with minimal parameters
    const usersResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Users API successful');
    console.log('Response:', JSON.stringify(usersResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Error message:', error.response?.data?.message);
    
    if (error.response?.data?.error) {
      console.error('Detailed error:', error.response.data.error);
    }
  }
}

testUsersAPI(); 