const axios = require('axios');

async function debugToken() {
  try {
    console.log('🔍 Debugging token and API access...');
    
    // First, let's try to login and get a token
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'admin@techcorp.com',
      password: 'AdminPass123',
      tenantSlug: 'techcorp'
    });
    
    console.log('✅ Login successful');
    console.log('Login response structure:', JSON.stringify(loginResponse.data, null, 2));
    
    // Extract token from response
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    
    if (!token) {
      console.error('❌ No token found in response');
      return;
    }
    
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Now let's try to access the users API with the token
    const usersResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/users?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Users API successful');
    console.log('Users count:', usersResponse.data.data.users.length);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔍 500 Error Details:');
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugToken(); 