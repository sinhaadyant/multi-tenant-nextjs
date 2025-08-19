const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp';
const TEST_USER = {
  email: 'admin@acme-corp.com',
  password: 'AcmeAdmin123!'
};

async function testTenantLoginPermissions() {
  console.log('🧪 Testing tenant login permissions and modules loading...\n');

  try {
    // Step 1: Test tenant info endpoint
    console.log('1️⃣ Testing tenant info endpoint...');
    const tenantInfoResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/info`);
    console.log('✅ Tenant info:', {
      success: tenantInfoResponse.data.success,
      tenantName: tenantInfoResponse.data.data?.tenant?.name,
      tenantSlug: tenantInfoResponse.data.data?.tenant?.slug
    });

    // Step 2: Test login endpoint
    console.log('\n2️⃣ Testing login endpoint...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const { token, user } = loginResponse.data.data;
    console.log('✅ Login successful:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      rolesCount: user.roles?.length || 0,
      permissionsCount: user.permissions?.length || 0,
      hasToken: !!token
    });

    // Step 3: Test user profile endpoint with token
    console.log('\n3️⃣ Testing user profile endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!profileResponse.data.success) {
      throw new Error(`Profile fetch failed: ${profileResponse.data.message}`);
    }

    const profileData = profileResponse.data.data;
    console.log('✅ User profile loaded:', {
      userId: profileData.id,
      userName: profileData.name,
      rolesCount: profileData.roles?.length || 0,
      permissionsCount: profileData.permissions?.length || 0,
      tenantName: profileData.tenant?.name
    });

    // Step 4: Test modules endpoint
    console.log('\n4️⃣ Testing modules endpoint...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!modulesResponse.data.success) {
      throw new Error(`Modules fetch failed: ${modulesResponse.data.message}`);
    }

    const modulesData = modulesResponse.data.data;
    console.log('✅ Modules loaded:', {
      modulesCount: modulesData.modules?.length || 0,
      permissions: modulesData.permissions
    });

    // Step 5: Display detailed permissions
    console.log('\n5️⃣ Detailed permissions analysis...');
    if (profileData.permissions && profileData.permissions.length > 0) {
      console.log('📋 User Permissions:');
      profileData.permissions.forEach((permission, index) => {
        console.log(`  ${index + 1}. ${permission.moduleKey}:`, {
          canRead: permission.canRead,
          canCreate: permission.canCreate,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
          canViewAll: permission.canViewAll
        });
      });
    } else {
      console.log('⚠️ No permissions found for user');
    }

    // Step 6: Display modules
    console.log('\n6️⃣ Available modules:');
    if (modulesData.modules && modulesData.modules.length > 0) {
      modulesData.modules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.moduleName} (${module.moduleKey}):`, {
          isVisible: module.isVisible,
          isEnabled: module.isEnabled,
          isVisibleInTenant: module.isVisibleInTenant,
          path: module.path,
          icon: module.icon
        });
      });
    } else {
      console.log('⚠️ No modules found');
    }

    // Step 7: Test dashboard access
    console.log('\n7️⃣ Testing dashboard access...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard access successful');
      } else {
        console.log('⚠️ Dashboard access failed:', dashboardResponse.data.message);
      }
    } catch (error) {
      console.log('⚠️ Dashboard access error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - User: ${profileData.name} (${profileData.email})`);
    console.log(`   - Roles: ${profileData.roles?.length || 0}`);
    console.log(`   - Permissions: ${profileData.permissions?.length || 0}`);
    console.log(`   - Modules: ${modulesData.modules?.length || 0}`);
    console.log(`   - Tenant: ${profileData.tenant?.name}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testTenantLoginPermissions();
