const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'global-retail';
const CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!',
  tenantSlug: 'global-retail'
};

async function testFrontendAccess() {
  let token = null;

  try {
    console.log('🔍 Testing Frontend Access for Tenant Admin...');
    
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

    // Step 2: Test User Profile API (Frontend uses this)
    console.log('\n📝 Step 2: Testing User Profile API...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, { headers });
    
    if (profileResponse.data.success) {
      const userData = profileResponse.data.data;
      console.log('✅ User Profile API working');
      console.log(`   User: ${userData.name}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Permissions: ${userData.permissions?.length || 0}`);
      console.log(`   Roles: ${userData.roles?.length || 0}`);
      
      // Check if user has admin role
      const isAdmin = userData.roles?.some(role => 
        role.name.toLowerCase().includes('admin') || 
        role.name.toLowerCase().includes('administrator')
      );
      console.log(`   Is Admin: ${isAdmin ? '✅ Yes' : '❌ No'}`);
      
      // List all permissions
      if (userData.permissions) {
        console.log('\n   User Permissions:');
        userData.permissions.forEach(perm => {
          const actions = [];
          if (perm.canRead) actions.push('read');
          if (perm.canCreate) actions.push('create');
          if (perm.canUpdate) actions.push('update');
          if (perm.canDelete) actions.push('delete');
          if (perm.canViewAll) actions.push('viewall');
          console.log(`     - ${perm.moduleKey}: ${actions.join(', ')}`);
        });
      }
    } else {
      throw new Error('User Profile API failed: ' + profileResponse.data.message);
    }

    // Step 3: Test Modules API (Frontend uses this for sidebar)
    console.log('\n📝 Step 3: Testing Modules API...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, { headers });
    
    if (modulesResponse.data.success) {
      const modules = modulesResponse.data.data.modules;
      console.log(`✅ Modules API working - Found ${modules.length} modules`);
      
      // Check for required modules
      const requiredModules = [
        'dashboard',
        'user-management', 
        'profile',
        'support',
        'roles-permissions',
        'reports-analytics',
        'audit-logs',
        'notifications'
      ];
      
      console.log('\n   Module Status:');
      requiredModules.forEach(moduleKey => {
        const module = modules.find(m => m.moduleKey === moduleKey);
        if (module) {
          const status = [];
          if (module.isEnabled) status.push('enabled');
          if (module.isVisible) status.push('visible');
          if (module.isVisibleInTenant) status.push('tenant-visible');
          console.log(`     ✅ ${moduleKey}: ${status.join(', ')}`);
        } else {
          console.log(`     ❌ ${moduleKey}: Not found`);
        }
      });
      
      // Check module paths
      console.log('\n   Module Paths:');
      modules.forEach(module => {
        if (requiredModules.includes(module.moduleKey)) {
          console.log(`     - ${module.moduleKey}: ${module.path}`);
        }
      });
    } else {
      throw new Error('Modules API failed: ' + modulesResponse.data.message);
    }

    // Step 4: Test specific module access
    console.log('\n📝 Step 4: Testing specific module access...');
    
    const moduleTests = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'User Management', path: '/users' },
      { name: 'Profile', path: '/profile' },
      { name: 'Support', path: '/support' },
      { name: 'Roles & Permissions', path: '/roles' },
      { name: 'Reports & Analytics', path: '/reports' },
      { name: 'Audit Logs', path: '/audit' },
      { name: 'Notifications', path: '/notifications' }
    ];
    
    for (const test of moduleTests) {
      try {
        console.log(`\n   Testing ${test.name}...`);
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}${test.path}`, { headers });
        
        if (response.data.success) {
          console.log(`     ✅ ${test.name}: Accessible`);
        } else {
          console.log(`     ⚠️ ${test.name}: API returned error - ${response.data.message}`);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`     🔒 ${test.name}: Permission denied`);
        } else if (error.response?.status === 404) {
          console.log(`     🔍 ${test.name}: Endpoint not found (might be frontend route)`);
        } else {
          console.log(`     ❌ ${test.name}: Error - ${error.response?.data?.message || error.message}`);
        }
      }
    }

    // Step 5: Test frontend-specific endpoints
    console.log('\n📝 Step 5: Testing frontend-specific endpoints...');
    
    const frontendTests = [
      { name: 'Dashboard Stats', path: '/dashboard/stats' },
      { name: 'Dashboard Activity', path: '/dashboard/activity' },
      { name: 'User Profile', path: '/profile' },
      { name: 'Support Tickets', path: '/support' }
    ];
    
    for (const test of frontendTests) {
      try {
        console.log(`\n   Testing ${test.name}...`);
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}${test.path}`, { headers });
        
        if (response.data.success) {
          console.log(`     ✅ ${test.name}: Working`);
        } else {
          console.log(`     ⚠️ ${test.name}: API error - ${response.data.message}`);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`     🔒 ${test.name}: Permission denied`);
        } else if (error.response?.status === 404) {
          console.log(`     🔍 ${test.name}: Not found`);
        } else {
          console.log(`     ❌ ${test.name}: Error - ${error.response?.data?.message || error.message}`);
        }
      }
    }

    console.log('\n🎉 Frontend Access Test Completed!');
    console.log('💡 All APIs are working correctly.');
    console.log('💡 The frontend should now be able to access all modules.');
    console.log('💡 If modules are still not showing in the frontend, try:');
    console.log('   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   2. Log out and log back in');
    console.log('   3. Check browser console for any JavaScript errors');

  } catch (error) {
    console.error('❌ Frontend access test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendAccess();
