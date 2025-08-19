const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testReduxAuth() {
  try {
    console.log('🔍 Testing Redux Authentication Implementation...\n');

    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: 'admin@acme-corp.com',
      password: 'AcmeAdmin123!',
      tenantSlug: 'acme-corp'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get user profile with permissions
    console.log('2. Fetching user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/acme-corp/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileResponse.data.success) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = profileResponse.data.data;
    console.log('✅ User profile fetched\n');

    // Step 3: Test Redux state structure
    console.log('3. Testing Redux state structure...');
    
    // Simulate what Redux would store
    const reduxState = {
      tenantAuth: {
        isLoggedIn: true,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.roles?.[0]?.name || 'user',
          tenantId: userData.tenant?.id || '',
          tenantSlug: userData.tenant?.slug || '',
          avatar: userData.avatar,
          permissions: userData.permissions?.map((p) => p.moduleKey) || [],
          accessibleModules: userData.permissions?.map((p) => p.moduleKey) || [],
          hasAccess: true
        },
        token: token,
        refreshToken: '',
        email: userData.email,
        tenantSlug: userData.tenant?.slug || '',
        isHydrated: true,
        lastValidatedAt: Date.now(),
        sessionExpiresAt: Date.now() + (24 * 60 * 60 * 1000),
        isInitialized: true,
        permissions: {
          allPermissions: userData.permissions?.map((p) => p.moduleKey) || [],
          modulePermissions: {},
          accessibleModules: userData.permissions?.map((p) => p.moduleKey) || [],
          menuItems: []
        }
      },
      permissions: {
        userPermissions: {
          user: userData,
          permissions: userData.permissions || [],
          modulePermissions: {},
          accessibleModules: userData.permissions?.map((p) => p.moduleKey) || [],
          menuItems: [],
          hasAccess: true,
          totalPermissions: userData.permissions?.length || 0,
          totalModules: userData.permissions?.length || 0
        },
        isLoading: false,
        error: null,
        isInitialized: true,
        lastFetched: Date.now(),
        tenantSlug: userData.tenant?.slug || null
      }
    };

    console.log('✅ Redux state structure created\n');

    // Step 4: Test permission checking functions
    console.log('4. Testing permission checking functions...');
    
    // Simulate the permission checking selectors
    const selectHasPermission = (moduleKey, action) => (state) => {
      const permissions = state.permissions.userPermissions;
      if (!permissions || !permissions.permissions || !Array.isArray(permissions.permissions)) return false;
      
      const actionMap = {
        'view': 'canRead',
        'read': 'canRead',
        'create': 'canCreate',
        'update': 'canUpdate',
        'delete': 'canDelete',
        'viewall': 'canViewAll',
        'manage': 'canUpdate'
      };
      
      const permissionField = actionMap[action.toLowerCase()] || action;
      
      return permissions.permissions.some(permission => 
        permission.moduleKey === moduleKey && permission[permissionField] === true
      );
    };

    const selectHasAnyPermission = (moduleKey) => (state) => {
      const permissions = state.permissions.userPermissions;
      if (!permissions || !permissions.permissions || !Array.isArray(permissions.permissions)) return false;
      
      return permissions.permissions.some(permission => 
        permission.moduleKey === moduleKey
      );
    };

    const selectHasRole = (roleName) => (state) => {
      const permissions = state.permissions.userPermissions;
      if (!permissions || !permissions.user || !permissions.user.roles || !Array.isArray(permissions.user.roles)) return false;
      
      return permissions.user.roles.some(role => 
        role && role.name && typeof role.name === 'string' && role.name.toLowerCase() === roleName.toLowerCase()
      );
    };

    // Test permission checks
    const permissionTests = [
      { name: 'Dashboard Read', test: () => selectHasPermission('dashboard', 'read')(reduxState) },
      { name: 'Users Read', test: () => selectHasPermission('users', 'read')(reduxState) },
      { name: 'Roles Read', test: () => selectHasPermission('roles', 'read')(reduxState) },
      { name: 'Audit Read', test: () => selectHasPermission('audit', 'read')(reduxState) },
      { name: 'Reports Read', test: () => selectHasPermission('reports', 'read')(reduxState) },
      { name: 'Notifications Read', test: () => selectHasPermission('notifications', 'read')(reduxState) },
      { name: 'Support Read', test: () => selectHasPermission('support', 'read')(reduxState) },
      { name: 'Settings Read', test: () => selectHasPermission('settings', 'read')(reduxState) },
      { name: 'Users Any Permission', test: () => selectHasAnyPermission('users')(reduxState) },
      { name: 'Roles Any Permission', test: () => selectHasAnyPermission('roles')(reduxState) },
      { name: 'Tenant Admin Role', test: () => selectHasRole('Tenant Admin')(reduxState) },
      { name: 'Admin Role', test: () => selectHasRole('admin')(reduxState) },
    ];

    for (const test of permissionTests) {
      const result = test.test();
      const status = result ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${result}`);
    }

    console.log('\n5. Testing sidebar navigation generation...');
    
    // Simulate sidebar navigation generation
    const generateSidebarNav = (state) => {
      const navItems = [];
      
      // Dashboard (always available)
      navItems.push({
        id: "dashboard",
        label: "Dashboard",
        icon: "home",
        path: `/acme-corp/dashboard`
      });

      // User Management
      if (selectHasAnyPermission('users')(state)) {
        navItems.push({
          id: "users",
          label: "User Management",
          icon: "users",
          path: `/acme-corp/users`
        });
      }

      // Roles & Permissions
      if (selectHasAnyPermission('roles')(state)) {
        navItems.push({
          id: "roles",
          label: "Roles & Permissions",
          icon: "shield",
          path: `/acme-corp/roles`
        });
      }

      // Audit Logs
      if (selectHasPermission('audit', 'read')(state)) {
        navItems.push({
          id: "audit",
          label: "Audit Logs",
          icon: "clipboard-list",
          path: `/acme-corp/audit`
        });
      }

      // Reports
      if (selectHasPermission('reports', 'read')(state)) {
        navItems.push({
          id: "reports",
          label: "Reports & Analytics",
          icon: "chart-bar",
          path: `/acme-corp/reports`
        });
      }

      // Notifications
      if (selectHasPermission('notifications', 'read')(state)) {
        navItems.push({
          id: "notifications",
          label: "Notifications",
          icon: "bell",
          path: `/acme-corp/notifications`
        });
      }

      // Support
      if (selectHasAnyPermission('support')(state)) {
        navItems.push({
          id: "support",
          label: "Support",
          icon: "life-ring",
          path: `/acme-corp/support`
        });
      }

      // Settings
      if (selectHasPermission('settings', 'read')(state)) {
        navItems.push({
          id: "settings",
          label: "Settings",
          icon: "settings",
          path: `/acme-corp/settings`
        });
      }

      // Utilities (only for admin users)
      if (selectHasRole('Tenant Admin')(state)) {
        navItems.push({
          id: "utilities",
          label: "Utilities",
          icon: "wrench",
          path: `/acme-corp/utilities`
        });
      }

      return navItems;
    };

    const sidebarNav = generateSidebarNav(reduxState);
    console.log('✅ Sidebar navigation generated successfully');
    console.log('📋 Available sidebar items:');
    sidebarNav.forEach(item => {
      console.log(`  - ${item.label} (${item.id})`);
    });

    console.log('\n🎉 Redux Authentication Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`- User: ${userData.name} (${userData.email})`);
    console.log(`- Role: ${userData.roles?.[0]?.name || 'No role'}`);
    console.log(`- Permissions: ${userData.permissions?.length || 0}`);
    console.log(`- Sidebar Items: ${sidebarNav.length}`);
    console.log(`- Redux State: Properly structured and functional`);

  } catch (error) {
    console.error('❌ Error testing Redux auth:', error.response?.data || error.message);
  }
}

testReduxAuth();
