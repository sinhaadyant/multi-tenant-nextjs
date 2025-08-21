const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'rss';

// Test credentials for existing tenant
const testCredentials = {
  email: 'test123@gmail.com',
  password: 'Test@123'
};

let userToken = '';

async function testExistingTenantFunctionality() {
  console.log('🧪 Testing Existing Tenant Functionality...\n');
  console.log('='.repeat(60));
  
  try {
    // Phase 1: Tenant Login
    console.log('\n📋 PHASE 1: Tenant Login');
    console.log('-'.repeat(40));
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
        email: testCredentials.email,
        password: testCredentials.password,
        tenantSlug: TENANT_SLUG
      });
      
      if (loginResponse.data.success) {
        userToken = loginResponse.data.data.token;
        console.log('✅ Tenant login successful');
        console.log(`   User: ${loginResponse.data.data.user.name}`);
        console.log(`   Email: ${loginResponse.data.data.user.email}`);
        console.log(`   Token: ${userToken.substring(0, 20)}...`);
      } else {
        throw new Error('Tenant login failed');
      }
    } catch (error) {
      console.log('❌ Tenant login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 2: Test User Profile and Permissions
    console.log('\n📋 PHASE 2: Test User Profile and Permissions');
    console.log('-'.repeat(40));
    
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, {
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
        const permissionCheck = {
          dashboard: permissions.some(p => p.moduleKey === 'dashboard' && p.canRead),
          users: permissions.some(p => p.moduleKey === 'users' && p.canRead),
          roles: permissions.some(p => p.moduleKey === 'roles' && p.canRead),
          notifications: permissions.some(p => p.moduleKey === 'notifications' && p.canRead),
          support: permissions.some(p => p.moduleKey === 'support' && p.canRead),
          settings: permissions.some(p => p.moduleKey === 'settings' && p.canRead),
          reports: permissions.some(p => p.moduleKey === 'reports' && p.canRead)
        };
        
        console.log('\n   Permission Check:');
        Object.entries(permissionCheck).forEach(([module, hasAccess]) => {
          console.log(`   - ${module.charAt(0).toUpperCase() + module.slice(1)}: ${hasAccess ? '✅' : '❌'}`);
        });
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.log('❌ User profile test failed:', error.response?.data?.message || error.message);
    }

    // Phase 3: Test Modules Access
    console.log('\n📋 PHASE 3: Test Modules Access');
    console.log('-'.repeat(40));
    
    try {
      const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
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

    // Phase 4: Test Dashboard Access
    console.log('\n📋 PHASE 4: Test Dashboard Access');
    console.log('-'.repeat(40));
    
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard access successful');
        const data = dashboardResponse.data.data;
        console.log(`   Stats: ${Object.keys(data.stats || {}).length} metrics`);
        console.log(`   Recent activities: ${data.recentActivities?.length || 0}`);
        console.log(`   Quick actions: ${data.quickActions?.length || 0}`);
      } else {
        throw new Error('Dashboard access failed');
      }
    } catch (error) {
      console.log('❌ Dashboard test failed:', error.response?.data?.message || error.message);
    }

    // Phase 5: Test User Management Access
    console.log('\n📋 PHASE 5: Test User Management Access');
    console.log('-'.repeat(40));
    
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (usersResponse.data.success) {
        console.log('✅ User management access successful');
        const data = usersResponse.data.data;
        console.log(`   Total users: ${data.users?.length || 0}`);
        console.log(`   Stats: ${Object.keys(data.stats || {}).length} metrics`);
        console.log(`   Pagination: Page ${data.pagination?.page || 1} of ${data.pagination?.totalPages || 1}`);
      } else {
        throw new Error('User management access failed');
      }
    } catch (error) {
      console.log('❌ User management test failed:', error.response?.data?.message || error.message);
    }

    // Phase 6: Test Roles and Permissions Access
    console.log('\n📋 PHASE 6: Test Roles and Permissions Access');
    console.log('-'.repeat(40));
    
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (rolesResponse.data.success) {
        console.log('✅ Roles and permissions access successful');
        const data = rolesResponse.data.data;
        console.log(`   Total roles: ${data.roles?.length || 0}`);
        console.log(`   Stats: ${Object.keys(data.stats || {}).length} metrics`);
        console.log(`   Pagination: Page ${data.pagination?.page || 1} of ${data.pagination?.totalPages || 1}`);
      } else {
        throw new Error('Roles access failed');
      }
    } catch (error) {
      console.log('❌ Roles test failed:', error.response?.data?.message || error.message);
    }

    // Phase 7: Test Notifications Access
    console.log('\n📋 PHASE 7: Test Notifications Access');
    console.log('-'.repeat(40));
    
    try {
      const notificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (notificationsResponse.data.success) {
        console.log('✅ Notifications access successful');
        const data = notificationsResponse.data.data;
        console.log(`   Total notifications: ${data.notifications?.length || 0}`);
        console.log(`   Unread count: ${data.unreadCount || 0}`);
        console.log(`   Pagination: Page ${data.pagination?.page || 1} of ${data.pagination?.totalPages || 1}`);
      } else {
        throw new Error('Notifications access failed');
      }
    } catch (error) {
      console.log('❌ Notifications test failed:', error.response?.data?.message || error.message);
    }

    // Phase 8: Test Support Access
    console.log('\n📋 PHASE 8: Test Support Access');
    console.log('-'.repeat(40));
    
    try {
      const supportResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (supportResponse.data.success) {
        console.log('✅ Support access successful');
        const data = supportResponse.data.data;
        console.log(`   Support tickets: ${data.tickets?.length || 0}`);
        console.log(`   Open tickets: ${data.openTickets || 0}`);
        console.log(`   Resolved tickets: ${data.resolvedTickets || 0}`);
      } else {
        throw new Error('Support access failed');
      }
    } catch (error) {
      console.log('❌ Support test failed:', error.response?.data?.message || error.message);
    }

    // Phase 9: Test Settings Access
    console.log('\n📋 PHASE 9: Test Settings Access');
    console.log('-'.repeat(40));
    
    try {
      const settingsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/settings`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (settingsResponse.data.success) {
        console.log('✅ Settings access successful');
        const data = settingsResponse.data.data;
        console.log(`   Settings categories: ${Object.keys(data.settings || {}).length}`);
      } else {
        throw new Error('Settings access failed');
      }
    } catch (error) {
      console.log('❌ Settings test failed:', error.response?.data?.message || error.message);
    }

    // Phase 10: Test Reports Access
    console.log('\n📋 PHASE 10: Test Reports Access');
    console.log('-'.repeat(40));
    
    try {
      const reportsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (reportsResponse.data.success) {
        console.log('✅ Reports access successful');
        const data = reportsResponse.data.data;
        console.log(`   Available reports: ${data.reports?.length || 0}`);
      } else {
        throw new Error('Reports access failed');
      }
    } catch (error) {
      console.log('❌ Reports test failed:', error.response?.data?.message || error.message);
    }

    // Phase 11: Test Profile Access
    console.log('\n📋 PHASE 11: Test Profile Access');
    console.log('-'.repeat(40));
    
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/profile`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Profile access successful');
        const data = profileResponse.data.data;
        console.log(`   Profile data: ${Object.keys(data).length} fields`);
      } else {
        throw new Error('Profile access failed');
      }
    } catch (error) {
      console.log('❌ Profile test failed:', error.response?.data?.message || error.message);
    }

    // Phase 12: Test Invite User Functionality
    console.log('\n📋 PHASE 12: Test Invite User Functionality');
    console.log('-'.repeat(40));
    
    try {
      const inviteResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users/invite`, {
        email: 'test-invite@example.com',
        name: 'Test Invite User',
        roleId: 'default-role-id'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (inviteResponse.data.success) {
        console.log('✅ User invitation successful');
        console.log(`   Invited: test-invite@example.com`);
      } else {
        throw new Error('User invitation failed');
      }
    } catch (error) {
      console.log('❌ User invitation test failed:', error.response?.data?.message || error.message);
    }

    // Phase 13: Test Forgot Password
    console.log('\n📋 PHASE 13: Test Forgot Password');
    console.log('-'.repeat(40));
    
    try {
      const forgotPasswordResponse = await axios.post(`${BASE_URL}/api/tenant/auth/forgot-password`, {
        email: testCredentials.email,
        tenantSlug: TENANT_SLUG
      });
      
      if (forgotPasswordResponse.data.success) {
        console.log('✅ Forgot password request successful');
        console.log(`   Reset email sent to: ${testCredentials.email}`);
      } else {
        throw new Error('Forgot password request failed');
      }
    } catch (error) {
      console.log('❌ Forgot password test failed:', error.response?.data?.message || error.message);
    }

    // Phase 14: Test Logout
    console.log('\n📋 PHASE 14: Test Logout');
    console.log('-'.repeat(40));
    
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/logout`, {}, {
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

    // Phase 15: Verify Logout (Try to access protected endpoint)
    console.log('\n📋 PHASE 15: Verify Logout');
    console.log('-'.repeat(40));
    
    try {
      await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, {
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

    console.log('\n🎉 Existing Tenant Functionality Test Completed Successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('='.repeat(60));
  }
}

// Run the test
testExistingTenantFunctionality();
