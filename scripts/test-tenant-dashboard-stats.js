const axios = require('axios');

async function testTenantDashboardStats() {
  const baseURL = 'http://localhost:3000';
  const tenantSlug = 'cons';
  const email = 'test11@gmail.com';
  const password = 'password123';

  try {
    console.log('🧪 Testing tenant dashboard stats...\n');

    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/tenant/${tenantSlug}/auth/login`, {
      email,
      password
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Test dashboard stats
    console.log('2️⃣ Testing dashboard stats...');
    const statsResponse = await axios.get(`${baseURL}/api/tenant/${tenantSlug}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!statsResponse.data.success) {
      throw new Error(`Dashboard stats failed: ${statsResponse.data.message}`);
    }

    const stats = statsResponse.data.data;
    console.log('✅ Dashboard stats retrieved successfully\n');

    // Step 3: Display stats
    console.log('📊 Dashboard Statistics:');
    console.log('========================');
    console.log(`Total Users: ${stats.summary?.totalUsers || 0}`);
    console.log(`Active Users: ${stats.summary?.activeUsers || 0}`);
    console.log(`New Users: ${stats.summary?.newUsers || 0}`);
    console.log(`Total Roles: ${stats.summary?.totalRoles || 0}`);
    console.log(`Total Audit Events: ${stats.summary?.totalAuditEvents || 0}`);
    console.log(`Total Reports: ${stats.summary?.totalReports || 0}`);
    console.log(`Total Notifications: ${stats.summary?.totalNotifications || 0}`);
    console.log(`User Growth: ${stats.summary?.userGrowth || 0}%`);
    console.log(`Audit Growth: ${stats.summary?.auditGrowth || 0}%`);

    // Step 4: Test audit logs
    console.log('\n3️⃣ Testing audit logs...');
    const auditResponse = await axios.get(`${baseURL}/api/tenant/${tenantSlug}/audit-logs?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!auditResponse.data.success) {
      throw new Error(`Audit logs failed: ${auditResponse.data.message}`);
    }

    const auditLogs = auditResponse.data.data.auditLogs;
    console.log(`✅ Audit logs retrieved successfully (${auditLogs.length} logs)\n`);

    // Step 5: Display recent audit logs
    console.log('📝 Recent Audit Logs:');
    console.log('=====================');
    auditLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} - ${log.user?.email || 'Unknown'} - ${new Date(log.createdAt).toLocaleString()}`);
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testTenantDashboardStats();
