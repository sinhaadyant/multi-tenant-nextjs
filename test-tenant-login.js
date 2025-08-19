const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp'; // Updated to match working tenant
const TEST_EMAIL = 'admin@acme-corp.com'; // Updated to match working user
const TEST_PASSWORD = 'AcmeAdmin123!'; // Updated to match working password

async function testTenantLogin() {
  console.log('🧪 Testing Tenant Login API...\n');

  try {
    // Test 1: Get tenant info
    console.log('1. Testing tenant info API...');
    const tenantInfoResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/info`);
    console.log('✅ Tenant info response:', tenantInfoResponse.data);
    console.log('');

    // Test 2: Test login API
    console.log('2. Testing tenant login API...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      tenantSlug: TENANT_SLUG,
      rememberMe: false
    });
    console.log('✅ Login response:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      hasToken: !!loginResponse.data.data?.token,
      hasUser: !!loginResponse.data.data?.user
    });
    console.log('');

    // Test 3: Test dashboard API with token
    if (loginResponse.data.data?.token) {
      console.log('3. Testing dashboard API with token...');
      const dashboardResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.token}`
        }
      });
      console.log('✅ Dashboard response:', {
        success: dashboardResponse.data.success,
        hasData: !!dashboardResponse.data.data
      });
      console.log('');
    }

    // Test 4: Test users API with token
    if (loginResponse.data.data?.token) {
      console.log('4. Testing users API with token...');
      const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.token}`
        }
      });
      console.log('✅ Users response:', {
        success: usersResponse.data.success,
        hasData: !!usersResponse.data.data
      });
      console.log('');
    }

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Login failed - check your test credentials');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Tenant not found - check your tenant slug');
    }
  }
}

// Run the test
testTenantLogin();
