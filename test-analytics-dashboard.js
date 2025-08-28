const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'global-retail';
const TEST_USER = 'admin@global-retail.com';
const TEST_PASSWORD = 'Admin123!';

async function testAnalyticsDashboard() {
  console.log('🧪 Testing Analytics Dashboard...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER,
      password: TEST_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const { token } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Set up axios with auth token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test analytics summary
    console.log('2️⃣ Testing analytics summary...');
    const summaryResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { endpoint: 'summary' }
    });
    
    if (!summaryResponse.data.success) {
      throw new Error(`Analytics summary failed: ${summaryResponse.data.message}`);
    }

    console.log('✅ Analytics summary successful');
    console.log('📊 Summary data:', summaryResponse.data.data);

    // Step 3: Test user activity analytics
    console.log('\n3️⃣ Testing user activity analytics...');
    const userActivityResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { 
        endpoint: 'user-activity',
        period: 'daily',
        limit: 10
      }
    });
    
    if (!userActivityResponse.data.success) {
      throw new Error(`User activity analytics failed: ${userActivityResponse.data.message}`);
    }

    console.log('✅ User activity analytics successful');
    console.log('📊 User activity data points:', userActivityResponse.data.data.length);

    // Step 4: Test role distribution analytics
    console.log('\n4️⃣ Testing role distribution analytics...');
    const roleDistributionResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { endpoint: 'role-distribution' }
    });
    
    if (!roleDistributionResponse.data.success) {
      throw new Error(`Role distribution analytics failed: ${roleDistributionResponse.data.message}`);
    }

    console.log('✅ Role distribution analytics successful');
    console.log('📊 Role distribution data:', roleDistributionResponse.data.data);

    // Step 5: Test module usage analytics
    console.log('\n5️⃣ Testing module usage analytics...');
    const moduleUsageResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { endpoint: 'module-usage' }
    });
    
    if (!moduleUsageResponse.data.success) {
      throw new Error(`Module usage analytics failed: ${moduleUsageResponse.data.message}`);
    }

    console.log('✅ Module usage analytics successful');
    console.log('📊 Module usage data:', moduleUsageResponse.data.data);

    // Step 6: Test system metrics analytics
    console.log('\n6️⃣ Testing system metrics analytics...');
    const systemMetricsResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { 
        endpoint: 'system-metrics',
        period: 'daily',
        limit: 7
      }
    });
    
    if (!systemMetricsResponse.data.success) {
      throw new Error(`System metrics analytics failed: ${systemMetricsResponse.data.message}`);
    }

    console.log('✅ System metrics analytics successful');
    console.log('📊 System metrics data points:', systemMetricsResponse.data.data.length);

    // Step 7: Test user growth analytics
    console.log('\n7️⃣ Testing user growth analytics...');
    const userGrowthResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { 
        endpoint: 'user-growth',
        period: 'daily',
        limit: 30
      }
    });
    
    if (!userGrowthResponse.data.success) {
      throw new Error(`User growth analytics failed: ${userGrowthResponse.data.message}`);
    }

    console.log('✅ User growth analytics successful');
    console.log('📊 User growth data points:', userGrowthResponse.data.data.length);

    // Step 8: Test audit logs analytics
    console.log('\n8️⃣ Testing audit logs analytics...');
    const auditLogsResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { 
        endpoint: 'audit-logs',
        period: 'daily',
        limit: 10
      }
    });
    
    if (!auditLogsResponse.data.success) {
      throw new Error(`Audit logs analytics failed: ${auditLogsResponse.data.message}`);
    }

    console.log('✅ Audit logs analytics successful');
    console.log('📊 Audit logs data points:', auditLogsResponse.data.data.length);

    // Step 9: Test real-time analytics
    console.log('\n9️⃣ Testing real-time analytics...');
    const realtimeResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics`, {
      params: { endpoint: 'realtime' }
    });
    
    if (!realtimeResponse.data.success) {
      throw new Error(`Real-time analytics failed: ${realtimeResponse.data.message}`);
    }

    console.log('✅ Real-time analytics successful');
    console.log('📊 Real-time data:', realtimeResponse.data.data);

    // Step 10: Test CSV export
    console.log('\n🔟 Testing CSV export...');
    const csvExportResponse = await api.get(`/api/tenant/${TENANT_SLUG}/analytics/export`, {
      params: { 
        format: 'csv',
        chartId: 'user-activity'
      },
      responseType: 'blob'
    });
    
    if (csvExportResponse.status !== 200) {
      throw new Error(`CSV export failed: ${csvExportResponse.status}`);
    }

    console.log('✅ CSV export successful');
    console.log('📄 CSV file size:', csvExportResponse.data.length, 'bytes');

    // Step 11: Test frontend access
    console.log('\n1️⃣1️⃣ Testing frontend analytics page...');
    const frontendResponse = await api.get(`/${TENANT_SLUG}/analytics`);
    
    if (frontendResponse.status !== 200) {
      throw new Error(`Frontend analytics page failed: ${frontendResponse.status}`);
    }

    console.log('✅ Frontend analytics page accessible');

    console.log('\n🎉 All analytics dashboard tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Analytics summary API');
    console.log('✅ User activity analytics');
    console.log('✅ Role distribution analytics');
    console.log('✅ Module usage analytics');
    console.log('✅ System metrics analytics');
    console.log('✅ User growth analytics');
    console.log('✅ Audit logs analytics');
    console.log('✅ Real-time analytics');
    console.log('✅ CSV export functionality');
    console.log('✅ Frontend analytics page');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testAnalyticsDashboard();
