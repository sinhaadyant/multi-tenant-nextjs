const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'flipkart';

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Testing Dynamic Analytics API...\n');

    // Test different date ranges
    const dateRanges = [
      { name: 'Last 7 Days', days: 7 },
      { name: 'Last 30 Days', days: 30 },
      { name: 'Last 60 Days', days: 60 },
      { name: 'Last 90 Days', days: 90 },
      { name: 'All Time', days: 1825 } // 5 years
    ];

    for (const range of dateRanges) {
      console.log(`📊 Testing ${range.name}...`);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - range.days);

      const params = {
        endpoint: 'user-activity',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        period: 'daily'
      };

      try {
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/analytics`, {
          params,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          console.log(`✅ ${range.name}: ${response.data.data?.length || 0} data points`);
          if (response.data.data && response.data.data.length > 0) {
            console.log(`   Sample data:`, response.data.data[0]);
          }
        } else {
          console.log(`❌ ${range.name}: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ ${range.name}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    // Test different endpoints
    console.log('\n🔍 Testing different endpoints...');
    const endpoints = [
      'summary',
      'user-activity',
      'role-distribution',
      'module-usage',
      'system-metrics',
      'user-growth',
      'audit-logs'
    ];

    for (const endpoint of endpoints) {
      console.log(`📈 Testing ${endpoint}...`);
      
      try {
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/analytics`, {
          params: { endpoint },
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          console.log(`✅ ${endpoint}: Success`);
          if (response.data.data) {
            if (Array.isArray(response.data.data)) {
              console.log(`   Data points: ${response.data.data.length}`);
            } else {
              console.log(`   Data type: ${typeof response.data.data}`);
            }
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Analytics API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAnalyticsAPI();
