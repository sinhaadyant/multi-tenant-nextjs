const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TENANT_SLUG = 'cons';
const TEST_USER = {
  email: 'test11@gmail.com',
  password: 'password123'
};

async function testSidebarFunctionality() {
  try {
    console.log('🚀 Testing Sidebar Functionality...\n');
    
    // Step 1: Login
    console.log('🔍 Step 1: Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TENANT_SLUG
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test modules API
    console.log('\n🔍 Step 2: Testing modules API...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (modulesResponse.data.success) {
      const modules = modulesResponse.data.data.modules;
      console.log(`✅ Modules API successful - ${modules.length} modules returned`);
      
      // Step 3: Check which modules should be visible in sidebar
      console.log('\n🔍 Step 3: Analyzing modules for sidebar...');
      
      const visibleModules = modules.filter(module => {
        const moduleKey = module.moduleKey;
        
        // Exclude module-management
        if (['module-management', 'modules'].includes(moduleKey)) {
          console.log(`❌ Module ${moduleKey} - explicitly excluded from sidebar`);
          return false;
        }
        
        // Check if module is enabled and visible
        if (!module.isEnabled) {
          console.log(`❌ Module ${moduleKey} - not enabled`);
          return false;
        }
        
        if (!module.isVisible) {
          console.log(`❌ Module ${moduleKey} - not visible`);
          return false;
        }
        
        console.log(`✅ Module ${moduleKey} - should be visible in sidebar`);
        return true;
      });
      
      console.log(`\n📋 Summary:`);
      console.log(`  Total modules from API: ${modules.length}`);
      console.log(`  Modules that should appear in sidebar: ${visibleModules.length}`);
      
      console.log(`\n🎯 Expected sidebar modules:`);
      visibleModules.forEach(module => {
        console.log(`  - ${module.moduleName} (${module.moduleKey})`);
      });
      
      // Step 4: Test user profile to see what permissions they have
      console.log('\n🔍 Step 4: Testing user profile...');
      const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me?includeModules=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data;
        console.log(`✅ User profile loaded`);
        console.log(`  User: ${userData.name} (${userData.email})`);
        console.log(`  Permissions: ${userData.permissions?.length || 0}`);
        console.log(`  Modules: ${userData.modules?.length || 0}`);
        
        if (userData.permissions && userData.permissions.length > 0) {
          console.log(`\n🔐 User Permissions:`);
          userData.permissions.forEach(permission => {
            console.log(`  - ${permission.moduleKey}: ${permission.canRead ? 'read' : ''}${permission.canCreate ? 'create' : ''}${permission.canUpdate ? 'update' : ''}${permission.canDelete ? 'delete' : ''}`);
          });
        }
      }
      
    } else {
      console.log('❌ Modules API failed:', modulesResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testSidebarFunctionality();
