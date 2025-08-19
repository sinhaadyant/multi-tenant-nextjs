const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPermissions() {
  try {
    console.log('🔍 Testing permission system...\n');

    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: 'admin@acme-corp.com',
      password: 'AcmeAdmin123!',
      tenantSlug: 'acme-corp'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get user profile with permissions
    console.log('2. Fetching user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileResponse.data.success) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = profileResponse.data.data;
    console.log('✅ User profile fetched\n');

    // Step 3: Analyze permissions
    console.log('3. Analyzing permissions...');
    console.log(`User: ${userData.name} (${userData.email})`);
    console.log(`Roles: ${userData.roles.map(r => r.name).join(', ')}`);
    console.log(`Total Permissions: ${userData.permissions.length}\n`);

    // Step 4: Test specific permission checks
    console.log('4. Testing specific permission checks...');
    
    const permissionTests = [
      { module: 'dashboard', action: 'read', expected: true },
      { module: 'users', action: 'read', expected: true },
      { module: 'roles', action: 'read', expected: true },
      { module: 'audit', action: 'read', expected: true },
      { module: 'reports', action: 'read', expected: true },
      { module: 'notifications', action: 'read', expected: true },
      { module: 'support', action: 'read', expected: true },
      { module: 'settings', action: 'read', expected: true },
      { module: 'users', action: 'create', expected: true },
      { module: 'roles', action: 'update', expected: true },
      { module: 'audit', action: 'delete', expected: true },
      { module: 'nonexistent', action: 'read', expected: false }
    ];

    for (const test of permissionTests) {
      const hasPermission = userData.permissions.some(p => 
        p.moduleKey === test.module && p[`can${test.action.charAt(0).toUpperCase() + test.action.slice(1)}`] === true
      );
      
      const status = hasPermission === test.expected ? '✅' : '❌';
      console.log(`${status} ${test.module}:${test.action} - Expected: ${test.expected}, Got: ${hasPermission}`);
    }

    console.log('\n5. Testing role checks...');
    const roleTests = [
      { role: 'Tenant Admin', expected: true },
      { role: 'admin', expected: true },
      { role: 'superadmin', expected: false },
      { role: 'user', expected: false }
    ];

    for (const test of roleTests) {
      const hasRole = userData.roles.some(r => 
        r.name.toLowerCase() === test.role.toLowerCase()
      );
      
      const status = hasRole === test.expected ? '✅' : '❌';
      console.log(`${status} Role "${test.role}" - Expected: ${test.expected}, Got: ${hasRole}`);
    }

    console.log('\n6. Testing module availability...');
    const modules = ['dashboard', 'users', 'roles', 'audit', 'reports', 'notifications', 'support', 'settings'];
    
    for (const module of modules) {
      const hasAnyPermission = userData.permissions.some(p => p.moduleKey === module);
      console.log(`${hasAnyPermission ? '✅' : '❌'} Module "${module}" - Available: ${hasAnyPermission}`);
    }

    console.log('\n🎉 Permission testing completed!');
    console.log('\n📋 Summary:');
    console.log(`- User has ${userData.permissions.length} permissions`);
    console.log(`- User has ${userData.roles.length} roles`);
    console.log(`- Available modules: ${userData.permissions.map(p => p.moduleKey).join(', ')}`);

  } catch (error) {
    console.error('❌ Error testing permissions:', error.response?.data || error.message);
  }
}

testPermissions();
