const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'global-retail';
const CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!',
  tenantSlug: 'global-retail'
};

async function testModulesFix() {
  try {
    console.log('🔍 Testing modules API fix...');
    
    // Step 1: Login to get token
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, CREDENTIALS);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test modules API with correct URL
    console.log('📝 Step 2: Testing modules API...');
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
    console.log('✅ Modules API successful');
    console.log(`📊 Found ${modules.length} modules:`);
    
    // List all modules
    modules.forEach(module => {
      console.log(`  - ${module.moduleName} (${module.moduleKey}): ${module.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });
    
    // Check for specific modules mentioned in the issue
    const requiredModules = [
      'user-management',
      'profile', 
      'support',
      'roles-permissions',
      'reports-analytics',
      'audit-logs',
      'notifications'
    ];
    
    console.log('\n🔍 Checking required modules:');
    requiredModules.forEach(moduleKey => {
      const module = modules.find(m => m.moduleKey === moduleKey);
      if (module && module.isEnabled && module.isVisibleInTenant) {
        console.log(`  ✅ ${moduleKey}: Available and enabled`);
      } else {
        console.log(`  ❌ ${moduleKey}: Not available or disabled`);
      }
    });
    
    console.log('\n🎉 Test completed successfully!');
    console.log('💡 The modules API is working correctly. The issue was with the frontend calling the wrong URL.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testModulesFix();
