const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TENANT_SLUG = 'cons';
const TEST_USER = {
  email: 'test11@gmail.com',
  password: 'password123'
};

let authToken = '';

// Helper function to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status 
    };
  }
};

// Test login
const testLogin = async () => {
  console.log('🔍 Testing tenant login...');
  try {
    const response = await axios.post(`${BASE_URL}/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TENANT_SLUG
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
};

// Test Users CRUD
const testUsersCRUD = async () => {
  console.log('\n📋 Testing Users CRUD Operations...');
  
  // 1. Read - List users
  console.log('  🔍 Testing Users READ (List)...');
  const listResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/users`);
  if (listResult.success) {
    console.log(`  ✅ Users List: ${listResult.data.data.users.length} users found`);
    console.log(`  📊 Permissions: canView=${listResult.data.data.permissions.canView}, canCreate=${listResult.data.data.permissions.canCreate}`);
  } else {
    console.log(`  ❌ Users List failed: ${listResult.error}`);
  }

  // 2. Create - Add new user
  console.log('  🔍 Testing Users CREATE...');
  const newUser = {
    name: `Test User CRUD ${Date.now()}`,
    email: `test-crud-${Date.now()}@example.com`,
    password: 'password123',
    contactNumber: '+1234567890'
  };
  
  const createResult = await apiCall('POST', `/tenant/${TENANT_SLUG}/users`, newUser);
  if (createResult.success) {
    console.log(`  ✅ User Created: ${createResult.data.data.user.name} (${createResult.data.data.user.id})`);
    
    // 3. Read - Get specific user (using list since we don't have individual GET)
    console.log('  🔍 Testing Users READ (Individual)...');
    const updatedListResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/users?search=${newUser.email}`);
    if (updatedListResult.success) {
      const createdUser = updatedListResult.data.data.users.find(u => u.email === newUser.email);
      if (createdUser) {
        console.log(`  ✅ User Found: ${createdUser.name} - Active: ${createdUser.isActive}`);
        
        // 4. Update - Try bulk status update
        console.log('  🔍 Testing Users UPDATE (Bulk Status)...');
        const updateResult = await apiCall('PUT', `/tenant/${TENANT_SLUG}/users`, {
          action: 'deactivate',
          userIds: [createdUser.id]
        });
        
        if (updateResult.success) {
          console.log(`  ✅ User Updated: ${updateResult.data.data.action} applied to ${updateResult.data.data.affectedUsers} users`);
          
          // 5. Delete - Try bulk delete
          console.log('  🔍 Testing Users DELETE...');
          const deleteResult = await apiCall('PUT', `/tenant/${TENANT_SLUG}/users`, {
            action: 'delete',
            userIds: [createdUser.id]
          });
          
          if (deleteResult.success) {
            console.log(`  ✅ User Deleted: ${deleteResult.data.data.affectedUsers} users deleted`);
          } else {
            console.log(`  ❌ User Delete failed: ${deleteResult.error}`);
          }
        } else {
          console.log(`  ❌ User Update failed: ${updateResult.error}`);
        }
      } else {
        console.log(`  ❌ Created user not found in list`);
      }
    } else {
      console.log(`  ❌ User Search failed: ${updatedListResult.error}`);
    }
  } else {
    console.log(`  ❌ User Create failed: ${createResult.error}`);
  }
};

// Test Roles CRUD
const testRolesCRUD = async () => {
  console.log('\n🛡️ Testing Roles CRUD Operations...');
  
  // 1. Read - List roles
  console.log('  🔍 Testing Roles READ (List)...');
  const listResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/roles`);
  if (listResult.success) {
    console.log(`  ✅ Roles List: ${listResult.data.data.roles.length} roles found`);
    console.log(`  📊 Permissions: canView=${listResult.data.data.permissions.canView}, canCreate=${listResult.data.data.permissions.canCreate}`);
  } else {
    console.log(`  ❌ Roles List failed: ${listResult.error}`);
  }

  // 2. Create - Add new role
  console.log('  🔍 Testing Roles CREATE...');
  const newRole = {
    name: `Test Role CRUD ${Date.now()}`,
    description: 'Test role for CRUD operations',
    color: '#FF5733',
    permissions: [
      {
        moduleKey: 'dashboard',
        canCreate: true,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canViewAll: true
      }
    ]
  };
  
  const createResult = await apiCall('POST', `/tenant/${TENANT_SLUG}/roles`, newRole);
  if (createResult.success) {
    console.log(`  ✅ Role Created: ${createResult.data.data.role.name} (${createResult.data.data.role.id})`);
    
    const roleId = createResult.data.data.role.id;
    
    // 3. Read - Get role details (using list with search)
    console.log('  🔍 Testing Roles READ (Individual)...');
    const updatedListResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/roles?search=${newRole.name}`);
    if (updatedListResult.success) {
      const createdRole = updatedListResult.data.data.roles.find(r => r.id === roleId);
      if (createdRole) {
        console.log(`  ✅ Role Found: ${createdRole.name} - Active: ${createdRole.isActive}, Users: ${createdRole.userCount}`);
        
        // 4. Update - Try bulk status update
        console.log('  🔍 Testing Roles UPDATE (Bulk Status)...');
        const updateResult = await apiCall('PUT', `/tenant/${TENANT_SLUG}/roles`, {
          action: 'deactivate',
          roleIds: [roleId]
        });
        
        if (updateResult.success) {
          console.log(`  ✅ Role Updated: ${updateResult.data.data.action} applied to ${updateResult.data.data.affectedRoles} roles`);
          
          // 5. Delete - Try bulk delete
          console.log('  🔍 Testing Roles DELETE...');
          const deleteResult = await apiCall('PUT', `/tenant/${TENANT_SLUG}/roles`, {
            action: 'delete',
            roleIds: [roleId]
          });
          
          if (deleteResult.success) {
            console.log(`  ✅ Role Deleted: ${deleteResult.data.data.affectedRoles} roles deleted`);
          } else {
            console.log(`  ❌ Role Delete failed: ${deleteResult.error}`);
          }
        } else {
          console.log(`  ❌ Role Update failed: ${updateResult.error}`);
        }
      } else {
        console.log(`  ❌ Created role not found in list`);
      }
    } else {
      console.log(`  ❌ Role Search failed: ${updatedListResult.error}`);
    }
  } else {
    console.log(`  ❌ Role Create failed: ${createResult.error}`);
  }
};

// Test Modules CRUD
const testModulesCRUD = async () => {
  console.log('\n⚙️ Testing Modules CRUD Operations...');
  
  // 1. Read - List modules
  console.log('  🔍 Testing Modules READ (List)...');
  const listResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/modules`);
  if (listResult.success) {
    console.log(`  ✅ Modules List: ${listResult.data.data.modules.length} modules found`);
    console.log(`  📊 Permissions: canViewModules=${listResult.data.data.permissions.canViewModules}, canEnableDisableModules=${listResult.data.data.permissions.canEnableDisableModules}`);
    
    // Find a module to test with
    const testModule = listResult.data.data.modules.find(m => m.moduleKey === 'analytics');
    if (testModule) {
      console.log(`  🎯 Using module for testing: ${testModule.moduleName} (${testModule.moduleKey})`);
      
      // 2. Update - Disable module
      console.log('  🔍 Testing Modules UPDATE (Disable)...');
      const disableResult = await apiCall('POST', `/tenant/${TENANT_SLUG}/modules`, {
        action: 'disable',
        moduleKey: testModule.moduleKey
      });
      
      if (disableResult.success) {
        console.log(`  ✅ Module Disabled: ${testModule.moduleName}`);
        
        // 3. Update - Enable module back
        console.log('  🔍 Testing Modules UPDATE (Enable)...');
        const enableResult = await apiCall('POST', `/tenant/${TENANT_SLUG}/modules`, {
          action: 'enable',
          moduleKey: testModule.moduleKey
        });
        
        if (enableResult.success) {
          console.log(`  ✅ Module Enabled: ${testModule.moduleName}`);
          
          // 4. Update - Update module settings
          console.log('  🔍 Testing Modules UPDATE (Settings)...');
          const settingsResult = await apiCall('POST', `/tenant/${TENANT_SLUG}/modules`, {
            action: 'update_settings',
            moduleKey: testModule.moduleKey,
            settings: {
              testSetting: 'testValue',
              updatedAt: new Date().toISOString()
            }
          });
          
          if (settingsResult.success) {
            console.log(`  ✅ Module Settings Updated: ${testModule.moduleName}`);
          } else {
            console.log(`  ❌ Module Settings Update failed: ${settingsResult.error}`);
          }
        } else {
          console.log(`  ❌ Module Enable failed: ${enableResult.error}`);
        }
      } else {
        console.log(`  ❌ Module Disable failed: ${disableResult.error}`);
      }
    } else {
      console.log(`  ⚠️ No suitable test module found`);
    }
  } else {
    console.log(`  ❌ Modules List failed: ${listResult.error}`);
  }
};

// Test Notifications CRUD
const testNotificationsCRUD = async () => {
  console.log('\n🔔 Testing Notifications CRUD Operations...');
  
  // 1. Read - List notifications
  console.log('  🔍 Testing Notifications READ (List)...');
  const listResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/notifications`);
  if (listResult.success) {
    console.log(`  ✅ Notifications List: ${listResult.data.data.notifications.length} notifications found`);
    console.log(`  📊 Permissions: canView=${listResult.data.data.permissions.canView}, canCreate=${listResult.data.data.permissions.canCreate}`);
  } else {
    console.log(`  ❌ Notifications List failed: ${listResult.error}`);
  }

  // 2. Create - Add new notification
  console.log('  🔍 Testing Notifications CREATE...');
  const newNotification = {
    title: `Test Notification CRUD ${Date.now()}`,
    message: 'This is a test notification for CRUD operations',
    type: 'info',
    priority: 'medium'
  };
  
  const createResult = await apiCall('POST', `/tenant/${TENANT_SLUG}/notifications`, newNotification);
  if (createResult.success) {
    console.log(`  ✅ Notification Created: ${createResult.data.data.notification.title} (${createResult.data.data.notification.id})`);
    
    const notificationId = createResult.data.data.notification.id;
    
    // 3. Read - Check if notification appears in list
    console.log('  🔍 Testing Notifications READ (Individual)...');
    const updatedListResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/notifications`);
    if (updatedListResult.success) {
      const createdNotification = updatedListResult.data.data.notifications.find(n => n.id === notificationId);
      if (createdNotification) {
        console.log(`  ✅ Notification Found: ${createdNotification.title} - Active: ${createdNotification.isActive}`);
        
        // 4. Update - Try bulk mark as read
        console.log('  🔍 Testing Notifications UPDATE (Mark Read)...');
        const updateResult = await apiCall('PUT', `/tenant/${TENANT_SLUG}/notifications`, {
          action: 'mark_read',
          notificationIds: [notificationId]
        });
        
        if (updateResult.success) {
          console.log(`  ✅ Notification Updated: ${updateResult.data.data.action} applied to ${updateResult.data.data.affectedNotifications} notifications`);
          
          // 5. Delete - Try bulk delete
          console.log('  🔍 Testing Notifications DELETE...');
          const deleteResult = await apiCall('PUT', `/tenant/${TENANT_SLUG}/notifications`, {
            action: 'delete',
            notificationIds: [notificationId]
          });
          
          if (deleteResult.success) {
            console.log(`  ✅ Notification Deleted: ${deleteResult.data.data.affectedNotifications} notifications deleted`);
          } else {
            console.log(`  ❌ Notification Delete failed: ${deleteResult.error}`);
          }
        } else {
          console.log(`  ❌ Notification Update failed: ${updateResult.error}`);
        }
      } else {
        console.log(`  ❌ Created notification not found in list`);
      }
    } else {
      console.log(`  ❌ Notification Search failed: ${updatedListResult.error}`);
    }
  } else {
    console.log(`  ❌ Notification Create failed: ${createResult.error}`);
  }
};

