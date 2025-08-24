const axios = require('axios');

async function testSearchSimple() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';

  try {
    console.log('🔍 Testing Search API - Simple Test');
    console.log('==================================');

    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Superadmin login failed: ' + loginResponse.data.message);
    }

    const superadminToken = loginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Test search API with minimal query
    console.log('\n2. Testing search API with minimal query...');
    const searchResponse = await axios.get(`${BASE_URL}/api/search`, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: 'test',
        limit: 5
      }
    });

    console.log('✅ Search API successful!');
    console.log('📊 Response:', searchResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testSearchSimple();
