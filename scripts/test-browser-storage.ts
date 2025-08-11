#!/usr/bin/env tsx

import axios from 'axios';

async function testBrowserStorage() {
  console.log('🧪 Testing browser storage and token handling...');

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
      const refreshToken = loginResponse.data.data.refreshToken;
      const userData = loginResponse.data.data.user;
      
      console.log('✅ Login successful');
      console.log('Token:', token.substring(0, 50) + '...');
      console.log('Refresh token:', refreshToken.substring(0, 50) + '...');
      console.log('User data:', userData.email);

      // Simulate what the frontend should store
      console.log('\n2. Simulating frontend storage...');
      console.log('The frontend should store:');
      console.log('- localStorage.setItem("tenant_auth_token", token)');
      console.log('- localStorage.setItem("tenant_refresh_token", refreshToken)');
      console.log('- localStorage.setItem("tenant_user_data", JSON.stringify(userData))');

      // Test the permissions API with the token
      console.log('\n3. Testing permissions API with token...');
      
      const permissionsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (permissionsResponse.data.success) {
        const permissions = permissionsResponse.data.data;
        console.log('✅ Permissions API successful');
        console.log('Total permissions:', permissions.permissions.length);
        console.log('Has users:view:', permissions.permissions.includes('users:view'));
        
        // Simulate what the frontend should store for permissions
        console.log('\n4. Simulating permissions storage...');
        console.log('The frontend should store:');
        console.log('- localStorage.setItem("user_permissions", JSON.stringify(permissions))');
        console.log('- localStorage.setItem("permissions_timestamp", Date.now().toString())');
        
        console.log('\n5. Expected localStorage keys:');
        console.log('- tenant_auth_token');
        console.log('- tenant_refresh_token');
        console.log('- tenant_user_data');
        console.log('- user_permissions');
        console.log('- permissions_timestamp');
        
      } else {
        console.log('❌ Permissions API failed:', permissionsResponse.data.message);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error: any) {
    console.error('❌ Error testing browser storage:', error.response?.data || error.message);
  }
}

testBrowserStorage(); 