#!/usr/bin/env tsx

import axios from 'axios';

async function testPermissionsAPI() {
  console.log('🧪 Testing Permissions API...');

  try {
    // First, we need to get a valid token by logging in
    console.log('1. Logging in as tenant admin...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/techcorp/auth/login', {
      email: 'admin@techcorp.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful, got token');

      // Now test the permissions API
      console.log('2. Testing permissions API...');
      
      const permissionsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (permissionsResponse.data.success) {
        const permissions = permissionsResponse.data.data;
        console.log('✅ Permissions API successful');
        console.log('User:', permissions.user.email);
        console.log('Roles:', permissions.user.roles.map((r: any) => r.name));
        console.log('Total permissions:', permissions.permissions.length);
        console.log('All permissions:', permissions.permissions);
        
        // Check specifically for users:view
        const hasUsersView = permissions.permissions.includes('users:view');
        console.log('Has users:view permission:', hasUsersView ? '✅' : '❌');
        
        // Check module permissions
        console.log('Module permissions:', permissions.modulePermissions);
        
        if (permissions.modulePermissions.users) {
          console.log('Users module permissions:', permissions.modulePermissions.users);
        } else {
          console.log('❌ No users module permissions found');
        }
        
      } else {
        console.log('❌ Permissions API failed:', permissionsResponse.data.message);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error: any) {
    console.error('❌ Error testing permissions API:', error.response?.data || error.message);
  }
}

testPermissionsAPI(); 