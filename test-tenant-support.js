const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!'
};

async function testTenantSupport() {
  let token = null;
  let tenantSlug = 'global-retail';

  try {
    console.log('🔍 Testing Tenant Support Module...');

    // Step 1: Login as tenant user
    console.log('\n📝 Step 1: Logging in as tenant user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, TENANT_CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('Tenant login failed: ' + loginResponse.data.message);
    }

    token = loginResponse.data.data.token;
    console.log('✅ Tenant login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test support tickets list
    console.log('\n📝 Step 2: Testing support tickets list...');
    const listResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/support`, { headers });
    
    if (listResponse.data.success) {
      console.log('✅ Support tickets list working');
      console.log('   Total tickets:', listResponse.data.data.tickets?.length || 0);
    }

    // Step 3: Test frontend URLs
    console.log('\n📝 Step 3: Testing frontend URLs...');
    
    try {
      const listPageResponse = await axios.get(`${BASE_URL}/${tenantSlug}/support-tickets`);
      console.log('✅ Tenant support tickets list page working (returns HTML)');
    } catch (error) {
      console.log('❌ Tenant support tickets list page failed:', error.message);
    }

    console.log('\n🎉 Tenant support test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testTenantSupport();
