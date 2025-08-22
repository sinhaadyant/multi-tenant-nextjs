const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TENANT_SLUG = 'cons';
const TEST_USER = {
  email: 'test11@gmail.com',
  password: 'password123'
};

async function testReduxModules() {
  try {
    console.log('🔍 Testing Redux Modules...\n');
    
    // Step 1: Login
    console.log('🔍 Step 1: Login...');
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
    
    // Step 2: Test user profile (this should populate Redux with modules)
    console.log('\n🔍 Step 2: Testing user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me?includeModules=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (profileResponse.data.success) {
      const userData = profileResponse.data.data;
      console.log('✅ User profile loaded');
      console.log(`  User: ${userData.name} (${userData.email})`);
      console.log(`  Permissions: ${userData.permissions?.length || 0}`);
      console.log(`  Modules: ${userData.modules?.length || 0}`);
      
      if (userData.modules && userData.modules.length > 0) {
        console.log('\n📋 Modules from API:');
        userData.modules.forEach((module, index) => {
          console.log(`  ${index + 1}. ${module.moduleName} (${module.moduleKey})`);
          console.log(`     - Enabled: ${module.isEnabled}`);
          console.log(`     - Visible: ${module.isVisible}`);
        });
      }
    } else {
      console.log('❌ Profile API failed:', profileResponse.data.message);
    }
    
    // Step 3: Test modules API directly
    console.log('\n🔍 Step 3: Testing modules API...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (modulesResponse.data.success) {
      const modules = modulesResponse.data.data.modules;
      console.log(`✅ Modules API successful - ${modules.length} modules`);
      
      console.log('\n📋 Modules from Modules API:');
      modules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.moduleName} (${module.moduleKey})`);
        console.log(`     - Enabled: ${module.isEnabled}`);
        console.log(`     - Visible: ${module.isVisible}`);
      });
    } else {
      console.log('❌ Modules API failed:', modulesResponse.data.message);
    }
    
    console.log('\n🎯 Summary:');
    console.log('  - Both APIs should return the same modules');
    console.log('  - Redux should store modules from user profile');
    console.log('  - Sidebar should read from Redux modules');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testReduxModules();
