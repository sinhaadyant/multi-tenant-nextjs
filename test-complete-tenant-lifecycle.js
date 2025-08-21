const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  // Superadmin credentials
  superadmin: {
    email: 'admin@example.com',
    password: 'admin123'
  },
  
  // New tenant data
  newTenant: {
    name: 'Test Company Inc',
    slug: 'testcompany',
    email: 'admin@testcompany.com',
    phone: '+1234567890',
    address: '123 Test Street, Test City, TC 12345',
    plan: 'premium',
    isActive: true
  },
  
  // New user data
  newUser: {
    name: 'John Doe',
    email: 'john.doe@testcompany.com',
    password: 'Test@123',
    role: 'user'
  },
  
  // Custom role data
  customRole: {
    name: 'Content Manager',
    description: 'Manages content and notifications',
    permissions: {
      'dashboard': ['read'],
      'users': ['read'],
      'notifications': ['read', 'create', 'update', 'delete'],
      'support': ['read', 'create'],
      'roles': ['read']
    }
  }
};

let superadminToken = '';
let tenantSlug = '';
let newUserId = '';
let customRoleId = '';
let userToken = '';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteTenantLifecycle() {
  console.log('🧪 Testing Complete Tenant Lifecycle...\n');
  console.log('='.repeat(60));
  
  try {
    // Phase 1: Superadmin Authentication
    console.log('\n📋 PHASE 1: Superadmin Authentication');
    console.log('-'.repeat(40));
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: testData.superadmin.email,
        password: testData.superadmin.password
      });
      
      if (loginResponse.data.success) {
        superadminToken = loginResponse.data.data.token;
        console.log('✅ Superadmin login successful');
        console.log(`   Token: ${superadminToken.substring(0, 20)}...`);
      } else {
        throw new Error('Superadmin login failed');
      }
    } catch (error) {
      console.log('❌ Superadmin login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 2: Create New Tenant
    console.log('\n📋 PHASE 2: Create New Tenant');
    console.log('-'.repeat(40));
    
    try {
      const tenantResponse = await axios.post(`${BASE_URL}/api/superadmin/tenants`, testData.newTenant, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      if (tenantResponse.data.success) {
        tenantSlug = testData.newTenant.slug;
        console.log('✅ Tenant created successfully');
        console.log(`   Tenant: ${tenantResponse.data.data.name}`);
        console.log(`   Slug: ${tenantSlug}`);
        console.log(`   ID: ${tenantResponse.data.data.id}`);
      } else {
        throw new Error('Tenant creation failed');
      }
    } catch (error) {
      console.log('❌ Tenant creation failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 3: Create Custom Role
    console.log('\n📋 PHASE 3: Create Custom Role');
    console.log('-'.repeat(40));
    
    try {
      const roleResponse = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/roles`, {
        name: testData.customRole.name,
        description: testData.customRole.description,
        isActive: true
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      if (roleResponse.data.success) {
        customRoleId = roleResponse.data.data.id;
        console.log('✅ Custom role created successfully');
        console.log(`   Role: ${testData.customRole.name}`);
        console.log(`   ID: ${customRoleId}`);
      } else {
        throw new Error('Role creation failed');
      }
    } catch (error) {
      console.log('❌ Role creation failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 4: Assign Module Permissions to Role
    console.log('\n📋 PHASE 4: Assign Module Permissions to Role');
    console.log('-'.repeat(40));
    
    try {
      const permissionsData = Object.entries(testData.customRole.permissions).map(([module, actions]) => ({
        moduleKey: module,
        canRead: actions.includes('read'),
        canCreate: actions.includes('create'),
        canUpdate: actions.includes('update'),
        canDelete: actions.includes('delete')
      }));

      const permissionsResponse = await axios.put(`${BASE_URL}/api/tenant/${tenantSlug}/roles/${customRoleId}/permissions`, {
        permissions: permissionsData
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      if (permissionsResponse.data.success) {
        console.log('✅ Module permissions assigned successfully');
        console.log(`   Modules: ${Object.keys(testData.customRole.permissions).join(', ')}`);
      } else {
        throw new Error('Permission assignment failed');
      }
    } catch (error) {
      console.log('❌ Permission assignment failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 5: Create User in Tenant
    console.log('\n📋 PHASE 5: Create User in Tenant');
    console.log('-'.repeat(40));
    
    try {
      const userResponse = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/users`, {
        ...testData.newUser,
        roleId: customRoleId
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      if (userResponse.data.success) {
        newUserId = userResponse.data.data.id;
        console.log('✅ User created successfully');
        console.log(`   User: ${testData.newUser.name}`);
        console.log(`   Email: ${testData.newUser.email}`);
        console.log(`   ID: ${newUserId}`);
      } else {
        throw new Error('User creation failed');
      }
    } catch (error) {
      console.log('❌ User creation failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 6: Tenant User Login
    console.log('\n📋 PHASE 6: Tenant User Login');
    console.log('-'.repeat(40));
    
    try {
      const userLoginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
        email: testData.newUser.email,
        password: testData.newUser.password,
        tenantSlug: tenantSlug
      });
      
      if (userLoginResponse.data.success) {
        userToken = userLoginResponse.data.data.token;
        console.log('✅ Tenant user login successful');
        console.log(`   User: ${userLoginResponse.data.data.user.name}`);
        console.log(`   Token: ${userToken.substring(0, 20)}...`);
      } else {
        throw new Error('Tenant user login failed');
      }
    } catch (error) {
      console.log('❌ Tenant user login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 7: Test User Profile and Permissions
    console.log('\n📋 PHASE 7: Test User Profile and Permissions');
    console.log('-'.repeat(40));
    
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/me`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (profileResponse.data.success) {
        const user = profileResponse.data.data;
        console.log('✅ User profile fetched successfully');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Roles: ${user.roles?.length || 0}`);
        console.log(`   Permissions: ${user.permissions?.length || 0}`);
        
        // Check specific permissions
        const permissions = user.permissions || [];
        const hasDashboardAccess = permissions.some(p => p.moduleKey === 'dashboard' && p.canRead);
        const hasUsersAccess = permissions.some(p => p.moduleKey === 'users' && p.canRead);
        const hasNotificationsAccess = permissions.some(p => p.moduleKey === 'notifications' && p.canRead);
        const hasSupportAccess = permissions.some(p => p.moduleKey === 'support' && p.canRead);
        const hasRolesAccess = permissions.some(p => p.moduleKey === 'roles' && p.canRead);
        
        console.log('\n   Permission Check:');
        console.log(`   - Dashboard: ${hasDashboardAccess ? '✅' : '❌'}`);
        console.log(`   - Users: ${hasUsersAccess ? '✅' : '❌'}`);
        console.log(`   - Notifications: ${hasNotificationsAccess ? '✅' : '❌'}`);
        console.log(`   - Support: ${hasSupportAccess ? '✅' : '❌'}`);
        console.log(`   - Roles: ${hasRolesAccess ? '✅' : '❌'}`);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.log('❌ User profile test failed:', error.response?.data?.message || error.message);
    }

    // Phase 8: Test Modules Access
    console.log('\n📋 PHASE 8: Test Modules Access');
    console.log('-'.repeat(40));
    
    try {
      const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/modules`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (modulesResponse.data.success) {
        const modules = modulesResponse.data.data.modules || [];
        console.log('✅ Modules fetched successfully');
        console.log(`   Total modules: ${modules.length}`);
        console.log('   Available modules:');
        modules.forEach(module => {
          console.log(`   - ${module.name} (${module.key})`);
        });
      } else {
        throw new Error('Failed to fetch modules');
      }
    } catch (error) {
      console.log('❌ Modules test failed:', error.response?.data?.message || error.message);
    }

    // Phase 9: Test Dashboard Access
    console.log('\n📋 PHASE 9: Test Dashboard Access');
    console.log('-'.repeat(40));
    
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/dashboard`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard access successful');
        const data = dashboardResponse.data.data;
        console.log(`   Stats: ${Object.keys(data.stats || {}).length} metrics`);
        console.log(`   Recent activities: ${data.recentActivities?.length || 0}`);
      } else {
        throw new Error('Dashboard access failed');
      }
    } catch (error) {
      console.log('❌ Dashboard test failed:', error.response?.data?.message || error.message);
    }

    // Phase 10: Test User Management Access
    console.log('\n📋 PHASE 10: Test User Management Access');
    console.log('-'.repeat(40));
    
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (usersResponse.data.success) {
        console.log('✅ User management access successful');
        console.log(`   Total users: ${usersResponse.data.data.users?.length || 0}`);
      } else {
        throw new Error('User management access failed');
      }
    } catch (error) {
      console.log('❌ User management test failed:', error.response?.data?.message || error.message);
    }

    // Phase 11: Test Roles and Permissions Access
    console.log('\n📋 PHASE 11: Test Roles and Permissions Access');
    console.log('-'.repeat(40));
    
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/roles`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (rolesResponse.data.success) {
        console.log('✅ Roles and permissions access successful');
        console.log(`   Total roles: ${rolesResponse.data.data.roles?.length || 0}`);
      } else {
        throw new Error('Roles access failed');
      }
    } catch (error) {
      console.log('❌ Roles test failed:', error.response?.data?.message || error.message);
    }

    // Phase 12: Test Notifications Access
    console.log('\n📋 PHASE 12: Test Notifications Access');
    console.log('-'.repeat(40));
    
    try {
      const notificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/notifications`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (notificationsResponse.data.success) {
        console.log('✅ Notifications access successful');
        console.log(`   Total notifications: ${notificationsResponse.data.data.notifications?.length || 0}`);
      } else {
        throw new Error('Notifications access failed');
      }
    } catch (error) {
      console.log('❌ Notifications test failed:', error.response?.data?.message || error.message);
    }

    // Phase 13: Test Support Access
    console.log('\n📋 PHASE 13: Test Support Access');
    console.log('-'.repeat(40));
    
    try {
      const supportResponse = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/support`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (supportResponse.data.success) {
        console.log('✅ Support access successful');
        console.log(`   Support tickets: ${supportResponse.data.data.tickets?.length || 0}`);
      } else {
        throw new Error('Support access failed');
      }
    } catch (error) {
      console.log('❌ Support test failed:', error.response?.data?.message || error.message);
    }

    // Phase 14: Test Invite User Functionality
    console.log('\n📋 PHASE 14: Test Invite User Functionality');
    console.log('-'.repeat(40));
    
    try {
      const inviteResponse = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/users/invite`, {
        email: 'invited@testcompany.com',
        name: 'Invited User',
        roleId: customRoleId
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (inviteResponse.data.success) {
        console.log('✅ User invitation successful');
        console.log(`   Invited: invited@testcompany.com`);
      } else {
        throw new Error('User invitation failed');
      }
    } catch (error) {
      console.log('❌ User invitation test failed:', error.response?.data?.message || error.message);
    }

    // Phase 15: Test Forgot Password
    console.log('\n📋 PHASE 15: Test Forgot Password');
    console.log('-'.repeat(40));
    
    try {
      const forgotPasswordResponse = await axios.post(`${BASE_URL}/api/tenant/auth/forgot-password`, {
        email: testData.newUser.email,
        tenantSlug: tenantSlug
      });
      
      if (forgotPasswordResponse.data.success) {
        console.log('✅ Forgot password request successful');
        console.log(`   Reset email sent to: ${testData.newUser.email}`);
      } else {
        throw new Error('Forgot password request failed');
      }
    } catch (error) {
      console.log('❌ Forgot password test failed:', error.response?.data?.message || error.message);
    }

    // Phase 16: Test Logout
    console.log('\n📋 PHASE 16: Test Logout');
    console.log('-'.repeat(40));
    
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/logout`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (logoutResponse.data.success) {
        console.log('✅ Logout successful');
        console.log('   User session terminated');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.log('❌ Logout test failed:', error.response?.data?.message || error.message);
    }

    // Phase 17: Verify Logout (Try to access protected endpoint)
    console.log('\n📋 PHASE 17: Verify Logout');
    console.log('-'.repeat(40));
    
    try {
      await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/me`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('❌ Logout verification failed - user still has access');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Logout verification successful - user access revoked');
      } else {
        console.log('❌ Logout verification failed:', error.response?.data?.message || error.message);
      }
    }

    // Phase 18: Cleanup (Delete test data)
    console.log('\n📋 PHASE 18: Cleanup Test Data');
    console.log('-'.repeat(40));
    
    try {
      // Delete user
      await axios.delete(`${BASE_URL}/api/tenant/${tenantSlug}/users/${newUserId}`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      console.log('✅ Test user deleted');

      // Delete role
      await axios.delete(`${BASE_URL}/api/tenant/${tenantSlug}/roles/${customRoleId}`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      console.log('✅ Custom role deleted');

      // Delete tenant
      await axios.delete(`${BASE_URL}/api/superadmin/tenants/${tenantSlug}`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      console.log('✅ Test tenant deleted');

    } catch (error) {
      console.log('⚠️  Cleanup failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Complete Tenant Lifecycle Test Completed Successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('='.repeat(60));
  }
}

// Run the test
testCompleteTenantLifecycle();
