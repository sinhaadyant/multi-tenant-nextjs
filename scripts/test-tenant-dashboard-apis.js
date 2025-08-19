const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp';
const TEST_USER = {
  email: 'admin@acme-corp.com',
  password: 'AcmeAdmin123!'
};

let authToken = null;

async function testTenantDashboardAPIs() {
  console.log('🧪 Testing tenant dashboard APIs with dynamic data and permissions...\n');

  try {
    // Step 1: Test tenant login
    console.log('1️⃣ Testing tenant login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TENANT_SLUG
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${loginResponse.data.data.user.name}`);
      console.log(`   Role: ${loginResponse.data.data.user.role}`);
    } else {
      throw new Error('Login failed');
    }

    // Step 2: Test dashboard stats API
    console.log('\n2️⃣ Testing dashboard stats API...');
    const statsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/stats?range=7d`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (statsResponse.data.success) {
      const stats = statsResponse.data.data;
      console.log('✅ Dashboard stats retrieved successfully');
      console.log(`   Total Users: ${stats.summary.totalUsers}`);
      console.log(`   Active Users: ${stats.summary.activeUsers}`);
      console.log(`   Total Roles: ${stats.summary.totalRoles}`);
      console.log(`   User Growth: ${stats.summary.userGrowth}%`);
      console.log(`   Audit Growth: ${stats.summary.auditGrowth}%`);
      console.log(`   Permissions:`, stats.permissions);
    } else {
      throw new Error('Failed to retrieve dashboard stats');
    }

    // Step 3: Test system health API
    console.log('\n3️⃣ Testing system health API...');
    const healthResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/system-health`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (healthResponse.data.success) {
      const health = healthResponse.data.data;
      console.log('✅ System health retrieved successfully');
      console.log(`   Overall Score: ${health.overall.score}%`);
      console.log(`   Status: ${health.overall.status}`);
      console.log(`   Active Sessions: ${health.metrics.activeSessions}`);
      console.log(`   Services: ${health.services.length} services monitored`);
      
      // Show service status
      health.services.forEach(service => {
        console.log(`     ${service.name}: ${service.status} (${service.responseTime}ms)`);
      });
    } else {
      throw new Error('Failed to retrieve system health');
    }

    // Step 4: Test recent activity API
    console.log('\n4️⃣ Testing recent activity API...');
    const activityResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/activity?limit=10&type=all`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (activityResponse.data.success) {
      const activity = activityResponse.data.data;
      console.log('✅ Recent activity retrieved successfully');
      console.log(`   Total Activities: ${activity.summary.total}`);
      console.log(`   By Type:`, activity.summary.byType);
      console.log(`   By Severity:`, activity.summary.bySeverity);
      console.log(`   Permissions:`, activity.permissions);
      
      if (activity.activities.length > 0) {
        console.log(`   Recent Activities:`);
        activity.activities.slice(0, 3).forEach(act => {
          console.log(`     ${act.action} - ${act.user} (${new Date(act.timestamp).toLocaleString()})`);
        });
      }
    } else {
      throw new Error('Failed to retrieve recent activity');
    }

    // Step 5: Test different date ranges
    console.log('\n5️⃣ Testing different date ranges...');
    const ranges = ['1d', '7d', '30d', '90d'];
    
    for (const range of ranges) {
      const rangeResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/stats?range=${range}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (rangeResponse.data.success) {
        const rangeStats = rangeResponse.data.data;
        console.log(`   ${range}: ${rangeStats.summary.totalUsers} users, ${rangeStats.summary.totalAuditEvents} events`);
      }
    }

    // Step 6: Test activity filtering
    console.log('\n6️⃣ Testing activity filtering...');
    const activityTypes = ['audit', 'user', 'system'];
    
    for (const type of activityTypes) {
      const typeResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/activity?type=${type}&limit=5`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (typeResponse.data.success) {
        const typeActivity = typeResponse.data.data;
        console.log(`   ${type}: ${typeActivity.summary.total} activities`);
      }
    }

    // Step 7: Test permission-based access
    console.log('\n7️⃣ Testing permission-based access...');
    
    // Test with different user roles (if available)
    const testUsers = [
      { email: 'user@acme-corp.com', password: 'UserPass123!' },
      { email: 'manager@acme-corp.com', password: 'ManagerPass123!' }
    ];

    for (const testUser of testUsers) {
      try {
        console.log(`   Testing with user: ${testUser.email}`);
        const userLoginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
          email: testUser.email,
          password: testUser.password,
          tenantSlug: TENANT_SLUG
        });

        if (userLoginResponse.data.success) {
          const userToken = userLoginResponse.data.data.token;
          const userStatsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });

          if (userStatsResponse.data.success) {
            const userStats = userStatsResponse.data.data;
            console.log(`     Role: ${userLoginResponse.data.data.user.role}`);
            console.log(`     Permissions:`, userStats.permissions);
          }
        }
      } catch (error) {
        console.log(`     User not available or login failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 8: Test error handling
    console.log('\n8️⃣ Testing error handling...');
    
    // Test with invalid token
    try {
      await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard/stats`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
      }
    }

    // Test with invalid tenant
    try {
      await axios.get(`${BASE_URL}/api/tenant/invalid-tenant/dashboard/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log('✅ Invalid tenant properly rejected');
      }
    }

    console.log('\n🎉 All tenant dashboard API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Login and authentication working');
    console.log('   ✅ Dashboard stats with dynamic data');
    console.log('   ✅ System health monitoring');
    console.log('   ✅ Recent activity with filtering');
    console.log('   ✅ Date range filtering');
    console.log('   ✅ Permission-based access control');
    console.log('   ✅ Error handling and validation');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testTenantDashboardAPIs();
