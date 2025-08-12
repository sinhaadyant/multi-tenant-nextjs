const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@superadmin.com';
const TEST_PASSWORD = 'AdminPass123';

async function testNotificationSearch() {
  console.log('🧪 Testing Notification Search Functionality...\n');

  try {
    // Step 1: Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Step 2: Test basic notifications fetch
    console.log('2. Testing basic notifications fetch...');
    const basicResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (basicResponse.status === 200) {
      console.log('✅ Basic notifications fetch working');
      console.log(`Found ${basicResponse.data.data.notifications.length} notifications`);
    } else {
      console.log('❌ Basic notifications fetch failed');
    }

    // Step 3: Test search with empty string
    console.log('3. Testing search with empty string...');
    const emptySearchResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications?search=`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (emptySearchResponse.status === 200) {
      console.log('✅ Empty search working');
    } else {
      console.log('❌ Empty search failed');
    }

    // Step 4: Test search with valid term
    console.log('4. Testing search with valid term...');
    const validSearchResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications?search=test`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (validSearchResponse.status === 200) {
      console.log('✅ Valid search working');
      console.log(`Found ${validSearchResponse.data.data.notifications.length} matching notifications`);
    } else {
      console.log('❌ Valid search failed');
    }

    // Step 5: Test search with special characters
    console.log('5. Testing search with special characters...');
    const specialSearchResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications?search=test@123`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (specialSearchResponse.status === 200) {
      console.log('✅ Special characters search working');
    } else {
      console.log('❌ Special characters search failed');
    }

    // Step 6: Test search with very long term
    console.log('6. Testing search with very long term...');
    const longSearchTerm = 'a'.repeat(150); // Longer than 100 character limit
    const longSearchResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications?search=${longSearchTerm}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (longSearchResponse.status === 200) {
      console.log('✅ Long search term handling working');
    } else {
      console.log('❌ Long search term handling failed');
    }

    // Step 7: Test search with filters
    console.log('7. Testing search with additional filters...');
    const filteredSearchResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications?search=test&status=sent&type=info`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (filteredSearchResponse.status === 200) {
      console.log('✅ Filtered search working');
    } else {
      console.log('❌ Filtered search failed');
    }

    console.log('\n🎉 Notification search testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.error('Server error details:', error.response.data);
    }
  }
}

// Run the test
testNotificationSearch();
