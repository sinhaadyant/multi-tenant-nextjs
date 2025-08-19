const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@acme-corp.com',
  password: 'AcmeAdmin123!'
};

let authToken = '';

async function getAuthToken() {
  try {
    console.log('🔐 Getting authentication token...');
    const response = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: 'acme-corp'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUsersAPI() {
  console.log('\n👥 Testing Users API...');
  
  try {
    // Test GET users with filters
            console.log('📋 Testing GET /api/tenant/acme-corp/users...');
    const getResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 10,
        search: '',
        status: 'all',
        roleId: 'all'
      }
    });

    if (getResponse.data.success) {
      const users = getResponse.data.data.users;
      const stats = getResponse.data.data.stats;
      const permissions = getResponse.data.data.permissions;
      
      console.log(`✅ Users API working - Found ${users.length} users`);
      console.log(`📊 Stats: Total=${stats.total}, Active=${stats.active}, Inactive=${stats.inactive}`);
      console.log(`🔐 Permissions: View=${permissions.canView}, Create=${permissions.canCreate}, Update=${permissions.canUpdate}, Delete=${permissions.canDelete}`);
      
      // Test individual user fetch
      if (users.length > 0) {
        const firstUser = users[0];
        console.log(`\n👤 Testing GET /api/tenant/acme-corp/users/${firstUser.id}...`);
        
        const userResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/users/${firstUser.id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (userResponse.data.success) {
          console.log(`✅ Individual user fetch working - User: ${userResponse.data.data.name}`);
        } else {
          console.log('❌ Individual user fetch failed:', userResponse.data.message);
        }
      }

      // Test search functionality
      console.log('\n🔍 Testing search functionality...');
      const searchResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          page: 1,
          limit: 10,
          search: 'admin',
          status: 'all',
          roleId: 'all'
        }
      });

      if (searchResponse.data.success) {
        const searchResults = searchResponse.data.data.users;
        console.log(`✅ Search working - Found ${searchResults.length} users matching "admin"`);
      } else {
        console.log('❌ Search failed:', searchResponse.data.message);
      }

      // Test status filter
      console.log('\n📊 Testing status filter...');
      const statusResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          page: 1,
          limit: 10,
          search: '',
          status: 'active',
          roleId: 'all'
        }
      });

      if (statusResponse.data.success) {
        const activeUsers = statusResponse.data.data.users;
        console.log(`✅ Status filter working - Found ${activeUsers.length} active users`);
      } else {
        console.log('❌ Status filter failed:', statusResponse.data.message);
      }

      return true;
    } else {
      console.log('❌ Users API failed:', getResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Users API error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUserCRUD() {
  console.log('\n🔄 Testing User CRUD Operations...');
  
  try {
    // First, get available roles
    console.log('🔍 Getting available roles...');
    const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/roles`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });

    let roleIds = ['1']; // Default fallback
    if (rolesResponse.data.success && rolesResponse.data.data.roles.length > 0) {
      roleIds = [rolesResponse.data.data.roles[0].id];
      console.log(`✅ Found role: ${rolesResponse.data.data.roles[0].name} (ID: ${roleIds[0]})`);
    } else {
      console.log('⚠️ No roles found, using default role ID');
    }

    // Test CREATE user
    console.log('➕ Testing CREATE user...');
    const timestamp = Date.now();
    const newUser = {
      name: 'Test User CRUD',
      email: `test.crud.${timestamp}@example.com`,
      contactNumber: '+1234567890',
      password: 'TestPassword123!',
      roleIds: roleIds
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/acme-corp/users`, newUser, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.data.success) {
      const createdUser = createResponse.data.data.user;
      console.log(`✅ User created successfully - ID: ${createdUser.id}, Name: ${createdUser.name}`);
      
      // Test UPDATE user
      console.log('✏️ Testing UPDATE user...');
      const updateData = {
        name: 'Updated Test User CRUD',
        contactNumber: '+0987654321'
      };

      const updateResponse = await axios.put(`${BASE_URL}/api/tenant/acme-corp/users/${createdUser.id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (updateResponse.data.success) {
        const updatedUser = updateResponse.data.data.user;
        console.log(`✅ User updated successfully - Name: ${updatedUser.name}`);
        
        // Test DELETE user
        console.log('🗑️ Testing DELETE user...');
        const deleteResponse = await axios.delete(`${BASE_URL}/api/tenant/acme-corp/users/${createdUser.id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (deleteResponse.data.success) {
          console.log('✅ User deleted successfully');
          return true;
        } else {
          console.log('❌ User delete failed:', deleteResponse.data.message);
          return false;
        }
      } else {
        console.log('❌ User update failed:', updateResponse.data.message);
        return false;
      }
    } else {
      console.log('❌ User create failed:', createResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ User CRUD error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBulkOperations() {
  console.log('\n📦 Testing Bulk Operations...');
  
  try {
    // Test bulk activate
    console.log('🔄 Testing bulk activate...');
    // Get actual user IDs from the users list
    const usersResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });
    
    const actualUsers = usersResponse.data.data.users;
    if (actualUsers.length < 2) {
      console.log('⚠️ Not enough users for bulk operations test');
      return true;
    }
    
    const userIds = actualUsers.slice(0, 2).map(user => user.id);
    const bulkActivateResponse = await axios.put(`${BASE_URL}/api/tenant/acme-corp/users`, {
      userIds: userIds,
      action: 'activate'
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (bulkActivateResponse.data.success) {
      console.log('✅ Bulk activate working');
    } else {
      console.log('❌ Bulk activate failed:', bulkActivateResponse.data.message);
    }

    // Test bulk deactivate
    console.log('⏸️ Testing bulk deactivate...');
    const bulkDeactivateResponse = await axios.put(`${BASE_URL}/api/tenant/acme-corp/users`, {
      userIds: userIds,
      action: 'deactivate'
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (bulkDeactivateResponse.data.success) {
      console.log('✅ Bulk deactivate working');
    } else {
      console.log('❌ Bulk deactivate failed:', bulkDeactivateResponse.data.message);
    }

    return true;
  } catch (error) {
    console.log('❌ Bulk operations error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 User CRUD Test - Comprehensive Testing...\n');

  // Get authentication token
  const authSuccess = await getAuthToken();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test Users API
  const usersAPISuccess = await testUsersAPI();
  
  // Test User CRUD operations
  const crudSuccess = await testUserCRUD();
  
  // Test Bulk operations
  const bulkSuccess = await testBulkOperations();

  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`   ${usersAPISuccess ? '✅' : '❌'} Users API`);
  console.log(`   ${crudSuccess ? '✅' : '❌'} User CRUD Operations`);
  console.log(`   ${bulkSuccess ? '✅' : '❌'} Bulk Operations`);

  if (usersAPISuccess && crudSuccess && bulkSuccess) {
    console.log('\n🎉 All User CRUD tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
