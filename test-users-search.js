const axios = require('axios');

async function testUsersSearch() {
  const baseURL = 'http://localhost:3000/api/superadmin';
  
  console.log('🔍 Testing Users API...\n');

  // Step 1: Authenticate
  console.log('🔐 Step 1: Authenticating...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@superadmin.com',
      password: 'AdminPass123',
      rememberMe: false
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success) {
      const authToken = loginResponse.data.data.token;
      console.log('✅ Authentication successful!');
      
      // Step 2: Test basic users API (without search)
      console.log('\n🔍 Step 2: Testing basic users API...');
      
      try {
        const basicResponse = await axios.get(`${baseURL}/users?page=1&limit=10`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        console.log('✅ Basic Response:', basicResponse.status);
        console.log('📊 Users Count:', basicResponse.data.data?.users?.length || 0);
        
      } catch (basicError) {
        console.log('❌ Basic Error:', basicError.response?.status);
        console.log('📝 Error Message:', basicError.response?.data?.message);
      }
      
      // Step 3: Test users search API
      console.log('\n🔍 Step 3: Testing users search API...');
      
      try {
        const searchResponse = await axios.get(`${baseURL}/users?page=1&limit=10&search=test`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        console.log('✅ Search Response:', searchResponse.status);
        console.log('📊 Users Count:', searchResponse.data.data?.users?.length || 0);
        
      } catch (searchError) {
        console.log('❌ Search Error:', searchError.response?.status);
        console.log('📝 Error Message:', searchError.response?.data?.message);
        console.log('🔍 Error Details:', searchError.response?.data?.error);
      }
      
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
  }
}

testUsersSearch().catch(console.error);
