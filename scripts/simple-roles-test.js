const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@acme-corp.com',
  password: 'AcmeAdmin123!'
};

async function testRolesAPI() {
  try {
    console.log('🔐 Getting authentication token...');
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: 'acme-corp'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Test roles API
    console.log('\n🛡️ Testing Roles API...');
    const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (rolesResponse.data.success) {
      console.log('✅ Roles API working');
      console.log(`📊 Found ${rolesResponse.data.data.roles.length} roles`);
      console.log(`📈 Stats: Total=${rolesResponse.data.data.stats.total}, Active=${rolesResponse.data.data.stats.active}`);
    } else {
      console.log('❌ Roles API failed:', rolesResponse.data.message);
    }

    // Test modules API
    console.log('\n📦 Testing Modules API...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (modulesResponse.data.success) {
      console.log('✅ Modules API working');
      console.log(`📊 Found ${modulesResponse.data.data.modules.length} modules`);
    } else {
      console.log('❌ Modules API failed:', modulesResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testRolesAPI();
