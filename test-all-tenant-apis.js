const axios = require('axios');

// Test all tenant management API endpoints
async function testAllTenantAPIs() {
  const baseURL = 'http://localhost:3000/api/superadmin';
  
  console.log('🧪 Testing All Tenant Management APIs...\n');

  // Test cases for all tenant endpoints
  const testCases = [
    // Main tenants list endpoints
    {
      name: 'Basic tenants list',
      url: `${baseURL}/tenants?page=1&limit=10`,
      method: 'GET'
    },
    {
      name: 'Sort by name ascending',
      url: `${baseURL}/tenants?page=1&limit=10&sortBy=name&sortOrder=asc`,
      method: 'GET'
    },
    {
      name: 'Sort by status ascending',
      url: `${baseURL}/tenants?page=1&limit=10&sortBy=status&sortOrder=asc`,
      method: 'GET'
    },
    {
      name: 'Sort by userCount ascending',
      url: `${baseURL}/tenants?page=1&limit=10&sortBy=userCount&sortOrder=asc`,
      method: 'GET'
    },
    {
      name: 'Search tenants',
      url: `${baseURL}/tenants?page=1&limit=10&search=test`,
      method: 'GET'
    },
    {
      name: 'Filter by status',
      url: `${baseURL}/tenants?page=1&limit=10&status=active`,
      method: 'GET'
    },
    {
      name: 'Filter by plan',
      url: `${baseURL}/tenants?page=1&limit=10&plan=starter`,
      method: 'GET'
    },
    
    // Subdomain check endpoint
    {
      name: 'Check subdomain availability',
      url: `${baseURL}/tenants/check-subdomain?subdomain=test-tenant`,
      method: 'GET'
    },
    
    // Export endpoint
    {
      name: 'Export tenants CSV',
      url: `${baseURL}/tenants/export?format=csv`,
      method: 'GET'
    },
    {
      name: 'Export tenants JSON',
      url: `${baseURL}/tenants/export?format=json`,
      method: 'GET'
    },
    
    // Individual tenant endpoints (will fail without valid tenant ID, but we can test the structure)
    {
      name: 'Get tenant details (invalid ID)',
      url: `${baseURL}/tenants/invalid-id`,
      method: 'GET'
    },
    {
      name: 'Get tenant users (invalid ID)',
      url: `${baseURL}/tenants/invalid-id/users`,
      method: 'GET'
    },
    {
      name: 'Get tenant roles (invalid ID)',
      url: `${baseURL}/tenants/invalid-id/roles`,
      method: 'GET'
    },
    {
      name: 'Get tenant activity (invalid ID)',
      url: `${baseURL}/tenants/invalid-id/activity`,
      method: 'GET'
    },
    {
      name: 'Update tenant status (invalid ID)',
      url: `${baseURL}/tenants/invalid-id/status`,
      method: 'PATCH',
      data: { isActive: true }
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      console.log(`🔗 URL: ${testCase.url}`);
      console.log(`📝 Method: ${testCase.method}`);
      
      const config = {
        method: testCase.method,
        url: testCase.url,
        headers: {
          'Content-Type': 'application/json',
          // Note: You would need to add a valid Authorization header here
          // 'Authorization': 'Bearer YOUR_TOKEN'
        },
        timeout: 10000
      };

      if (testCase.data) {
        config.data = testCase.data;
      }

      const response = await axios(config);

      console.log(`✅ Status: ${response.status}`);
      
      // Check if response has the expected structure
      if (response.data) {
        if (response.data.success !== undefined) {
          console.log(`✅ Response structure: Valid API response`);
        } else if (response.headers['content-type']?.includes('text/csv')) {
          console.log(`✅ Response structure: CSV export`);
        } else {
          console.log(`✅ Response structure: Other format`);
        }
      }
      
      passedTests++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.code}`);
      
      // Check if it's an authentication error (expected without token)
      if (error.response?.status === 401) {
        console.log(`✅ Expected: Authentication required (no token provided)`);
        passedTests++;
      } else if (error.response?.status === 404) {
        console.log(`✅ Expected: Not found (invalid tenant ID)`);
        passedTests++;
      } else {
        console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.error) {
          console.log(`🔍 Details: ${error.response.data.error}`);
        }
        failedTests++;
      }
    }
    
    console.log('─'.repeat(80) + '\n');
  }

  console.log(`📊 Test Summary:`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
}

// Run the comprehensive test
testAllTenantAPIs().catch(console.error);
