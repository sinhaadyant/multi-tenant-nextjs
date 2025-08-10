const axios = require('axios');

async function testPermissionsAPI() {
  try {
    console.log('🧪 Testing Permissions API...');
    
    // Test without authentication (should return 401)
    console.log('\n1. Testing without authentication...');
    try {
      const response = await axios.get('http://localhost:3000/api/tenant/test-tenant/permissions/current-user');
      console.log('❌ Expected 401 but got:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 for missing authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test with invalid token (should return 401)
    console.log('\n2. Testing with invalid token...');
    try {
      const response = await axios.get('http://localhost:3000/api/tenant/test-tenant/permissions/current-user', {
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      });
      console.log('❌ Expected 401 but got:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 for invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test with valid token (if you have one)
    console.log('\n3. Testing with valid token...');
    console.log('⚠️  This test requires a valid JWT token. You can get one by logging in through the app.');
    console.log('   To test this, you would need to:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Login to a tenant');
    console.log('   3. Copy the JWT token from localStorage');
    console.log('   4. Update this script with the token');
    
    // Example of how to test with a valid token:
    /*
    const validToken = 'your-jwt-token-here';
    try {
      const response = await axios.get('http://localhost:3000/api/tenant/test-tenant/permissions/current-user', {
        headers: {
          Authorization: `Bearer ${validToken}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ API returned successful response');
        console.log('📊 User permissions data structure:');
        console.log('- user:', !!response.data.data.user);
        console.log('- permissions array:', Array.isArray(response.data.data.permissions));
        console.log('- modulePermissions object:', typeof response.data.data.modulePermissions === 'object');
        console.log('- accessibleModules array:', Array.isArray(response.data.data.accessibleModules));
        console.log('- menuItems array:', Array.isArray(response.data.data.menuItems));
        console.log('- hasAccess boolean:', typeof response.data.data.hasAccess === 'boolean');
        console.log('- totalPermissions number:', typeof response.data.data.totalPermissions === 'number');
        console.log('- totalModules number:', typeof response.data.data.totalModules === 'number');
      } else {
        console.log('❌ API returned error:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Error with valid token:', error.response?.status, error.response?.data);
    }
    */

    console.log('\n✅ Permissions API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPermissionsAPI(); 