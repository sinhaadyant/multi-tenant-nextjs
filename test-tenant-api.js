const axios = require('axios');

// Test the tenant management API endpoints
async function testTenantAPI() {
  const baseURL = 'http://localhost:3000/api/superadmin/tenants';
  
  console.log('🧪 Testing Tenant Management API...\n');

  // Test cases to run
  const testCases = [
    {
      name: 'Basic tenants list',
      url: `${baseURL}?page=1&limit=10`,
      method: 'GET'
    },
    {
      name: 'Sort by name ascending',
      url: `${baseURL}?page=1&limit=10&sortBy=name&sortOrder=asc`,
      method: 'GET'
    },
    {
      name: 'Sort by status ascending',
      url: `${baseURL}?page=1&limit=10&sortBy=status&sortOrder=asc`,
      method: 'GET'
    },
    {
      name: 'Sort by userCount ascending',
      url: `${baseURL}?page=1&limit=10&sortBy=userCount&sortOrder=asc`,
      method: 'GET'
    },
    {
      name: 'Search tenants',
      url: `${baseURL}?page=1&limit=10&search=test`,
      method: 'GET'
    },
    {
      name: 'Filter by status',
      url: `${baseURL}?page=1&limit=10&status=active`,
      method: 'GET'
    },
    {
      name: 'Filter by plan',
      url: `${baseURL}?page=1&limit=10&plan=starter`,
      method: 'GET'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      console.log(`🔗 URL: ${testCase.url}`);
      
      const response = await axios({
        method: testCase.method,
        url: testCase.url,
        headers: {
          'Content-Type': 'application/json',
          // Note: You would need to add a valid Authorization header here
          // 'Authorization': 'Bearer YOUR_TOKEN'
        },
        timeout: 10000
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, {
        success: response.data.success,
        message: response.data.message,
        data: {
          tenantsCount: response.data.data?.tenants?.length || 0,
          totalRecords: response.data.data?.pagination?.totalRecords || 0,
          totalPages: response.data.data?.pagination?.totalPages || 0,
          stats: response.data.data?.stats || {}
        }
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.code}`);
      console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data?.error) {
        console.log(`🔍 Details: ${error.response.data.error}`);
      }
    }
    
    console.log('─'.repeat(80) + '\n');
  }
}

// Run the test
testTenantAPI().catch(console.error);
