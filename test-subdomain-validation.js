const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';

async function testSubdomainValidation() {
  console.log('🧪 Testing Subdomain Validation...\n');

  try {
    // Test 1: Check subdomain availability for new tenant (should be available)
    console.log('1. Testing subdomain check for new tenant (techcorp)');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=techcorp`);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Available:', response.data.data.available);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Check subdomain availability for existing tenant (should be taken)
    console.log('\n2. Testing subdomain check for existing tenant (techcorp)');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=techcorp`);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Available:', response.data.data.available);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Check subdomain availability for editing tenant (should be available if it's their own)
    console.log('\n3. Testing subdomain check for editing tenant (excluding tenant ID)');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=techcorp&excludeTenantId=cme63jpac0001ukmof66twwc2`);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Available:', response.data.data.available);
      console.log('   Excluded Tenant ID: cme63jpac0001ukmof66twwc2');
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 4: Check different subdomain for editing tenant (should be available)
    console.log('\n4. Testing different subdomain for editing tenant');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/check-subdomain?subdomain=newtechcorp&excludeTenantId=cme63jpac0001ukmof66twwc2`);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Available:', response.data.data.available);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSubdomainValidation(); 