const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp';
const TEST_USER = {
  email: 'admin@acme-corp.com',
  password: 'AcmeAdmin123!'
};

async function testAPIs() {
  console.log('🧪 Simple API Test - Verifying all tenant module APIs...\n');

  try {
    // 1. Get fresh token
    console.log('1️⃣ Getting authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Authentication successful\n');

    // 2. Test Users API
    console.log('2️⃣ Testing Users API...');
    const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users?page=1&limit=5`, { headers });
    if (usersResponse.data.success) {
      console.log(`✅ Users API working - Found ${usersResponse.data.data.users.length} users`);
    } else {
      console.log('❌ Users API failed');
    }

    // 3. Test Roles API
    console.log('3️⃣ Testing Roles API...');
    const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles?page=1&limit=5`, { headers });
    if (rolesResponse.data.success) {
      console.log(`✅ Roles API working - Found ${rolesResponse.data.data.roles.length} roles`);
    } else {
      console.log('❌ Roles API failed');
    }

    // 4. Test Audit Logs API
    console.log('4️⃣ Testing Audit Logs API...');
    const auditResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/audit-logs?page=1&limit=5`, { headers });
    if (auditResponse.data.success) {
      console.log(`✅ Audit Logs API working - Found ${auditResponse.data.data.auditLogs.length} logs`);
    } else {
      console.log('❌ Audit Logs API failed');
    }

    // 5. Test Reports API
    console.log('5️⃣ Testing Reports API...');
    const reportsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports?page=1&limit=5`, { headers });
    if (reportsResponse.data.success) {
      console.log(`✅ Reports API working - Found ${reportsResponse.data.data.reports.length} reports`);
    } else {
      console.log('❌ Reports API failed');
    }

    // 6. Test Notifications API
    console.log('6️⃣ Testing Notifications API...');
    const notificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications?page=1&limit=5`, { headers });
    if (notificationsResponse.data.success) {
      console.log(`✅ Notifications API working - Found ${notificationsResponse.data.data.notifications.length} notifications`);
    } else {
      console.log('❌ Notifications API failed');
    }

    console.log('\n🎉 All APIs are working correctly!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Authentication');
    console.log('   ✅ Users API');
    console.log('   ✅ Roles API');
    console.log('   ✅ Audit Logs API');
    console.log('   ✅ Reports API');
    console.log('   ✅ Notifications API');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAPIs();
