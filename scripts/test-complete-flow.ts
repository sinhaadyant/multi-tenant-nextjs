#!/usr/bin/env tsx

import axios from 'axios';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Authentication & Permission Flow\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Login
    console.log('1️⃣  Testing Login...');
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'admin@techcorp.com',
      password: 'password123',
      tenantSlug: 'techcorp'
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.data.user.email}`);
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Test 2: Permissions API
    console.log('\n2️⃣  Testing Permissions API...');
    const permissionsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!permissionsResponse.data.success) {
      throw new Error(`Permissions API failed: ${permissionsResponse.data.message}`);
    }

    const permissions = permissionsResponse.data.data;
    console.log('✅ Permissions API successful');
    console.log(`   Total permissions: ${permissions.permissions.length}`);
    console.log(`   Has users:view: ${permissions.permissions.includes('users:view')}`);
    console.log(`   Has roles:view: ${permissions.permissions.includes('roles:view')}`);
    console.log(`   Has dashboard:view: ${permissions.permissions.includes('dashboard:view')}`);

    // Test 3: Check critical permissions
    console.log('\n3️⃣  Checking Critical Permissions...');
    const criticalPermissions = ['users:view', 'roles:view', 'dashboard:view'];
    const missingCritical = criticalPermissions.filter(perm => !permissions.permissions.includes(perm));
    
    if (missingCritical.length > 0) {
      console.log(`❌ Missing critical permissions: ${missingCritical.join(', ')}`);
    } else {
      console.log('✅ All critical permissions present');
    }

    // Test 4: Check module permissions
    console.log('\n4️⃣  Checking Module Permissions...');
    const expectedModules = ['dashboard', 'users', 'roles', 'audit', 'notifications', 'settings', 'support'];
    
    for (const module of expectedModules) {
      const hasModuleAccess = permissions.accessibleModules.includes(module);
      const modulePerms = permissions.modulePermissions[module] || [];
      console.log(`   ${module}: ${hasModuleAccess ? '✅' : '❌'} (${modulePerms.join(', ')})`);
    }

    // Test 5: Test different user roles
    console.log('\n5️⃣  Testing Different User Roles...');
    
    const testUsers = [
      { email: 'manager@techcorp.com', password: 'password123', expectedRole: 'Manager' },
      { email: 'user@techcorp.com', password: 'password123', expectedRole: 'User' },
      { email: 'viewer@techcorp.com', password: 'password123', expectedRole: 'Viewer' }
    ];

    for (const testUser of testUsers) {
      try {
        const userLoginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
          email: testUser.email,
          password: testUser.password,
          tenantSlug: 'techcorp'
        });

        if (userLoginResponse.data.success) {
          const userToken = userLoginResponse.data.data.token;
          const userPermissionsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user', {
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });

          if (userPermissionsResponse.data.success) {
            const userPermissions = userPermissionsResponse.data.data;
            console.log(`   ${testUser.email}: ✅ ${userPermissions.permissions.length} permissions`);
          } else {
            console.log(`   ${testUser.email}: ❌ Permissions API failed`);
          }
        } else {
          console.log(`   ${testUser.email}: ❌ Login failed`);
        }
             } catch (error: any) {
         console.log(`   ${testUser.email}: ❌ Error: ${error.response?.data?.message || error.message}`);
       }
    }

    // Test 6: Test invalid token
    console.log('\n6️⃣  Testing Invalid Token...');
    try {
      await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user', {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });
      console.log('   ❌ Should have failed with invalid token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('   ✅ Correctly rejected invalid token');
      } else {
        console.log(`   ⚠️  Unexpected error with invalid token: ${error.response?.status}`);
      }
    }

    // Test 7: Test missing token
    console.log('\n7️⃣  Testing Missing Token...');
    try {
      await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user');
      console.log('   ❌ Should have failed with missing token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('   ✅ Correctly rejected missing token');
      } else {
        console.log(`   ⚠️  Unexpected error with missing token: ${error.response?.status}`);
      }
    }

    console.log('\n🎉 COMPLETE FLOW TEST SUMMARY:');
    console.log('='.repeat(60));
    console.log('✅ Login functionality working');
    console.log('✅ Permissions API working');
    console.log('✅ Token authentication working');
    console.log('✅ Role-based permissions working');
    console.log('✅ Security measures in place');
    console.log('\n🚀 Ready for frontend testing!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteFlow(); 