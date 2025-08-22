const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function testMeEndpoint() {
  console.log('🧪 Testing /me endpoint...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER,
      password: TEST_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const { token } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Set up axios with auth token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test /me endpoint with modules
    console.log('2️⃣ Testing /me endpoint with modules...');
    const meResponse = await api.get(`/api/tenant/${TENANT_SLUG}/me?includeModules=true`);
    
    if (!meResponse.data.success) {
      throw new Error(`/me endpoint failed: ${meResponse.data.message}`);
    }

    const meData = meResponse.data.data;
    console.log('✅ /me endpoint successful\n');

    // Step 3: Analyze the data
    console.log('3️⃣ Analyzing /me endpoint data...');
    console.log('🔍 Raw meData structure:', Object.keys(meData));
    
    // The /me endpoint returns user data directly, not nested under 'user'
    const user = meData;
    const permissions = meData.permissions;
    const modules = meData.modules;
    
    console.log('👤 User:', {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles?.map(r => r.name) || []
    });

    console.log('\n🔐 Permissions:', {
      count: permissions?.length || 0,
      modules: permissions?.map(p => p.moduleKey) || []
    });

    console.log('\n📋 Modules:', {
      count: modules?.length || 0,
      modules: modules?.map(m => ({
        key: m.moduleKey,
        name: m.moduleName,
        enabled: m.isEnabled,
        visible: m.isVisible,
        visibleInTenant: m.isVisibleInTenant
      })) || []
    });

    // Step 4: Test the sidebar filtering logic
    console.log('\n4️⃣ Testing sidebar filtering logic with /me data...');
    
    if (!modules || modules.length === 0) {
      console.log('❌ No modules found in /me response');
      return;
    }

    // Simulate the sidebar filtering logic
    const visibleModules = modules.filter(module => {
      const moduleKey = module.moduleKey;
      
      // Explicitly exclude module-management from sidebar
      if (['module-management', 'modules'].includes(moduleKey)) {
        console.log(`❌ Module ${moduleKey} - explicitly excluded from sidebar`);
        return false;
      }
      
      // Check if module is visible in tenant
      if (module.isVisibleInTenant === false) {
        console.log(`❌ Module ${moduleKey} is not visible in tenant`);
        return false;
      }

      // Check if module is enabled
      if (module.isEnabled === false) {
        console.log(`❌ Module ${moduleKey} is not enabled`);
        return false;
      }

      // Check if module is visible globally
      if (module.isVisible === false) {
        console.log(`❌ Module ${moduleKey} is not visible globally`);
        return false;
      }

      // Special handling for modules that should be available to all users
      if (['dashboard', 'profile'].includes(moduleKey)) {
        console.log(`✅ Module ${moduleKey} is available to all users`);
        return true;
      }

      // Check if user has permissions for this module
      const hasPermission = permissions?.some(p => 
        p.moduleKey === moduleKey && (p.canRead || p.canCreate || p.canUpdate || p.canDelete)
      );
      
      if (hasPermission) {
        console.log(`✅ Module ${moduleKey} - user has permissions`);
        return true;
      } else {
        console.log(`❌ Module ${moduleKey} - no permissions, excluding from sidebar`);
        return false;
      }
    });

    console.log('\n🎯 Final sidebar modules:', visibleModules.map(m => m.moduleKey));
    console.log(`📊 Total modules: ${modules.length}, Visible: ${visibleModules.length}`);

    console.log('\n✅ /me endpoint test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testMeEndpoint();
