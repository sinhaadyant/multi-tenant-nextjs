const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function testReduxState() {
  console.log('🧪 Testing Redux state population...\n');

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

    // Step 2: Get user profile (this simulates what happens after login)
    console.log('2️⃣ Fetching user profile (simulating post-login)...');
    const profileResponse = await api.get(`/api/tenant/${TENANT_SLUG}/profile`);
    
    if (!profileResponse.data.success) {
      throw new Error(`Profile fetch failed: ${profileResponse.data.message}`);
    }

    const profileData = profileResponse.data.data;
    console.log('✅ Profile fetched successfully\n');

    // Step 3: Simulate what should be in Redux state
    console.log('3️⃣ Simulating Redux state...');
    
    const { user, permissions, modules } = profileData;
    
    // Simulate the Redux state that should be created
    const simulatedReduxState = {
      tenantAuth: {
        isLoggedIn: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.roles?.[0]?.name || 'user',
          tenantId: user.tenant?.id || '',
          tenantSlug: user.tenant?.slug || '',
          avatar: user.avatar,
          permissions: permissions?.map((p) => p.moduleKey) || [],
          accessibleModules: permissions?.map((p) => p.moduleKey) || [],
          hasAccess: true
        },
        token: token,
        tenant: user.tenant,
        modules: modules,
        modulesLoading: false,
        modulesError: null
      },
      permissions: {
        userPermissions: {
          user: user,
          permissions: permissions,
          accessibleModules: permissions?.map((p) => p.moduleKey) || [],
          modulePermissions: {},
          menuItems: [],
          hasAccess: true,
          totalPermissions: permissions?.length || 0,
          totalModules: modules?.length || 0
        },
        isLoading: false,
        error: null
      }
    };

    console.log('📊 Simulated Redux state structure:');
    console.log('- tenantAuth.isLoggedIn:', simulatedReduxState.tenantAuth.isLoggedIn);
    console.log('- tenantAuth.user.name:', simulatedReduxState.tenantAuth.user.name);
    console.log('- tenantAuth.modules.length:', simulatedReduxState.tenantAuth.modules?.length || 0);
    console.log('- tenantAuth.modulesLoading:', simulatedReduxState.tenantAuth.modulesLoading);
    console.log('- tenantAuth.modulesError:', simulatedReduxState.tenantAuth.modulesError);
    console.log('- permissions.userPermissions.permissions.length:', simulatedReduxState.permissions.userPermissions.permissions?.length || 0);
    console.log('- permissions.userPermissions.accessibleModules:', simulatedReduxState.permissions.userPermissions.accessibleModules);

    // Step 4: Test what the sidebar should see
    console.log('\n4️⃣ Testing sidebar data access...');
    
    // Simulate what useTenantAuth should return
    const sidebarData = {
      user: simulatedReduxState.tenantAuth.user,
      permissions: simulatedReduxState.permissions.userPermissions.permissions,
      roles: user.roles,
      tenant: simulatedReduxState.tenantAuth.tenant,
      modules: simulatedReduxState.tenantAuth.modules,
      modulesLoading: simulatedReduxState.tenantAuth.modulesLoading,
      modulesError: simulatedReduxState.tenantAuth.modulesError
    };

    console.log('🔍 Sidebar data:');
    console.log('- user.name:', sidebarData.user.name);
    console.log('- modules.length:', sidebarData.modules?.length || 0);
    console.log('- modulesLoading:', sidebarData.modulesLoading);
    console.log('- modulesError:', sidebarData.modulesError);
    console.log('- permissions.length:', sidebarData.permissions?.length || 0);

    // Step 5: Test the sidebar filtering logic
    console.log('\n5️⃣ Testing sidebar filtering logic...');
    
    if (sidebarData.modulesLoading) {
      console.log('⏳ Modules are still loading...');
    } else if (sidebarData.modulesError) {
      console.log('❌ Error loading modules:', sidebarData.modulesError);
    } else if (!sidebarData.modules || sidebarData.modules.length === 0) {
      console.log('⚠️ No modules found in Redux state');
    } else {
      console.log('✅ Modules found in Redux state, applying filtering...');
      
      const visibleModules = sidebarData.modules.filter(module => {
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

        const hasPermission = sidebarData.permissions?.some(p => 
          p.moduleKey === moduleKey && (p.canRead || p.canCreate || p.canUpdate || p.canDelete)
        );
        
        return hasPermission;
      });

      console.log('🎯 Final sidebar modules:', visibleModules.map(m => m.moduleKey));
      console.log(`📊 Total modules: ${sidebarData.modules.length}, Visible: ${visibleModules.length}`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('📝 If the sidebar shows "No modules available", check the browser console for Redux state issues.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testReduxState();
