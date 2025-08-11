#!/usr/bin/env tsx

import axios from 'axios';

async function testTokenStorage() {
  console.log('🧪 Testing token storage and permissions...');

  try {
    // First, login to get a token
    console.log('1. Logging in...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'admin@techcorp.com',
      password: 'password123',
      tenantSlug: 'techcorp'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful, got token');
      console.log('Token preview:', token.substring(0, 50) + '...');

      // Test the permissions API with the token
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
    console.error('❌ Error testing token storage:', error.response?.data || error.message);
  }
}

testTokenStorage(); 