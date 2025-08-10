const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme';

async function testTenantUsersAccess() {
  console.log('🔍 Testing tenant users page access...\n');

  try {
    // Test 1: Check if the page loads without authentication
    console.log('1. Testing page access without authentication...');
    try {
      const response = await axios.get(`${BASE_URL}/${TENANT_SLUG}/users`, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status code
      });
      console.log(`   Status: ${response.status}`);
      console.log(`   Response length: ${response.data?.length || 'N/A'}`);
      
      if (response.status === 200) {
        console.log('   ✅ Page is accessible without authentication');
      } else if (response.status === 401 || response.status === 403) {
        console.log('   🔒 Page requires authentication (expected)');
      } else {
        console.log('   ⚠️  Unexpected status code');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 2: Check if the API endpoint is accessible
    console.log('\n2. Testing API endpoint access...');
    try {
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('   🔒 API requires authentication (expected)');
      } else if (response.status === 200) {
        console.log('   ✅ API is accessible');
        console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        console.log(`   ⚠️  Unexpected API status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ API Error: ${error.message}`);
    }

    // Test 3: Check if tenant info is accessible
    console.log('\n3. Testing tenant info endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/info`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ Tenant info is accessible');
        console.log(`   Tenant: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        console.log(`   ⚠️  Tenant info status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Tenant info error: ${error.message}`);
    }

    // Test 4: Check if the login page is accessible
    console.log('\n4. Testing login page access...');
    try {
      const response = await axios.get(`${BASE_URL}/${TENANT_SLUG}/login`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ Login page is accessible');
      } else {
        console.log(`   ⚠️  Login page status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Login page error: ${error.message}`);
    }

    // Test 5: Check if dashboard is accessible
    console.log('\n5. Testing dashboard access...');
    try {
      const response = await axios.get(`${BASE_URL}/${TENANT_SLUG}/dashboard`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ Dashboard is accessible');
      } else if (response.status === 401 || response.status === 403) {
        console.log('   🔒 Dashboard requires authentication (expected)');
      } else {
        console.log(`   ⚠️  Dashboard status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Dashboard error: ${error.message}`);
    }

    console.log('\n📋 Summary:');
    console.log('- If pages return 401/403, authentication is required');
    console.log('- If pages return 404, the route might not exist');
    console.log('- If pages return 500, there might be a server error');
    console.log('- Check browser console for JavaScript errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTenantUsersAccess(); 