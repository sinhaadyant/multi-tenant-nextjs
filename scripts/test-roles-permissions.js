#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const SUPERADMIN_EMAIL = 'admin@superadmin.com';
const SUPERADMIN_PASSWORD = 'AdminPass123';

let authToken = null;

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test functions
async function login() {
  try {
    console.log('🔐 Logging in as superadmin...');
    const response = await api.post('/superadmin/auth/login', {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      rememberMe: false
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
}

async function testFetchTenants() {
  try {
    console.log('\n🏢 Testing fetch tenants...');
    const response = await api.get('/superadmin/tenants?limit=5');
    
    if (response.data.success) {
      console.log('✅ Tenants fetched successfully');
      console.log(`   Found ${response.data.data.tenants?.length || 0} tenants`);
      return response.data.data.tenants || [];
    } else {
      console.log('❌ Failed to fetch tenants:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Fetch tenants error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testFetchRoles(tenantId) {
  try {
    console.log(`\n🛡️ Testing fetch roles for tenant ${tenantId}...`);
    const response = await api.get(`/superadmin/roles?tenantId=${tenantId}&limit=10`);
    
    if (response.data.success) {
      console.log('✅ Roles fetched successfully');
      console.log(`   Found ${response.data.data.roles?.length || 0} roles`);
      return response.data.data.roles || [];
    } else {
      console.log('❌ Failed to fetch roles:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Fetch roles error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testFetchModules() {
  try {
    console.log('\n🔧 Testing fetch modules...');
    const response = await api.get('/superadmin/modules');
    
    if (response.data.success) {
      console.log('✅ Modules fetched successfully');
      console.log(`   Found ${response.data.data.modules?.length || 0} modules`);
      return response.data.data.modules || [];
    } else {
      console.log('❌ Failed to fetch modules:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Fetch modules error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testFetchUsers(tenantId) {
  try {
    console.log(`\n👥 Testing fetch users for tenant ${tenantId}...`);
    const response = await api.get(`/superadmin/users?tenantId=${tenantId}&limit=10`);
    
    if (response.data.success) {
      console.log('✅ Users fetched successfully');
      console.log(`   Found ${response.data.data.users?.length || 0} users`);
      return response.data.data.users || [];
    } else {
      console.log('❌ Failed to fetch users:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Fetch users error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testCreateRole(tenantId) {
  try {
    console.log(`\n➕ Testing create role for tenant ${tenantId}...`);
    const roleData = {
      name: `Test Role ${Date.now()}`,
      description: 'A test role created by the test script',
      tenantId: tenantId
    };
    
    const response = await api.post('/superadmin/roles', roleData);
    
    if (response.data.success) {
      console.log('✅ Role created successfully');
      console.log(`   Role ID: ${response.data.data.role.id}`);
      console.log(`   Role Name: ${response.data.data.role.name}`);
      return response.data.data.role;
    } else {
      console.log('❌ Failed to create role:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Create role error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUpdateRolePermissions(roleId, modules) {
  try {
    console.log(`\n🔐 Testing update role permissions for role ${roleId}...`);
    
    // Create sample permissions (first 2 modules with view and create actions)
    const permissions = modules.slice(0, 2).map(module => ({
      moduleId: module.id,
      actions: ['view', 'create']
    }));
    
    const response = await api.post(`/superadmin/roles/${roleId}/permissions`, {
      permissions
    });
    
    if (response.data.success) {
      console.log('✅ Role permissions updated successfully');
      console.log(`   Updated ${permissions.length} module permissions`);
      return true;
    } else {
      console.log('❌ Failed to update role permissions:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Update role permissions error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRoleAssignment(tenantId, users, roles) {
  try {
    console.log(`\n👤 Testing role assignment for tenant ${tenantId}...`);
    
    if (users.length === 0 || roles.length === 0) {
      console.log('⚠️ Skipping role assignment test - no users or roles available');
      return false;
    }
    
    // Assign the first role to the first user
    const assignments = [{
      userId: users[0].id,
      roleId: roles[0].id
    }];
    
    const response = await api.post('/superadmin/role-assignment', {
      tenantId,
      assignments
    });
    
    if (response.data.success) {
      console.log('✅ Role assignment successful');
      console.log(`   Assigned ${assignments.length} roles`);
      return true;
    } else {
      console.log('❌ Failed to assign roles:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Role assignment error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDeleteRole(roleId) {
  try {
    console.log(`\n🗑️ Testing delete role ${roleId}...`);
    
    const response = await api.delete(`/superadmin/roles/${roleId}`);
    
    if (response.data.success) {
      console.log('✅ Role deleted successfully');
      return true;
    } else {
      console.log('❌ Failed to delete role:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Delete role error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Roles & Permissions Management Module Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Fetch tenants
  const tenants = await testFetchTenants();
  if (tenants.length === 0) {
    console.log('❌ No tenants available for testing');
    return;
  }
  
  const testTenant = tenants[0];
  console.log(`\n📋 Using tenant: ${testTenant.name} (${testTenant.id})`);
  
  // Step 3: Fetch roles
  const roles = await testFetchRoles(testTenant.id);
  
  // Step 4: Fetch modules
  const modules = await testFetchModules();
  
  // Step 5: Fetch users
  const users = await testFetchUsers(testTenant.id);
  
  // Step 6: Create a new role
  const newRole = await testCreateRole(testTenant.id);
  
  // Step 7: Update role permissions (if role created and modules available)
  if (newRole && modules.length > 0) {
    await testUpdateRolePermissions(newRole.id, modules);
  }
  
  // Step 8: Test role assignment (if users and roles available)
  if (users.length > 0 && roles.length > 0) {
    await testRoleAssignment(testTenant.id, users, roles);
  }
  
  // Step 9: Clean up - delete the test role
  if (newRole) {
    await testDeleteRole(newRole.id);
  }
  
  console.log('\n✅ All tests completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Tenants: ${tenants.length}`);
  console.log(`   - Roles: ${roles.length}`);
  console.log(`   - Modules: ${modules.length}`);
  console.log(`   - Users: ${users.length}`);
}

// Run the tests
runTests().catch(console.error);
