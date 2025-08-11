#!/usr/bin/env tsx

import axios from 'axios';

async function testMenuItems() {
  console.log('🧪 Testing Menu Items Generation...\n');
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

    // Step 2: Get permissions and menu items
    console.log('\n2️⃣  Fetching permissions and menu items...');
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
    
    // Step 3: Check menu items
    console.log('\n3️⃣  Checking Menu Items...');
    const menuItems = permissions.menuItems || [];
    
    if (menuItems.length === 0) {
      console.log('❌ No menu items returned from API');
      return;
    }

    console.log(`📋 Found ${menuItems.length} menu items:`);
    
    const expectedPaths = [
      '/techcorp/dashboard',
      '/techcorp/users',
      '/techcorp/roles',
      '/techcorp/audit',
      '/techcorp/notifications',
      '/techcorp/settings',
      '/techcorp/support'
    ];

    let allPathsCorrect = true;
    
    for (const item of menuItems as any[]) {
      const isCorrectPath = item.path && item.path.startsWith('/techcorp/');
      const status = isCorrectPath ? '✅' : '❌';
      
      console.log(`   ${status} ${item.label}: ${item.path}`);
      
      if (!isCorrectPath) {
        allPathsCorrect = false;
      }
    }

    // Step 4: Check if all expected paths are present
    console.log('\n4️⃣  Checking Expected Paths...');
    const actualPaths = menuItems.map(item => item.path);
    
    for (const expectedPath of expectedPaths) {
      const hasPath = actualPaths.includes(expectedPath);
      const status = hasPath ? '✅' : '❌';
      console.log(`   ${status} ${expectedPath}`);
    }

    // Step 5: Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(40));
    
    if (allPathsCorrect) {
      console.log('✅ All menu items have correct tenant slug paths');
    } else {
      console.log('❌ Some menu items have incorrect paths');
    }
    
    console.log(`📋 Total menu items: ${menuItems.length}`);
    console.log(`🔗 Correct paths: ${(menuItems as any[]).filter((item: any) => item.path && item.path.startsWith('/techcorp/')).length}`);
    console.log(`❌ Incorrect paths: ${(menuItems as any[]).filter((item: any) => !item.path || !item.path.startsWith('/techcorp/')).length}`);

    // Step 6: Show menu structure
    console.log('\n🌐 MENU STRUCTURE:');
    console.log('-'.repeat(40));
    for (const item of menuItems) {
      console.log(`   📁 ${item.label}`);
      console.log(`      🔗 Path: ${item.path}`);
      console.log(`      🎯 Permissions: ${item.permissions.join(', ')}`);
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMenuItems(); 