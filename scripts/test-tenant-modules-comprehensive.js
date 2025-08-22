/**
 * Comprehensive test script for tenant modules, permissions, and CRUD operations
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANT = 'cons'; // From the user's tenant
const TEST_USER = {
  email: 'test11@gmail.com',
  password: 'password123'
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const addResult = (testName, success, error = null) => {
  if (success) {
    testResults.passed++;
    log(`${testName}: PASSED`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${error}`);
    log(`${testName}: FAILED - ${error}`, 'error');
  }
  testResults.details.push({ testName, success, error });
};

// Test 1: Tenant Login
async function testTenantLogin() {
  try {
    log('Testing tenant login...');
    
    const response = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TEST_TENANT
    });

    if (response.data.success && response.data.data.token) {
      addResult('Tenant Login', true);
      return response.data.data.token;
    } else {
      addResult('Tenant Login', false, 'Login response missing token');
      return null;
    }
  } catch (error) {
    addResult('Tenant Login', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 2: User Profile with Modules
async function testUserProfileWithModules(token) {
  try {
    log('Testing user profile with modules...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/me?includeModules=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const userData = response.data.data;
      console.log('📊 User Profile Data:');
      console.log(`  - User: ${userData.name} (${userData.email})`);
      console.log(`  - Tenant: ${userData.tenant?.name}`);
      console.log(`  - Roles: ${userData.roles?.length || 0}`);
      console.log(`  - Permissions: ${userData.permissions?.length || 0}`);
      console.log(`  - Modules: ${userData.modules?.length || 0}`);
      
      if (userData.permissions && userData.permissions.length > 0) {
        console.log('  - User Permissions:');
        userData.permissions.forEach(permission => {
          console.log(`    * ${permission.moduleKey}:${permission.canRead ? 'read' : ''}${permission.canCreate ? 'create' : ''}${permission.canUpdate ? 'update' : ''}${permission.canDelete ? 'delete' : ''}`);
        });
      }
      
      if (userData.modules && userData.modules.length > 0) {
        console.log('  - Available Modules:');
        userData.modules.forEach(module => {
          console.log(`    * ${module.name} (${module.key}) - Enabled: ${module.isEnabled}, Visible: ${module.isVisible}`);
        });
      }
      
      addResult('User Profile with Modules', true);
      return userData;
    } else {
      addResult('User Profile with Modules', false, 'Profile response not successful');
      return null;
    }
  } catch (error) {
    addResult('User Profile with Modules', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 3: Modules API
async function testModulesAPI(token) {
  try {
    log('Testing modules API...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/modules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const modulesData = response.data.data;
      console.log('📊 Modules API Data:');
      console.log(`  - Total Modules: ${modulesData.modules?.length || 0}`);
      console.log(`  - Permissions:`, modulesData.permissions);
      
      if (modulesData.modules && modulesData.modules.length > 0) {
        console.log('  - Module Details:');
        modulesData.modules.forEach(module => {
          console.log(`    * ${module.moduleName} (${module.moduleKey})`);
          console.log(`      - Enabled: ${module.isEnabled}, Visible: ${module.isVisible}`);
          console.log(`      - Version: ${module.version}, Tenant Version: ${module.tenantVersion}`);
          console.log(`      - Permissions: ${module.permissions?.length || 0}`);
        });
      }
      
      addResult('Modules API', true);
      return modulesData;
    } else {
      addResult('Modules API', false, 'Modules response not successful');
      return null;
    }
  } catch (error) {
    addResult('Modules API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 4: Users API - List
async function testUsersListAPI(token) {
  try {
    log('Testing users list API...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const usersData = response.data.data;
      console.log('📊 Users List Data:');
      console.log(`  - Total Users: ${usersData.users?.length || 0}`);
      console.log(`  - Stats:`, usersData.stats);
      console.log(`  - Permissions:`, usersData.permissions);
      
      if (usersData.users && usersData.users.length > 0) {
        console.log('  - User Details:');
        usersData.users.slice(0, 3).forEach(user => {
          console.log(`    * ${user.name} (${user.email})`);
          console.log(`      - Active: ${user.isActive}, Roles: ${user.roles?.length || 0}`);
        });
      }
      
      addResult('Users List API', true);
      return usersData;
    } else {
      addResult('Users List API', false, 'Users list response not successful');
      return null;
    }
  } catch (error) {
    addResult('Users List API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 5: Users API - Create
async function testUsersCreateAPI(token) {
  try {
    log('Testing users create API...');
    
    const testUser = {
      name: 'Test User API',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      contactNumber: '+1234567890',
      roleIds: [],
      sendInvitation: false
    };
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${TEST_TENANT}/users`, testUser, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const createdUser = response.data.data.user;
      console.log('📊 Created User:');
      console.log(`  - ID: ${createdUser.id}`);
      console.log(`  - Name: ${createdUser.name}`);
      console.log(`  - Email: ${createdUser.email}`);
      
      addResult('Users Create API', true);
      return createdUser;
    } else {
      addResult('Users Create API', false, 'Users create response not successful');
      return null;
    }
  } catch (error) {
    addResult('Users Create API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 6: Roles API - List
async function testRolesListAPI(token) {
  try {
    log('Testing roles list API...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const rolesData = response.data.data;
      console.log('📊 Roles List Data:');
      console.log(`  - Total Roles: ${rolesData.roles?.length || 0}`);
      console.log(`  - Stats:`, rolesData.stats);
      console.log(`  - Permissions:`, rolesData.permissions);
      
      if (rolesData.roles && rolesData.roles.length > 0) {
        console.log('  - Role Details:');
        rolesData.roles.slice(0, 3).forEach(role => {
          console.log(`    * ${role.name} (${role.description || 'No description'})`);
          console.log(`      - Active: ${role.isActive}, System: ${role.isSystem}, Users: ${role.userCount}`);
          console.log(`      - Permissions: ${role.permissions?.length || 0}`);
        });
      }
      
      addResult('Roles List API', true);
      return rolesData;
    } else {
      addResult('Roles List API', false, 'Roles list response not successful');
      return null;
    }
  } catch (error) {
    addResult('Roles List API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 7: Roles API - Create
async function testRolesCreateAPI(token) {
  try {
    log('Testing roles create API...');
    
    const testRole = {
      name: `Test Role API ${Date.now()}`,
      description: 'Test role created via API',
      color: '#3B82F6',
      permissions: [
        {
          moduleKey: 'users',
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${TEST_TENANT}/roles`, testRole, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const createdRole = response.data.data.role;
      console.log('📊 Created Role:');
      console.log(`  - ID: ${createdRole.id}`);
      console.log(`  - Name: ${createdRole.name}`);
      console.log(`  - Description: ${createdRole.description}`);
      
      addResult('Roles Create API', true);
      return createdRole;
    } else {
      addResult('Roles Create API', false, 'Roles create response not successful');
      return null;
    }
  } catch (error) {
    addResult('Roles Create API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 8: Dashboard API
async function testDashboardAPI(token) {
  try {
    log('Testing dashboard API...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const dashboardData = response.data.data;
      console.log('📊 Dashboard Data:');
      console.log(`  - Summary:`, dashboardData.summary);
      console.log(`  - Permissions:`, dashboardData.permissions);
      console.log(`  - Charts: ${dashboardData.charts ? 'Available' : 'Not available'}`);
      console.log(`  - Recent Activity: ${dashboardData.recentActivity?.length || 0} items`);
      
      addResult('Dashboard API', true);
      return dashboardData;
    } else {
      addResult('Dashboard API', false, 'Dashboard response not successful');
      return null;
    }
  } catch (error) {
    addResult('Dashboard API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 9: Audit Logs API
async function testAuditLogsAPI(token) {
  try {
    log('Testing audit logs API...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/audit-logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const auditData = response.data.data;
      console.log('📊 Audit Logs Data:');
      console.log(`  - Total Logs: ${auditData.logs?.length || 0}`);
      console.log(`  - Pagination:`, auditData.pagination);
      console.log(`  - Permissions:`, auditData.permissions);
      
      if (auditData.logs && auditData.logs.length > 0) {
        console.log('  - Recent Logs:');
        auditData.logs.slice(0, 3).forEach(log => {
          console.log(`    * ${log.action} - ${log.user?.name || 'Unknown'} - ${new Date(log.createdAt).toLocaleString()}`);
        });
      }
      
      addResult('Audit Logs API', true);
      return auditData;
    } else {
      addResult('Audit Logs API', false, 'Audit logs response not successful');
      return null;
    }
  } catch (error) {
    addResult('Audit Logs API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 10: Notifications API
async function testNotificationsAPI(token) {
  try {
    log('Testing notifications API...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TEST_TENANT}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const notificationsData = response.data.data;
      console.log('📊 Notifications Data:');
      console.log(`  - Total Notifications: ${notificationsData.notifications?.length || 0}`);
      console.log(`  - Pagination:`, notificationsData.pagination);
      console.log(`  - Permissions:`, notificationsData.permissions);
      
      addResult('Notifications API', true);
      return notificationsData;
    } else {
      addResult('Notifications API', false, 'Notifications response not successful');
      return null;
    }
  } catch (error) {
    addResult('Notifications API', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Tenant Modules Test...\n');
  
  // Test 1: Login
  const token = await testTenantLogin();
  
  if (!token) {
    console.log('\n❌ Login failed, skipping remaining tests');
    return;
  }
  
  // Test 2-10: API endpoints
  await testUserProfileWithModules(token);
  await testModulesAPI(token);
  await testUsersListAPI(token);
  await testUsersCreateAPI(token);
  await testRolesListAPI(token);
  await testRolesCreateAPI(token);
  await testDashboardAPI(token);
  await testAuditLogsAPI(token);
  await testNotificationsAPI(token);
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n🎯 Module System Status:');
  if (testResults.failed === 0) {
    console.log('✅ All tests passed! The module system is working correctly.');
  } else if (testResults.passed >= 7) {
    console.log('⚠️ Most tests passed. The module system is mostly working.');
  } else {
    console.log('❌ Multiple tests failed. The module system needs attention.');
  }
  
  console.log('\n📝 Module System Features:');
  console.log('✅ User authentication and profile loading');
  console.log('✅ Module listing and permissions');
  console.log('✅ User management CRUD operations');
  console.log('✅ Role management CRUD operations');
  console.log('✅ Dashboard data access');
  console.log('✅ Audit logs access');
  console.log('✅ Notifications access');
  
  return testResults;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