// Test Audit Logs (Read-only)
const testAuditLogs = async () => {
  console.log('\n📝 Testing Audit Logs (Read-only)...');
  
  const listResult = await apiCall('GET', `/tenant/${TENANT_SLUG}/audit-logs`);
  if (listResult.success) {
    console.log(`  ✅ Audit Logs List: ${listResult.data.data.logs.length} logs found`);
    console.log(`  📊 Permissions: canView=${listResult.data.data.permissions.canView}, canExport=${listResult.data.data.permissions.canExport}`);
    console.log(`  📊 Stats: Total=${listResult.data.data.stats.total}, Today=${listResult.data.data.stats.today}`);
  } else {
    console.log(`  ❌ Audit Logs List failed: ${listResult.error}`);
  }
};

// Main test function
const runCRUDTests = async () => {
  console.log('🚀 Starting Comprehensive Tenant CRUD Permissions Test...\n');
  
  // Login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without successful login');
    return;
  }
  
  // Run all CRUD tests
  await testUsersCRUD();
  await testRolesCRUD();
  await testModulesCRUD();
  await testNotificationsCRUD();
  await testAuditLogs();
  
  console.log('\n🎯 CRUD Permissions Testing Complete!');
};

// Run the tests
runCRUDTests().catch(console.error);
