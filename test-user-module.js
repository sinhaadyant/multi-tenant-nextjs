const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'rss';

async function testUserModule() {
  try {
    console.log('Testing Tenant User Module...');
    
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/auth/login`, {
      email: 'test123@gmail.com',
      password: 'Test@123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful');
      
      // Test get users
      const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersResponse.data.success) {
        console.log('✅ Get users successful');
        console.log(`Found ${usersResponse.data.data.users.length} users`);
        console.log(`Stats: Total=${usersResponse.data.data.stats.total}`);
      }
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUserModule();
