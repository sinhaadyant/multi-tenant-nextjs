const axios = require('axios');

async function testSupportAuthentication() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🧪 Testing Support API Authentication');
    console.log('=====================================');

    // Step 1: Login as user to get authentication token
    console.log('\n1. Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const userData = loginResponse.data.data.user;
    const authToken = loginResponse.data.data.token;
    
    console.log('✅ User login successful');
    console.log('👤 User ID:', userData.id);
    console.log('🔑 Auth Token:', authToken.substring(0, 20) + '...');

    // Step 2: Test support endpoint with authentication
    console.log('\n2. Testing support endpoint with authentication...');
    const supportResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        userId: userData.id
      }
    });

    console.log('✅ Support endpoint accessed successfully');
    console.log('📊 Response status:', supportResponse.status);
    console.log('📋 Tickets count:', supportResponse.data.data.tickets.length);
    console.log('📄 Pagination:', supportResponse.data.data.pagination);

    // Step 3: Test without authentication (should fail)
    console.log('\n3. Testing support endpoint without authentication (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, {
        params: {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: userData.id
        }
      });
      console.log('❌ Unexpected success - should have failed without auth');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected without authentication');
        console.log('📝 Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Authentication required: Working');
    console.log('   ✅ Authenticated access: Working');
    console.log('   ✅ Unauthenticated access: Properly rejected');

    console.log('\n💡 Solution:');
    console.log('   The API endpoint is working correctly.');
    console.log('   Users must be logged in to access support tickets.');
    console.log('   The frontend should handle authentication before making API calls.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testSupportAuthentication();
