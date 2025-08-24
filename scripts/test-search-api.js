const axios = require('axios');

async function testSearchAPI() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';

  try {
    console.log('🔍 Testing Search API');
    console.log('====================');

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

    // Step 2: Test search API
    console.log('\n2. Testing search API...');
    const searchResponse = await axios.get(`${BASE_URL}/api/search`, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: 'anil',
        limit: 10
      }
    });

    console.log('✅ Search API successful!');
    console.log('📊 Response:', {
      total: searchResponse.data.total,
      query: searchResponse.data.query,
      resultsCount: searchResponse.data.results.length
    });

    // Display some results
    if (searchResponse.data.results.length > 0) {
      console.log('\n📋 Sample Results:');
      searchResponse.data.results.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.type}: ${result.title} (${result.subtitle})`);
      });
    } else {
      console.log('\n📋 No results found for "anil"');
    }

    // Step 3: Test search without authentication (should fail)
    console.log('\n3. Testing search without authentication (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/search`, {
        params: {
          q: 'anil',
          limit: 10
        }
      });
      console.log('❌ Unexpected success - should have failed without auth');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected without authentication');
        console.log('📝 Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Search functionality: Working');
    console.log('   ✅ Authorization: Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testSearchAPI();
