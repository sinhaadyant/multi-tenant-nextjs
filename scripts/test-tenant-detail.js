/**
 * Test script for Tenant Detail Page functionality
 * Tests user count display, user list, search, pagination, and filters
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test data
const testData = {
  superadmin: {
    email: 'superadmin@example.com',
    password: 'password123'
  },
  tenantId: 'test-tenant-id' // Replace with actual tenant ID
};

async function loginAsSuperadmin() {
  console.log('\n🔐 Logging in as SuperAdmin...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/superadmin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData.superadmin),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ SuperAdmin login successful');
      return data.data.token;
    } else {
      console.log('❌ SuperAdmin login failed:', data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testTenantDetails(token, tenantId) {
  console.log(`\n🏢 Testing tenant details for tenant ID: ${tenantId}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/superadmin/tenants/${tenantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Tenant details retrieved successfully');
      console.log(`   Tenant Name: ${data.data.tenant.name}`);
      console.log(`   Tenant Slug: ${data.data.tenant.slug}`);
      console.log(`   Is Active: ${data.data.tenant.isActive}`);
      console.log(`   User Count: ${data.data.tenant.userCount}`);
      return data.data.tenant;
    } else {
      console.log('❌ Failed to retrieve tenant details:', data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Tenant details error:', error.message);
    return null;
  }
}

async function testTenantUsers(token, tenantId, filters = {}) {
  console.log(`\n👥 Testing tenant users with filters:`, filters);
  
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${BASE_URL}/api/superadmin/tenants/${tenantId}/users?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Tenant users retrieved successfully');
      console.log(`   Total Users: ${data.data.stats.total}`);
      console.log(`   Active Users: ${data.data.stats.active}`);
      console.log(`   Inactive Users: ${data.data.stats.inactive}`);
      console.log(`   Users in Response: ${data.data.users.length}`);
      console.log(`   Pagination: Page ${data.meta.pagination.page} of ${data.meta.pagination.totalPages}`);
      console.log(`   Total Records: ${data.meta.pagination.totalRecords}`);
      
      // Display first few users
      if (data.data.users.length > 0) {
        console.log('   Sample Users:');
        data.data.users.slice(0, 3).forEach((user, index) => {
          console.log(`     ${index + 1}. ${user.name} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
        });
      }
      
      return data.data;
    } else {
      console.log('❌ Failed to retrieve tenant users:', data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Tenant users error:', error.message);
    return null;
  }
}

async function testUserSearch(token, tenantId) {
  console.log(`\n🔍 Testing user search functionality...`);
  
  const searchTests = [
    { search: 'admin', description: 'Search for "admin"' },
    { search: 'user', description: 'Search for "user"' },
    { search: 'test@example.com', description: 'Search by email' },
    { search: 'nonexistent', description: 'Search for non-existent user' }
  ];
  
  for (const test of searchTests) {
    console.log(`   Testing: ${test.description}`);
    const result = await testTenantUsers(token, tenantId, { search: test.search, page: 1, limit: 10 });
    if (result) {
      console.log(`     Found ${result.users.length} users matching "${test.search}"`);
    }
  }
}

async function testUserFilters(token, tenantId) {
  console.log(`\n🔧 Testing user filters...`);
  
  const filterTests = [
    { status: 'active', description: 'Active users only' },
    { status: 'inactive', description: 'Inactive users only' },
    { sortBy: 'name', sortOrder: 'asc', description: 'Sort by name A-Z' },
    { sortBy: 'name', sortOrder: 'desc', description: 'Sort by name Z-A' },
    { sortBy: 'createdAt', sortOrder: 'desc', description: 'Sort by creation date (newest first)' },
    { sortBy: 'lastLogin', sortOrder: 'desc', description: 'Sort by last login' }
  ];
  
  for (const test of filterTests) {
    console.log(`   Testing: ${test.description}`);
    const result = await testTenantUsers(token, tenantId, { ...test, page: 1, limit: 5 });
    if (result) {
      console.log(`     Found ${result.users.length} users with filter`);
    }
  }
}

async function testPagination(token, tenantId) {
  console.log(`\n📄 Testing pagination...`);
  
  // First, get total count
  const firstPage = await testTenantUsers(token, tenantId, { page: 1, limit: 5 });
  if (!firstPage) return;
  
  const totalPages = Math.ceil(firstPage.stats.total / 5);
  console.log(`   Total pages with 5 users per page: ${totalPages}`);
  
  if (totalPages > 1) {
    console.log('   Testing second page...');
    const secondPage = await testTenantUsers(token, tenantId, { page: 2, limit: 5 });
    if (secondPage) {
      console.log(`     Second page has ${secondPage.users.length} users`);
    }
  }
  
  // Test different page sizes
  const pageSizeTests = [10, 25, 50];
  for (const pageSize of pageSizeTests) {
    console.log(`   Testing page size: ${pageSize}`);
    const result = await testTenantUsers(token, tenantId, { page: 1, limit: pageSize });
    if (result) {
      console.log(`     Retrieved ${result.users.length} users with page size ${pageSize}`);
    }
  }
}

async function testUserActions(token, tenantId) {
  console.log(`\n⚡ Testing user actions...`);
  
  // Get a user to test actions on
  const usersData = await testTenantUsers(token, tenantId, { page: 1, limit: 1 });
  if (!usersData || usersData.users.length === 0) {
    console.log('   No users found to test actions on');
    return;
  }
  
  const testUser = usersData.users[0];
  console.log(`   Testing actions on user: ${testUser.name} (${testUser.email})`);
  
  // Test toggle user status
  console.log('   Testing toggle user status...');
  try {
    const toggleResponse = await fetch(`${BASE_URL}/api/superadmin/tenants/${tenantId}/users/${testUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: !testUser.isActive }),
    });

    const toggleData = await toggleResponse.json();
    
    if (toggleResponse.ok && toggleData.success) {
      console.log(`     ✅ User status toggled successfully`);
      
      // Toggle back to original state
      const toggleBackResponse = await fetch(`${BASE_URL}/api/superadmin/tenants/${tenantId}/users/${testUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: testUser.isActive }),
      });
      
      if (toggleBackResponse.ok) {
        console.log(`     ✅ User status restored to original state`);
      }
    } else {
      console.log(`     ❌ Failed to toggle user status:`, toggleData.message || toggleData.error);
    }
  } catch (error) {
    console.log(`     ❌ Toggle user status error:`, error.message);
  }
  
  // Test reset password
  console.log('   Testing reset password...');
  try {
    const resetResponse = await fetch(`${BASE_URL}/api/superadmin/tenants/${tenantId}/users/${testUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const resetData = await resetResponse.json();
    
    if (resetResponse.ok && resetData.success) {
      console.log(`     ✅ Password reset successful`);
    } else {
      console.log(`     ❌ Failed to reset password:`, resetData.message || resetData.error);
    }
  } catch (error) {
    console.log(`     ❌ Reset password error:`, error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Tenant Detail Page functionality tests...\n');
  
  // Login as SuperAdmin
  const token = await loginAsSuperadmin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test tenant details
  const tenant = await testTenantDetails(token, testData.tenantId);
  if (!tenant) {
    console.log('❌ Cannot proceed without tenant data');
    return;
  }
  
  // Test basic user retrieval
  await testTenantUsers(token, testData.tenantId);
  
  // Test search functionality
  await testUserSearch(token, testData.tenantId);
  
  // Test filters
  await testUserFilters(token, testData.tenantId);
  
  // Test pagination
  await testPagination(token, testData.tenantId);
  
  // Test user actions
  await testUserActions(token, testData.tenantId);
  
  console.log('\n🎉 Tenant Detail Page functionality tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { 
  runTests, 
  testTenantDetails, 
  testTenantUsers, 
  testUserSearch, 
  testUserFilters, 
  testPagination, 
  testUserActions 
};
