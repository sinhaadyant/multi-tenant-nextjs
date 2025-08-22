const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function debugSidebarIssue() {
  console.log('🔍 Debugging sidebar issue for test11@gmail.com...\n');

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

    // Step 2: Get user profile with permissions and modules
    console.log('2️⃣ Fetching user profile...');
    const profileResponse = await api.get(`/api/tenant/${TENANT_SLUG}/profile`);
    
    if (!profileResponse.data.success) {
      throw new Error(`Profile fetch failed: ${profileResponse.data.message}`);
    }

    const profileData = profileResponse.data.data;
    console.log('✅ Profile fetched successfully\n');

    // Step 3: Analyze the data
    console.log('3️⃣ Analyzing profile data...');
    
    const { user, permissions, modules } = profileData;
    
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
    console.log('\n4️⃣ Testing sidebar filtering logic...');
    
    if (!modules || modules.length === 0) {
      console.log('❌ No modules found in profile response');
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

    // Step 5: Check Redux state simulation
    console.log('\n5️⃣ Simulating Redux state...');
    
    // Simulate what should be in Redux
    const simulatedReduxState = {
      permissions: {
        userPermissions: {
          user: user,
          permissions: permissions,
          accessibleModules: permissions?.map(p => p.moduleKey) || [],
          modulePermissions: {},
          menuItems: [],
          hasAccess: true,
          totalPermissions: permissions?.length || 0,
          totalModules: modules?.length || 0
        }
      },
      tenantAuth: {
        modules: modules,
        modulesLoading: false,
        modulesError: null
      }
    };

    console.log('📊 Simulated Redux state:', {
      userPermissionsAvailable: !!simulatedReduxState.permissions.userPermissions,
      accessibleModules: simulatedReduxState.permissions.userPermissions.accessibleModules,
      modulesCount: simulatedReduxState.tenantAuth.modules?.length || 0,
      modulesLoading: simulatedReduxState.tenantAuth.modulesLoading,
      modulesError: simulatedReduxState.tenantAuth.modulesError
    });

    // Step 6: Test the sidebar logic with simulated Redux state
    console.log('\n6️⃣ Testing sidebar logic with simulated Redux state...');
    
    const userPermissions = simulatedReduxState.permissions.userPermissions;
    const apiModules = simulatedReduxState.tenantAuth.modules;
    const modulesLoading = simulatedReduxState.tenantAuth.modulesLoading;
    const modulesError = simulatedReduxState.tenantAuth.modulesError;

    // Simulate the checkApiPermission function
    const checkApiPermission = (moduleKey) => {
      if (['dashboard', 'profile'].includes(moduleKey)) {
        return true;
      }
      
      if (!userPermissions) {
        console.log(`❌ Module ${moduleKey} - no permissions available`);
        return false;
      }

      if (userPermissions.accessibleModules && userPermissions.accessibleModules.includes(moduleKey)) {
        console.log(`✅ Module ${moduleKey} - found in accessible modules`);
        return true;
      }

      const modulePermissions = userPermissions.modulePermissions?.[moduleKey];
      if (modulePermissions && modulePermissions.length > 0) {
        console.log(`✅ Module ${moduleKey} - has module permissions:`, modulePermissions);
        return true;
      }

      const hasAnyModulePermission = userPermissions.permissions?.some((permission) => 
        permission.moduleKey === moduleKey && (permission.canRead || permission.canCreate || permission.canUpdate || permission.canDelete)
      );
      
      if (hasAnyModulePermission) {
        console.log(`✅ Module ${moduleKey} - has matching permissions`);
        return true;
      }

      console.log(`❌ Module ${moduleKey} - no permissions found`);
      return false;
    };

    // Simulate the getTenantNavElements function
    if (modulesLoading) {
      console.log('⏳ Loading modules from API...');
    } else if (modulesError) {
      console.error('❌ Error loading modules from API:', modulesError);
    } else if (!apiModules || apiModules.length === 0) {
      console.log('⚠️ No modules found in API response');
    } else {
      console.log('✅ Modules found, applying filtering...');
      
      const filteredModules = apiModules.filter((module) => {
        const moduleKey = module.moduleKey;
        
        if (['module-management', 'modules'].includes(moduleKey)) {
          return false;
        }
        
        if (module.isVisibleInTenant === false) {
          return false;
        }

        if (module.isEnabled === false) {
          return false;
        }

        if (module.isVisible === false) {
          return false;
        }

        if (['dashboard', 'profile'].includes(moduleKey)) {
          return true;
        }

        return checkApiPermission(moduleKey);
      });

      console.log('🎯 Filtered modules for sidebar:', filteredModules.map(m => m.moduleKey));
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugSidebarIssue();
