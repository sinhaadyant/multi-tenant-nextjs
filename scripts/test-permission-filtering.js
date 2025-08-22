const axios = require('axios');

const BASE_URL = 'http://localhost:3003';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function testPermissionFiltering() {
  console.log('🧪 Testing permission-based module filtering...\n');

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

    // Step 2: Get modules
    console.log('2️⃣ Fetching modules...');
    const modulesResponse = await api.get(`/api/tenant/${TENANT_SLUG}/modules`);
    
    if (!modulesResponse.data.success) {
      throw new Error(`Modules fetch failed: ${modulesResponse.data.message}`);
    }

    const modulesData = modulesResponse.data.data;
    console.log('✅ Modules fetched successfully\n');

    // Step 3: Get user profile for permissions
    console.log('3️⃣ Fetching user profile for permissions...');
    const profileResponse = await api.get(`/api/tenant/${TENANT_SLUG}/profile`);
    
    console.log('📊 Profile response:', JSON.stringify(profileResponse.data, null, 2));
    
    // For now, let's work with just the modules data
    const modules = modulesData.modules || [];
    
    console.log('\n📋 Available Modules:', modules.map(m => ({
      key: m.moduleKey,
      name: m.moduleName,
      enabled: m.isEnabled,
      visible: m.isVisible,
      visibleInTenant: m.isVisibleInTenant
    })));

    // Now test the actual permission-based filtering
    console.log('\n4️⃣ Testing permission-based module filtering...');
    
    const userPermissions = profileResponse.data.data.permissions;
    console.log('🔐 User permissions:', userPermissions.map(p => p.moduleKey));
    
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
      const hasPermission = userPermissions.some(p => 
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

    console.log('\n✅ Test completed successfully!');
    console.log('📝 Note: Permission-based filtering is implemented in the sidebar component.');
    console.log('🔍 Check the browser console to see the actual permission filtering in action.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPermissionFiltering();
