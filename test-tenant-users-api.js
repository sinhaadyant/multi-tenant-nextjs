const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'test-tenant-id'; // You'll need to replace this with a real tenant ID

async function testTenantUsersAPI() {
  console.log('🧪 Testing Tenant Users API...\n');

  try {
    // Test 1: Get tenant users
    console.log('1. Testing GET /api/superadmin/tenants/[id]/users');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/${TEST_TENANT_ID}/users`);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Data structure:', {
        hasUsers: !!response.data.data?.users,
        hasStats: !!response.data.data?.stats,
        hasPagination: !!response.data.meta?.pagination,
        userCount: response.data.data?.users?.length || 0,
        totalUsers: response.data.data?.stats?.total || 0
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Get tenant users with filters
    console.log('\n2. Testing GET /api/superadmin/tenants/[id]/users with filters');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/${TEST_TENANT_ID}/users?page=1&limit=5&search=test&status=active`);
      console.log('✅ Success:', response.status, response.data.message);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Get tenant activity logs
    console.log('\n3. Testing GET /api/superadmin/tenants/[id]/activity');
    try {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/${TEST_TENANT_ID}/activity`);
      console.log('✅ Success:', response.status, response.data.message);
      console.log('   Data structure:', {
        hasAuditLogs: !!response.data.data?.auditLogs,
        hasPagination: !!response.data.meta?.pagination,
        logCount: response.data.data?.auditLogs?.length || 0
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTenantUsersAPI(); 