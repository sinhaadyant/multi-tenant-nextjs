#!/usr/bin/env tsx

import axios from 'axios';

async function testNotificationAPI() {
  console.log('🧪 Testing Notification API...\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login to get a token
    console.log('1️⃣  Logging in...');
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

    // Step 2: Test notifications API
    console.log('\n2️⃣  Testing Notifications API...');
    
    try {
      const notificationsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Notifications API successful');
      console.log(`   Status: ${notificationsResponse.status}`);
      console.log(`   Data:`, notificationsResponse.data);
      
    } catch (error: any) {
      console.log('❌ Notifications API failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 3: Test my notifications API
    console.log('\n3️⃣  Testing My Notifications API...');
    
    try {
      const myNotificationsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/notifications/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ My Notifications API successful');
      console.log(`   Status: ${myNotificationsResponse.status}`);
      console.log(`   Data:`, myNotificationsResponse.data);
      
    } catch (error: any) {
      console.log('❌ My Notifications API failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 4: Test permissions API to verify user has notification permissions
    console.log('\n4️⃣  Checking User Permissions...');
    
    try {
      const permissionsResponse = await axios.get('http://localhost:3000/api/tenant/techcorp/permissions/current-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (permissionsResponse.data.success) {
        const permissions = permissionsResponse.data.data;
        const hasNotificationsView = permissions.permissions.includes('notifications:view');
        const hasNotificationsCreate = permissions.permissions.includes('notifications:create');
        
        console.log('✅ Permissions API successful');
        console.log(`   Has notifications:view: ${hasNotificationsView ? '✅' : '❌'}`);
        console.log(`   Has notifications:create: ${hasNotificationsCreate ? '✅' : '❌'}`);
        console.log(`   All permissions:`, permissions.permissions);
      }
      
    } catch (error: any) {
      console.log('❌ Permissions API failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Notification API Test Complete!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNotificationAPI(); 