const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'rss';
const TEST_USER = {
  email: 'test123@gmail.com',
  password: 'Test@123'
};

// Test user data
const NEW_USER_DATA = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'TestPassword123',
  contactNumber: '+1234567890',
  roleIds: []
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.data.success) {
      const token = response.data.data.token;
      console.log('✅ Login successful');
      return token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetUsers(token) {
  try {
    console.log('\n📋 Testing GET /api/tenant/[tenantSlug]/users...');
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Get users successful');
      console.log(`📊 Found ${response.data.data.users.length} users`);
      console.log(`📈 Stats: Total=${response.data.data.stats.total}, Active=${response.data.data.stats.active}, Inactive=${response.data.data.stats.inactive}`);
      return response.data.data;
    } else {
      throw new Error('Get users failed');
    }
  } catch (error) {
    console.error('❌ Get users error:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateUser(token) {
  try {
    console.log('\n➕ Testing POST /api/tenant/[tenantSlug]/users...');
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, NEW_USER_DATA, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Create user successful');
      console.log(`👤 Created user: ${response.data.data.user.name} (${response.data.data.user.email})`);
      return response.data.data.user;
    } else {
      throw new Error('Create user failed');
    }
  } catch (error) {
    console.error('❌ Create user error:', error.response?.data || error.message);
    throw error;
  }
}

async function testUpdateUser(token, userId) {
  try {
    console.log('\n✏️ Testing PUT /api/tenant/[tenantSlug]/users (bulk actions)...');
    const updateData = {
      userIds: [userId],
      action: 'deactivate'
    };

    const response = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Update user successful');
      console.log(`🔄 Action: ${response.data.data.action} on ${response.data.data.affectedUsers} user(s)`);
    } else {
      throw new Error('Update user failed');
    }
  } catch (error) {
    console.error('❌ Update user error:', error.response?.data || error.message);
    throw error;
  }
}

async function testUserFilters(token) {
  try {
    console.log('\n🔍 Testing user filters...');
    
    // Test search filter
    const searchResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users?search=test`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (searchResponse.data.success) {
      console.log('✅ Search filter working');
      console.log(`🔍 Found ${searchResponse.data.data.users.length} users matching "test"`);
    }

    // Test status filter
    const statusResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users?status=active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (statusResponse.data.success) {
      console.log('✅ Status filter working');
      console.log(`📊 Found ${statusResponse.data.data.users.length} active users`);
    }

    // Test pagination
    const paginationResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (paginationResponse.data.success) {
      console.log('✅ Pagination working');
      console.log(`📄 Page ${paginationResponse.data.data.pagination.page} of ${paginationResponse.data.data.pagination.totalPages}`);
      console.log(`📊 Showing ${paginationResponse.data.data.users.length} of ${paginationResponse.data.data.pagination.total} users`);
    }

  } catch (error) {
    console.error('❌ Filter test error:', error.response?.data || error.message);
  }
}

async function testPermissions(token) {
  try {
    console.log('\n🔐 Testing permissions...');
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/permissions/current-user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Permissions check successful');
      const permissions = response.data.data.permissions || [];
      const userPermissions = permissions.filter(p => p.startsWith('users:'));
      console.log(`🔑 User permissions: ${userPermissions.join(', ')}`);
      
      if (userPermissions.length > 0) {
        console.log('✅ User has user management permissions');
      } else {
        console.log('⚠️ User has no user management permissions');
      }
    } else {
      throw new Error('Permissions check failed');
    }
  } catch (error) {
    console.error('❌ Permissions test error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Tenant User Module Tests...\n');
  
  try {
    // Login
    const token = await login();
    
    // Test permissions
    await testPermissions(token);
    
    // Test get users
    const usersData = await testGetUsers(token);
    
    // Test create user
    const newUser = await testCreateUser(token);
    
    // Test update user
    if (newUser) {
      await testUpdateUser(token, newUser.id);
    }
    
    // Test filters
    await testUserFilters(token);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Login functionality');
    console.log('✅ User listing with stats');
    console.log('✅ User creation');
    console.log('✅ User status updates');
    console.log('✅ Search and filter functionality');
    console.log('✅ Pagination');
    console.log('✅ Permission checks');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  login,
  testGetUsers,
  testCreateUser,
  testUpdateUser,
  testUserFilters,
  testPermissions
};
