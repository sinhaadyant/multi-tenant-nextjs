const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TENANT_SLUG = 'cons';
const TEST_USER = {
  email: 'test11@gmail.com',
  password: 'password123'
};

async function debugSidebarIssues() {
  try {
    console.log('🔍 Debugging Sidebar Issues...\n');
    
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
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    // Step 2: Test modules API with detailed logging
    console.log('\n🔍 Step 2: Testing modules API...');
    try {
      const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Modules API Response:');
      console.log('  Status:', modulesResponse.status);
      console.log('  Success:', modulesResponse.data.success);
      console.log('  Modules Count:', modulesResponse.data.data?.modules?.length || 0);
      console.log('  Permissions:', modulesResponse.data.data?.permissions);
      
      if (modulesResponse.data.success && modulesResponse.data.data.modules) {
        const modules = modulesResponse.data.data.modules;
        console.log('\n📋 Modules Details:');
        modules.forEach((module, index) => {
          console.log(`  ${index + 1}. ${module.moduleName} (${module.moduleKey})`);
          console.log(`     - Enabled: ${module.isEnabled}`);
          console.log(`     - Visible: ${module.isVisible}`);
          console.log(`     - Visible in Tenant: ${module.isVisibleInTenant}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Modules API Error:');
      console.log('  Status:', error.response?.status);
      console.log('  Message:', error.response?.data?.message || error.message);
      console.log('  Headers:', error.response?.headers);
    }
    
    // Step 3: Test dashboard API
    console.log('\n🔍 Step 3: Testing dashboard API...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Dashboard API Response:');
      console.log('  Status:', dashboardResponse.status);
      console.log('  Success:', dashboardResponse.data.success);
      console.log('  Summary:', dashboardResponse.data.data?.summary);
      console.log('  Permissions:', dashboardResponse.data.data?.permissions);
      
    } catch (error) {
      console.log('❌ Dashboard API Error:');
      console.log('  Status:', error.response?.status);
      console.log('  Message:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Test user profile
    console.log('\n🔍 Step 4: Testing user profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me?includeModules=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Profile API Response:');
      console.log('  Status:', profileResponse.status);
      console.log('  Success:', profileResponse.data.success);
      console.log('  User:', profileResponse.data.data?.name);
      console.log('  Permissions Count:', profileResponse.data.data?.permissions?.length || 0);
      console.log('  Modules Count:', profileResponse.data.data?.modules?.length || 0);
      
    } catch (error) {
      console.log('❌ Profile API Error:');
      console.log('  Status:', error.response?.status);
      console.log('  Message:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

debugSidebarIssues();
