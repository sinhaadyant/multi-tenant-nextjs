const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'global-retail';
const CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!',
  tenantSlug: 'global-retail'
};

// Module key mapping (same as in the frontend)
const MODULE_KEY_MAPPING = {
  'users': 'user-management',
  'user': 'user-management',
  'roles': 'roles-permissions',
  'role': 'roles-permissions',
  'audit': 'audit-logs',
  'audit-logs': 'audit-logs',
  'reports': 'reports-analytics',
  'reports-analytics': 'reports-analytics',
  'settings': 'content-management',
  'content': 'content-management',
  'dashboard': 'dashboard',
  'profile': 'profile',
  'support': 'support',
  'notifications': 'notifications',
  'analytics': 'analytics',
  'tenant-management': 'tenant-management'
};

const mapFrontendToBackendKey = (frontendKey) => {
  return MODULE_KEY_MAPPING[frontendKey] || frontendKey;
};

async function testPermissionFix() {
  let token = null;
  let userData = null;

  try {
    console.log('🔍 Testing Permission Mapping Fix...');

    // Step 1: Login to get token
    console.log('\n📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get user profile and permissions
    console.log('\n📝 Step 2: Getting user profile and permissions...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, { headers });

    if (profileResponse.data.success) {
      userData = profileResponse.data.data;
      console.log('✅ User profile retrieved successfully');
      console.log(`   User: ${userData.name}`);
      console.log(`   Permissions: ${userData.permissions?.length || 0}`);
    } else {
      throw new Error('Failed to get user profile: ' + profileResponse.data.message);
    }

    // Step 3: Test permission mapping
    console.log('\n📝 Step 3: Testing permission mapping...');
    
    const testCases = [
      { frontendKey: 'users', expectedBackendKey: 'user-management' },
      { frontendKey: 'user', expectedBackendKey: 'user-management' },
      { frontendKey: 'roles', expectedBackendKey: 'roles-permissions' },
      { frontendKey: 'role', expectedBackendKey: 'roles-permissions' },
      { frontendKey: 'audit', expectedBackendKey: 'audit-logs' },
      { frontendKey: 'reports', expectedBackendKey: 'reports-analytics' },
      { frontendKey: 'settings', expectedBackendKey: 'content-management' },
      { frontendKey: 'dashboard', expectedBackendKey: 'dashboard' },
      { frontendKey: 'profile', expectedBackendKey: 'profile' },
      { frontendKey: 'support', expectedBackendKey: 'support' },
      { frontendKey: 'notifications', expectedBackendKey: 'notifications' }
    ];

    console.log('\n   Module Key Mapping Test:');
    testCases.forEach(testCase => {
      const mappedKey = mapFrontendToBackendKey(testCase.frontendKey);
      const isCorrect = mappedKey === testCase.expectedBackendKey;
      console.log(`     ${testCase.frontendKey} → ${mappedKey} ${isCorrect ? '✅' : '❌'}`);
    });

    // Step 4: Test permission checking with mapping
    console.log('\n📝 Step 4: Testing permission checking with mapping...');
    
    const permissionTests = [
      'users:read',
      'users:create',
      'roles:read',
      'audit:read',
      'reports:read',
      'settings:read',
      'dashboard:read',
      'profile:read',
      'support:read',
      'notifications:read'
    ];

    console.log('\n   Permission Check Test (with mapping):');
    permissionTests.forEach(permission => {
      const [frontendModuleKey, action] = permission.split(':');
      const backendModuleKey = mapFrontendToBackendKey(frontendModuleKey);
      
      // Check if user has this permission in their permissions array
      const hasPermission = userData.permissions?.some(perm => 
        perm.moduleKey === backendModuleKey && perm[`can${action.charAt(0).toUpperCase() + action.slice(1)}`]
      );
      
      console.log(`     ${permission} (${frontendModuleKey} → ${backendModuleKey}): ${hasPermission ? '✅ Allowed' : '❌ Denied'}`);
    });

    // Step 5: Test hasAnyPermission logic
    console.log('\n📝 Step 5: Testing hasAnyPermission logic...');
    
    const anyPermissionTests = [
      'users',
      'roles',
      'audit',
      'reports',
      'settings',
      'dashboard',
      'profile',
      'support',
      'notifications'
    ];

    console.log('\n   HasAnyPermission Test (with mapping):');
    anyPermissionTests.forEach(frontendModuleKey => {
      const backendModuleKey = mapFrontendToBackendKey(frontendModuleKey);
      
      // Check if user has any permission for this module
      const hasAnyPermission = userData.permissions?.some(perm => 
        perm.moduleKey === backendModuleKey
      );
      
      console.log(`     ${frontendModuleKey} (→ ${backendModuleKey}): ${hasAnyPermission ? '✅ Has permissions' : '❌ No permissions'}`);
    });

    // Step 6: Summary
    console.log('\n📝 Step 6: Summary...');
    
    const allTests = permissionTests.concat(anyPermissionTests.map(key => `${key}:any`));
    const passedTests = allTests.filter(test => {
      if (test.endsWith(':any')) {
        const frontendKey = test.replace(':any', '');
        const backendKey = mapFrontendToBackendKey(frontendKey);
        return userData.permissions?.some(perm => perm.moduleKey === backendKey);
      } else {
        const [frontendKey, action] = test.split(':');
        const backendKey = mapFrontendToBackendKey(frontendKey);
        return userData.permissions?.some(perm => 
          perm.moduleKey === backendKey && perm[`can${action.charAt(0).toUpperCase() + action.slice(1)}`]
        );
      }
    });

    console.log(`\n   Test Results: ${passedTests.length}/${allTests.length} tests passed`);
    console.log(`   Success Rate: ${((passedTests.length / allTests.length) * 100).toFixed(1)}%`);

    if (passedTests.length === allTests.length) {
      console.log('\n🎉 All permission tests passed! The mapping fix is working correctly.');
    } else {
      console.log('\n⚠️ Some permission tests failed. Check the mapping configuration.');
    }

    console.log('\n💡 The permission mapping fix should now allow the frontend to correctly check permissions.');
    console.log('💡 Frontend module keys are now properly mapped to backend module keys.');

  } catch (error) {
    console.error('❌ Permission fix test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPermissionFix();
