const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@superadmin.com';
const TEST_PASSWORD = 'AdminPass123';

async function testSubdomainChecking() {
  console.log('🧪 Testing Subdomain Checking Functionality...\n');

  try {
    // Step 1: Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Step 2: Test valid subdomain format
    console.log('2. Testing valid subdomain format...');
    const validSubdomains = [
      'test-company',
      'mycompany123',
      'company-name',
      'test123'
    ];

    for (const subdomain of validSubdomains) {
      try {
        const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=${subdomain}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log(`✅ Subdomain "${subdomain}": ${response.data.data.available ? 'Available' : 'Taken'}`);
      } catch (error) {
        console.log(`❌ Subdomain "${subdomain}": ${error.response?.data?.message || 'Error'}`);
      }
    }
    console.log('');

    // Step 3: Test invalid subdomain formats
    console.log('3. Testing invalid subdomain formats...');
    const invalidSubdomains = [
      'test', // too short
      'test-', // ends with dash
      '-test', // starts with dash
      'test@company', // invalid characters
      'TEST-COMPANY', // uppercase
      'test company', // spaces
      'a'.repeat(51) // too long
    ];

    for (const subdomain of invalidSubdomains) {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=${subdomain}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log(`❌ Subdomain "${subdomain}": Should have been rejected`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`✅ Subdomain "${subdomain}": Correctly rejected - ${error.response.data.message}`);
        } else {
          console.log(`❌ Subdomain "${subdomain}": Unexpected error - ${error.response?.data?.message || 'Unknown error'}`);
        }
      }
    }
    console.log('');

    // Step 4: Test missing subdomain parameter
    console.log('4. Testing missing subdomain parameter...');
    try {
      await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Should have been rejected for missing subdomain parameter');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected missing subdomain parameter');
      } else {
        console.log(`❌ Unexpected error for missing subdomain: ${error.response?.data?.message || 'Unknown error'}`);
      }
    }
    console.log('');

    // Step 5: Test without authentication
    console.log('5. Testing without authentication...');
    try {
      await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=test`);
      console.log('❌ Should have been rejected for missing authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected without authentication');
      } else {
        console.log(`❌ Unexpected error for missing auth: ${error.response?.data?.message || 'Unknown error'}`);
      }
    }
    console.log('');

    // Step 6: Test excludeTenantId parameter
    console.log('6. Testing excludeTenantId parameter...');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=test-company&excludeTenantId=test-id`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log(`✅ excludeTenantId parameter works: ${response.data.data.available ? 'Available' : 'Taken'}`);
    } catch (error) {
      console.log(`❌ excludeTenantId parameter failed: ${error.response?.data?.message || 'Unknown error'}`);
    }
    console.log('');

    console.log('🎉 All subdomain checking tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSubdomainChecking();
