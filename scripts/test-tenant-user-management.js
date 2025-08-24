const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function testTenantUserManagement() {
  console.log('🧪 Testing Tenant User Management...\n');

  let authToken = '';
  let testUserId = '';

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

    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Set up axios with auth token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test GET users list
    console.log('2️⃣ Testing GET users list...');
    const usersResponse = await api.get(`/api/tenant/${TENANT_SLUG}/users`);
    
    if (!usersResponse.data.success) {
      throw new Error(`GET users failed: ${usersResponse.data.message}`);
    }

    const usersData = usersResponse.data.data;
    console.log('✅ GET users successful');
    console.log('📊 Users data:', {
      totalUsers: usersData.users?.length || 0,
      pagination: usersData.pagination,
      stats: usersData.stats,
      permissions: usersData.permissions
    });

    if (usersData.users && usersData.users.length > 0) {
      testUserId = usersData.users[0].id;
      console.log('🎯 Using first user for detail tests:', usersData.users[0].name);
    }

    // Step 3: Test GET user detail
    if (testUserId) {
      console.log('\n3️⃣ Testing GET user detail...');
      const userDetailResponse = await api.get(`/api/tenant/${TENANT_SLUG}/users/${testUserId}`);
      
      if (!userDetailResponse.data.success) {
        throw new Error(`GET user detail failed: ${userDetailResponse.data.message}`);
      }

      const userDetailData = userDetailResponse.data.data;
      console.log('✅ GET user detail successful');
      console.log('👤 User detail:', {
        id: userDetailData.user.id,
        name: userDetailData.user.name,
        email: userDetailData.user.email,
        roles: userDetailData.user.roles?.map(r => r.name) || [],
        permissions: userDetailData.permissions
      });
    }

    // Step 4: Test POST create user
    console.log('\n4️⃣ Testing POST create user...');
    const newUserData = {
      name: 'Test User Created',
      email: `test-created-${Date.now()}@example.com`,
      password: 'password123',
      contactNumber: '+1234567890',
      roleIds: [] // Will be assigned based on available roles
    };

    // First get available roles
    const rolesResponse = await api.get(`/api/tenant/${TENANT_SLUG}/roles?page=1&limit=10`);
    if (rolesResponse.data.success && rolesResponse.data.data.roles?.length > 0) {
      newUserData.roleIds = [rolesResponse.data.data.roles[0].id];
    }

    const createUserResponse = await api.post(`/api/tenant/${TENANT_SLUG}/users`, newUserData);
    
    if (!createUserResponse.data.success) {
      throw new Error(`POST create user failed: ${createUserResponse.data.message}`);
    }

    const createdUser = createUserResponse.data.data.user;
    console.log('✅ POST create user successful');
    console.log('👤 Created user:', {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email
    });

    // Step 5: Test PUT update user
    console.log('\n5️⃣ Testing PUT update user...');
    const updateUserData = {
      name: 'Test User Updated',
      contactNumber: '+0987654321',
      isActive: true
    };

    const updateUserResponse = await api.put(`/api/tenant/${TENANT_SLUG}/users/${createdUser.id}`, updateUserData);
    
    if (!updateUserResponse.data.success) {
      throw new Error(`PUT update user failed: ${updateUserResponse.data.message}`);
    }

    console.log('✅ PUT update user successful');
    console.log('👤 Updated user:', updateUserResponse.data.data.user);

    // Step 6: Test POST reset password
    console.log('\n6️⃣ Testing POST reset password...');
    const resetPasswordData = {
      password: 'newpassword123'
    };

    const resetPasswordResponse = await api.post(`/api/tenant/${TENANT_SLUG}/users/${createdUser.id}/reset-password`, resetPasswordData);
    
    if (!resetPasswordResponse.data.success) {
      throw new Error(`POST reset password failed: ${resetPasswordResponse.data.message}`);
    }

    console.log('✅ POST reset password successful');
    console.log('🔐 Password reset result:', resetPasswordResponse.data.data);

    // Step 7: Test PUT bulk actions
    console.log('\n7️⃣ Testing PUT bulk actions...');
    const bulkActionData = {
      userIds: [createdUser.id],
      action: 'deactivate'
    };

    const bulkActionResponse = await api.put(`/api/tenant/${TENANT_SLUG}/users`, bulkActionData);
    
    if (!bulkActionResponse.data.success) {
      throw new Error(`PUT bulk action failed: ${bulkActionResponse.data.message}`);
    }

    console.log('✅ PUT bulk action successful');
    console.log('📦 Bulk action result:', bulkActionResponse.data.data);

    // Step 8: Test DELETE user
    console.log('\n8️⃣ Testing DELETE user...');
    const deleteUserResponse = await api.delete(`/api/tenant/${TENANT_SLUG}/users/${createdUser.id}`);
    
    if (!deleteUserResponse.data.success) {
      throw new Error(`DELETE user failed: ${deleteUserResponse.data.message}`);
    }

    console.log('✅ DELETE user successful');
    console.log('🗑️ Deleted user:', deleteUserResponse.data.data.deletedUser);

    // Step 9: Verify user is deleted
    console.log('\n9️⃣ Verifying user deletion...');
    try {
      await api.get(`/api/tenant/${TENANT_SLUG}/users/${createdUser.id}`);
      console.log('❌ User still exists after deletion');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ User successfully deleted (404 response)');
      } else {
        console.log('⚠️ Unexpected error when verifying deletion:', error.response?.status);
      }
    }

    console.log('\n🎉 All tenant user management tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTenantUserManagement();
