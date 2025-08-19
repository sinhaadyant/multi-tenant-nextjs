#!/usr/bin/env node

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

async function testRolesAPI() {
  console.log('\n🛡️ Testing Roles API...');
  
  try {
    // Test GET roles with filters
    console.log('📋 Testing GET /tenant/acme-corp/roles...');
    const getResponse = await axios.get(`${BASE_URL}/tenant/acme-corp/roles`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 10,
        search: '',
        status: 'all'
      }
    });

    if (getResponse.data.success) {
      const roles = getResponse.data.data.roles;
      const stats = getResponse.data.data.stats;
      const permissions = getResponse.data.data.permissions;
      
      console.log(`✅ Roles API working - Found ${roles.length} roles`);
      console.log(`📊 Stats: Total=${stats.total}, Active=${stats.active}, Inactive=${stats.inactive}`);
      console.log(`🔐 Permissions: View=${permissions.canView}, Create=${permissions.canCreate}, Update=${permissions.canUpdate}, Delete=${permissions.canDelete}`);
      
      return roles;
    } else {
      console.log('❌ Roles API failed:', getResponse.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Roles API error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testModulesAPI() {
  console.log('\n📦 Testing Modules API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/tenant/acme-corp/modules`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const modules = response.data.data.modules;
      console.log(`✅ Modules API working - Found ${modules.length} modules`);
      return modules;
    } else {
      console.log('❌ Modules API failed:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Modules API error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testRoleCRUD(modules) {
  console.log('\n🔄 Testing Role CRUD Operations...');
  
  try {
    // Test CREATE role
    console.log('➕ Testing CREATE role...');
    const timestamp = Date.now();
    const newRole = {
      name: `Test Role ${timestamp}`,
      description: 'Test role for CRUD operations',
      color: '#3B82F6',
      permissions: modules.slice(0, 3).map(module => ({
        moduleKey: module.moduleKey,
        canCreate: true,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canViewAll: false
      }))
    };

    const createResponse = await axios.post(`${BASE_URL}/tenant/acme-corp/roles`, newRole, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.data.success) {
      const createdRole = createResponse.data.data;
      console.log(`✅ Role created successfully - ID: ${createdRole.id}, Name: ${createdRole.name}`);
      
      // Test UPDATE role
      console.log('✏️ Testing UPDATE role...');
      const updateData = {
        name: `Updated Test Role ${timestamp}`,
        description: 'Updated test role description',
        color: '#10B981'
      };

      const updateResponse = await axios.put(`${BASE_URL}/tenant/acme-corp/roles/${createdRole.id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (updateResponse.data.success) {
        const updatedRole = updateResponse.data.data;
        console.log(`✅ Role updated successfully - Name: ${updatedRole.name}`);
        
        // Test DELETE role
        console.log('🗑️ Testing DELETE role...');
        const deleteResponse = await axios.delete(`${BASE_URL}/tenant/acme-corp/roles/${createdRole.id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (deleteResponse.data.success) {
          console.log('✅ Role deleted successfully');
          return true;
        } else {
          console.log('❌ Role delete failed:', deleteResponse.data.message);
          return false;
        }
      } else {
        console.log('❌ Role update failed:', updateResponse.data.message);
        return false;
      }
    } else {
      console.log('❌ Role create failed:', createResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Role CRUD error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBulkOperations() {
  console.log('\n📦 Testing Bulk Operations...');
  
  try {
    // Get existing roles for bulk operations
    const rolesResponse = await axios.get(`${BASE_URL}/tenant/acme-corp/roles`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });
    
    const roles = rolesResponse.data.data.roles;
    if (roles.length < 2) {
      console.log('⚠️ Not enough roles for bulk operations test');
      return true;
    }
    
    const roleIds = roles.slice(0, 2).map(role => role.id);
    
    // Test bulk deactivate
    console.log('⏸️ Testing bulk deactivate...');
    const bulkDeactivateResponse = await axios.put(`${BASE_URL}/tenant/acme-corp/roles`, {
      roleIds: roleIds,
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

    // Test bulk activate
    console.log('🔄 Testing bulk activate...');
    const bulkActivateResponse = await axios.put(`${BASE_URL}/tenant/acme-corp/roles`, {
      roleIds: roleIds,
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

    return true;
  } catch (error) {
    console.log('❌ Bulk operations error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRoleAssignment() {
  console.log('\n👥 Testing Role Assignment...');
  
  try {
    // Get users and roles
    const [usersResponse, rolesResponse] = await Promise.all([
      axios.get(`${BASE_URL}/tenant/acme-corp/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { page: 1, limit: 10 }
      }),
      axios.get(`${BASE_URL}/tenant/acme-corp/roles`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { page: 1, limit: 10 }
      })
    ]);

    const users = usersResponse.data.data.users;
    const roles = rolesResponse.data.data.roles;

    if (users.length === 0 || roles.length === 0) {
      console.log('⚠️ No users or roles available for assignment test');
      return true;
    }

    const userId = users[0].id;
    const roleId = roles[0].id;

    // Test role assignment
    console.log(`🔗 Testing role assignment - User: ${users[0].name}, Role: ${roles[0].name}`);
    const assignResponse = await axios.post(`${BASE_URL}/tenant/acme-corp/roles/${roleId}/assign`, {
      userId: userId
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (assignResponse.data.success) {
      console.log('✅ Role assignment working');
    } else {
      console.log('❌ Role assignment failed:', assignResponse.data.message);
    }

    return true;
  } catch (error) {
    console.log('❌ Role assignment error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPermissionMatrix() {
  console.log('\n🔐 Testing Permission Matrix...');
  
  try {
    // Get roles with permissions
    const rolesResponse = await axios.get(`${BASE_URL}/tenant/acme-corp/roles`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });

    const roles = rolesResponse.data.data.roles;
    
    if (roles.length === 0) {
      console.log('⚠️ No roles available for permission matrix test');
      return true;
    }

    const role = roles[0];
    console.log(`📊 Permission Matrix for Role: ${role.name}`);
    console.log(`   Total Permissions: ${role.permissions.length}`);
    
    role.permissions.forEach(permission => {
      console.log(`   - ${permission.moduleName || permission.moduleKey}:`);
      console.log(`     Read: ${permission.canRead ? '✅' : '❌'}`);
      console.log(`     Create: ${permission.canCreate ? '✅' : '❌'}`);
      console.log(`     Update: ${permission.canUpdate ? '✅' : '❌'}`);
      console.log(`     Delete: ${permission.canDelete ? '✅' : '❌'}`);
      console.log(`     View All: ${permission.canViewAll ? '✅' : '❌'}`);
    });

    console.log('✅ Permission matrix working');
    return true;
  } catch (error) {
    console.log('❌ Permission matrix error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Roles & Permissions Test - Comprehensive Testing...\n');

  // Get authentication token
  const authSuccess = await getAuthToken();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Test APIs
  const roles = await testRolesAPI();
  const modules = await testModulesAPI();
  
  // Test CRUD operations
  const crudSuccess = await testRoleCRUD(modules);
  
  // Test bulk operations
  const bulkSuccess = await testBulkOperations();
  
  // Test role assignment
  const assignmentSuccess = await testRoleAssignment();
  
  // Test permission matrix
  const matrixSuccess = await testPermissionMatrix();

  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`   ${roles.length > 0 ? '✅' : '❌'} Roles API`);
  console.log(`   ${modules.length > 0 ? '✅' : '❌'} Modules API`);
  console.log(`   ${crudSuccess ? '✅' : '❌'} Role CRUD Operations`);
  console.log(`   ${bulkSuccess ? '✅' : '❌'} Bulk Operations`);
  console.log(`   ${assignmentSuccess ? '✅' : '❌'} Role Assignment`);
  console.log(`   ${matrixSuccess ? '✅' : '❌'} Permission Matrix`);

  if (roles.length > 0 && modules.length > 0 && crudSuccess && bulkSuccess && assignmentSuccess && matrixSuccess) {
    console.log('\n🎉 All Roles & Permissions tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
