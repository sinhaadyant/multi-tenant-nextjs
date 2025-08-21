const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'rss';

async function testTenantRolesModule() {
  try {
    console.log('🧪 Testing Tenant Roles & Permissions Module...\n');
    
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/auth/login`, {
      email: 'test123@gmail.com',
      password: 'Test@123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful\n');
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Test get roles
      console.log('2. Testing get roles...');
      try {
        const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, { headers });
        
        if (rolesResponse.data.success) {
          console.log('✅ Get roles successful');
          console.log(`Found ${rolesResponse.data.data.roles.length} roles`);
          console.log(`Stats: Total=${rolesResponse.data.data.stats.total}, Active=${rolesResponse.data.data.stats.active}, Inactive=${rolesResponse.data.data.stats.inactive}`);
          console.log(`Permissions: View=${rolesResponse.data.data.permissions.canView}, Create=${rolesResponse.data.data.permissions.canCreate}, Update=${rolesResponse.data.data.permissions.canUpdate}, Delete=${rolesResponse.data.data.permissions.canDelete}\n`);
        } else {
          console.log('❌ Get roles failed:', rolesResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Get roles error:', error.response?.data?.message || error.message);
      }
      
      // Test create role
      console.log('3. Testing create role...');
      try {
        const createRoleData = {
          name: 'Test Role',
          description: 'A test role for testing purposes',
          permissions: [
            {
              moduleKey: 'dashboard',
              canCreate: false,
              canRead: true,
              canUpdate: false,
              canDelete: false,
              canViewAll: false
            },
            {
              moduleKey: 'users',
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: false,
              canViewAll: true
            }
          ]
        };
        
        const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, createRoleData, { headers });
        
        if (createResponse.data.success) {
          console.log('✅ Create role successful');
          console.log(`Created role: ${createResponse.data.data.role.name} (ID: ${createResponse.data.data.role.id})\n`);
          
          const roleId = createResponse.data.data.role.id;
          
          // Test update role
          console.log('4. Testing update role...');
          try {
            const updateRoleData = {
              name: 'Updated Test Role',
              description: 'An updated test role',
              isActive: true
            };
            
            const updateResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${roleId}`, updateRoleData, { headers });
            
            if (updateResponse.data.success) {
              console.log('✅ Update role successful');
              console.log(`Updated role: ${updateResponse.data.data.role.name}\n`);
            } else {
              console.log('❌ Update role failed:', updateResponse.data.message);
            }
          } catch (error) {
            console.log('❌ Update role error:', error.response?.data?.message || error.message);
          }
          
          // Test delete role
          console.log('5. Testing delete role...');
          try {
            const deleteResponse = await axios.delete(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${roleId}`, { headers });
            
            if (deleteResponse.data.success) {
              console.log('✅ Delete role successful');
              console.log(`Deleted role: ${deleteResponse.data.data.role.name}\n`);
            } else {
              console.log('❌ Delete role failed:', deleteResponse.data.message);
            }
          } catch (error) {
            console.log('❌ Delete role error:', error.response?.data?.message || error.message);
          }
        } else {
          console.log('❌ Create role failed:', createResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Create role error:', error.response?.data?.message || error.message);
      }
      
      // Test bulk actions
      console.log('6. Testing bulk actions...');
      try {
        const bulkActionData = {
          roleIds: ['role1', 'role2'], // Mock role IDs
          action: 'activate'
        };
        
        const bulkResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, bulkActionData, { headers });
        
        if (bulkResponse.data.success) {
          console.log('✅ Bulk action successful');
          console.log(`Action: ${bulkResponse.data.data.action}, Affected: ${bulkResponse.data.data.affectedRoles}\n`);
        } else {
          console.log('❌ Bulk action failed:', bulkResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Bulk action error:', error.response?.data?.message || error.message);
      }
      
      // Test role assignment
      console.log('7. Testing role assignment...');
      try {
        const assignmentData = [
          {
            userId: 'user1',
            roleId: 'role1'
          },
          {
            userId: 'user2',
            roleId: 'role2'
          }
        ];
        
        const assignmentResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/assign`, assignmentData, { headers });
        
        if (assignmentResponse.data.success) {
          console.log('✅ Role assignment successful');
          console.log(`Assigned roles to ${assignmentResponse.data.data.assignedCount} users\n`);
        } else {
          console.log('❌ Role assignment failed:', assignmentResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Role assignment error:', error.response?.data?.message || error.message);
      }
      
      // Test modules endpoint
      console.log('8. Testing modules endpoint...');
      try {
        const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, { headers });
        
        if (modulesResponse.data.success) {
          console.log('✅ Get modules successful');
          console.log(`Found ${modulesResponse.data.data.modules.length} modules\n`);
        } else {
          console.log('❌ Get modules failed:', modulesResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Get modules error:', error.response?.data?.message || error.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Test permissions
async function testPermissions() {
  console.log('\n🔐 Testing Permissions...\n');
  
  try {
    // Test login
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/auth/login`, {
      email: 'test123@gmail.com',
      password: 'Test@123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Test permission check
      console.log('1. Testing permission check...');
      try {
        const permissionResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/permissions`, { headers });
        
        if (permissionResponse.data.success) {
          console.log('✅ Permission check successful');
          console.log(`User permissions:`, permissionResponse.data.data.permissions);
        } else {
          console.log('❌ Permission check failed:', permissionResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Permission check error:', error.response?.data?.message || error.message);
      }
      
    } else {
      console.log('❌ Login failed for permission test');
    }
    
  } catch (error) {
    console.error('❌ Permission test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testTenantRolesModule();
  await testPermissions();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Roles & Permissions module should be accessible at: /rss/roles');
  console.log('- The module includes: Roles Management, Module Permissions, and Role Assignment tabs');
  console.log('- All CRUD operations for roles should work with proper permissions');
  console.log('- Role assignment functionality should be available');
  console.log('- Permission-based visibility should be implemented');
}

runAllTests();
