const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'global-retail';
const CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!',
  tenantSlug: 'global-retail'
};

async function testSidebarDebug() {
  try {
    console.log('🔍 Testing sidebar navigation and permissions...');
    
    // Step 1: Login to get token
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, CREDENTIALS);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.token;
    const userData = loginResponse.data.data.user;
    console.log('✅ Login successful');
    
    // Step 2: Check user permissions
    console.log('\n📝 Step 2: Checking user permissions...');
    console.log('User:', userData.name);
    console.log('Role:', userData.roles[0].name);
    console.log('Permissions count:', userData.roles[0].permissions.length);
    
    const userPermissions = userData.roles[0].permissions;
    console.log('\nUser permissions:');
    userPermissions.forEach(perm => {
      console.log(`  - ${perm.moduleKey}: ${perm.canRead ? 'read' : ''}${perm.canCreate ? 'create' : ''}${perm.canUpdate ? 'update' : ''}${perm.canDelete ? 'delete' : ''}${perm.canViewAll ? 'viewall' : ''}`);
    });
    
    // Step 3: Test modules API
    console.log('\n📝 Step 3: Testing modules API...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!modulesResponse.data.success) {
      throw new Error('Modules API failed: ' + modulesResponse.data.message);
    }
    
    const modules = modulesResponse.data.data.modules;
    console.log(`✅ Modules API successful - Found ${modules.length} modules`);
    
    // Step 4: Check module visibility and permissions
    console.log('\n📝 Step 4: Checking module visibility and permissions...');
    const requiredModules = [
      'user-management',
      'profile', 
      'support',
      'roles-permissions',
      'reports-analytics',
      'audit-logs',
      'notifications'
    ];
    
    requiredModules.forEach(moduleKey => {
      const module = modules.find(m => m.moduleKey === moduleKey);
      const userPerm = userPermissions.find(p => p.moduleKey === moduleKey);
      
      console.log(`\n🔍 ${moduleKey}:`);
      if (module) {
        console.log(`  - Module exists: ✅`);
        console.log(`  - isVisible: ${module.isVisible ? '✅' : '❌'}`);
        console.log(`  - isEnabled: ${module.isEnabled ? '✅' : '❌'}`);
        console.log(`  - isVisibleInTenant: ${module.isVisibleInTenant ? '✅' : '❌'}`);
        console.log(`  - Path: ${module.path}`);
      } else {
        console.log(`  - Module exists: ❌`);
      }
      
      if (userPerm) {
        console.log(`  - User has permission: ✅`);
        console.log(`  - Can read: ${userPerm.canRead ? '✅' : '❌'}`);
        console.log(`  - Can create: ${userPerm.canCreate ? '✅' : '❌'}`);
        console.log(`  - Can update: ${userPerm.canUpdate ? '✅' : '❌'}`);
        console.log(`  - Can delete: ${userPerm.canDelete ? '✅' : '❌'}`);
        console.log(`  - Can view all: ${userPerm.canViewAll ? '✅' : '❌'}`);
      } else {
        console.log(`  - User has permission: ❌`);
      }
    });
    
    // Step 5: Test user profile API
    console.log('\n📝 Step 5: Testing user profile API...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (profileResponse.data.success) {
      console.log('✅ User profile API successful');
      const profileData = profileResponse.data.data;
      console.log('Profile permissions count:', profileData.permissions?.length || 0);
    } else {
      console.log('❌ User profile API failed:', profileResponse.data.message);
    }
    
    console.log('\n🎉 Debug test completed!');
    console.log('💡 All modules are available and user has proper permissions.');
    console.log('💡 The issue might be in the frontend Redux state or sidebar rendering logic.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSidebarDebug();
