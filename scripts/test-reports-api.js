const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'superadmin@example.com';
const TEST_PASSWORD = 'password123';

async function testReportsAPI() {
  console.log('🧪 Testing Reports API...\n');

  try {
    // Step 1: Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/superadmin/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Step 2: Test reports list with default filters
    console.log('2. Testing reports list with default filters...');
    const reportsResponse = await axios.get(`${BASE_URL}/api/superadmin/reports`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Reports list response:', {
      status: reportsResponse.status,
      reportsCount: reportsResponse.data.data.reports.length,
      pagination: reportsResponse.data.data.pagination
    });
    console.log('');

    // Step 3: Test reports list with search filter
    console.log('3. Testing reports list with search filter...');
    const searchResponse = await axios.get(`${BASE_URL}/api/superadmin/reports?search=test`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Search filter response:', {
      status: searchResponse.status,
      reportsCount: searchResponse.data.data.reports.length,
      searchQuery: 'test'
    });
    console.log('');

    // Step 4: Test reports list with pagination
    console.log('4. Testing reports list with pagination...');
    const paginationResponse = await axios.get(`${BASE_URL}/api/superadmin/reports?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Pagination response:', {
      status: paginationResponse.status,
      reportsCount: paginationResponse.data.data.reports.length,
      pagination: paginationResponse.data.data.pagination
    });
    console.log('');

    // Step 5: Test reports list with date filters
    console.log('5. Testing reports list with date filters...');
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const dateTo = new Date().toISOString();
    
    const dateFilterResponse = await axios.get(`${BASE_URL}/api/superadmin/reports?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Date filter response:', {
      status: dateFilterResponse.status,
      reportsCount: dateFilterResponse.data.data.reports.length,
      dateFrom,
      dateTo
    });
    console.log('');

    // Step 6: Test reports list with sorting
    console.log('6. Testing reports list with sorting...');
    const sortResponse = await axios.get(`${BASE_URL}/api/superadmin/reports?sortBy=createdAt&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Sort response:', {
      status: sortResponse.status,
      reportsCount: sortResponse.data.data.reports.length,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    console.log('');

    // Step 7: Test reports overview
    console.log('7. Testing reports overview...');
    const overviewResponse = await axios.get(`${BASE_URL}/api/superadmin/reports/overview`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Overview response:', {
      status: overviewResponse.status,
      overview: overviewResponse.data.data.overview,
      platformStats: overviewResponse.data.data.platformStats
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testReportsAPI();
