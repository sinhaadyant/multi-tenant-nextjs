const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to run a test
async function runTest(name, testFn) {
  try {
    console.log(`🧪 Testing: ${name}`);
    const result = await testFn();
    console.log(`✅ PASS: ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'PASS', result });
    return result;
  } catch (error) {
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    return null;
  }
}

// Test functions
async function testBasicAPI() {
  const response = await axios.get(`${BASE_URL}/api/test`);
  return response.data;
}

async function testDatabaseAPI() {
  const response = await axios.get(`${BASE_URL}/api/test/db`);
  return response.data;
}

async function testDashboardAPI() {
  const response = await axios.get(`${BASE_URL}/api/test/dashboard`);
  return response.data;
}

async function testTenantDashboardAPI() {
  const response = await axios.get(`${BASE_URL}/api/test/tenant-dashboard?tenantSlug=rss`);
  return response.data;
}

async function testTenantInfoAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/info`);
  return response.data;
}

async function testTenantLoginAPI() {
  const response = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
    email: 'test321@gmail.com',
    password: 'password123'
  });
  return response.data;
}

async function testTenantDashboardStatsAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/dashboard/stats`);
  return response.data;
}

async function testTenantDashboardActivityAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/dashboard/activity?limit=10&type=all`);
  return response.data;
}

async function testTenantDashboardSystemHealthAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/dashboard/system-health`);
  return response.data;
}

async function testTenantUsersAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/users?page=1&limit=10`);
  return response.data;
}

async function testTenantRolesAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/roles?page=1&limit=10`);
  return response.data;
}

async function testTenantAuditAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/audit?page=1&limit=10`);
  return response.data;
}

async function testTenantModulesAPI() {
  const response = await axios.get(`${BASE_URL}/api/tenant/rss/modules`);
  return response.data;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');

  // Basic tests
  await runTest('Basic API', testBasicAPI);
  await runTest('Database API', testDatabaseAPI);
  await runTest('Dashboard API', testDashboardAPI);
  await runTest('Tenant Dashboard API (Test)', testTenantDashboardAPI);

  console.log('\n📋 Tenant API Tests:\n');

  // Tenant-specific tests
  await runTest('Tenant Info API', testTenantInfoAPI);
  await runTest('Tenant Login API', testTenantLoginAPI);
  await runTest('Tenant Dashboard Stats API', testTenantDashboardStatsAPI);
  await runTest('Tenant Dashboard Activity API', testTenantDashboardActivityAPI);
  await runTest('Tenant Dashboard System Health API', testTenantDashboardSystemHealthAPI);
  await runTest('Tenant Users API', testTenantUsersAPI);
  await runTest('Tenant Roles API', testTenantRolesAPI);
  await runTest('Tenant Audit API', testTenantAuditAPI);
  await runTest('Tenant Modules API', testTenantModulesAPI);

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.status === 'FAIL') {
      console.log(`   Error: ${test.error}`);
    }
  });

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
