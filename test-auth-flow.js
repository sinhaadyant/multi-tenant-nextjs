const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'rss';

// Test credentials
const credentials = {
  email: 'test123@gmail.com',
  password: 'Test@123',
  tenantSlug: TENANT_SLUG
};

async function testAuthFlow() {
  console.log('🧪 Testing Tenant Authentication Flow...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking server status...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not responding');
      console.log('   Please start the development server with: npm run dev');
      return;
    }

    // Test 2: Test login endpoint
    console.log('\n2️⃣ Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, credentials);
      
      if (loginResponse.data.success) {
        console.log('✅ Login successful');
        console.log(`   User: ${loginResponse.data.data.user.name}`);
        console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...`);
        
        const token = loginResponse.data.data.token;
        
        // Test 3: Test user profile endpoint
        console.log('\n3️⃣ Testing user profile endpoint...');
        try {
          const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (profileResponse.data.success) {
            console.log('✅ User profile fetched successfully');
            console.log(`   Permissions: ${profileResponse.data.data.permissions?.length || 0}`);
            console.log(`   Roles: ${profileResponse.data.data.roles?.length || 0}`);
          } else {
            console.log('❌ Failed to fetch user profile');
          }
        } catch (error) {
          console.log('❌ User profile endpoint error:', error.response?.status || error.message);
        }

        // Test 4: Test modules endpoint
        console.log('\n4️⃣ Testing modules endpoint...');
        try {
          const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (modulesResponse.data.success) {
            console.log('✅ Modules fetched successfully');
            console.log(`   Modules: ${modulesResponse.data.data.modules?.length || 0}`);
          } else {
            console.log('❌ Failed to fetch modules');
          }
        } catch (error) {
          console.log('❌ Modules endpoint error:', error.response?.status || error.message);
        }

        // Test 5: Test users endpoint
        console.log('\n5️⃣ Testing users endpoint...');
        try {
          const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (usersResponse.data.success) {
            console.log('✅ Users fetched successfully');
            console.log(`   Total users: ${usersResponse.data.data.users?.length || 0}`);
          } else {
            console.log('❌ Failed to fetch users');
          }
        } catch (error) {
          console.log('❌ Users endpoint error:', error.response?.status || error.message);
        }

        // Test 6: Test roles endpoint
        console.log('\n6️⃣ Testing roles endpoint...');
        try {
          const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (rolesResponse.data.success) {
            console.log('✅ Roles fetched successfully');
            console.log(`   Total roles: ${rolesResponse.data.data.roles?.length || 0}`);
          } else {
            console.log('❌ Failed to fetch roles');
          }
        } catch (error) {
          console.log('❌ Roles endpoint error:', error.response?.status || error.message);
        }

      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Login endpoint error:', error.response?.status || error.message);
      if (error.response?.data) {
        console.log('   Error details:', error.response.data);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Auth flow test completed!');
}

// Run the test
testAuthFlow();
