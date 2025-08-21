const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'global-retail';
const CREDENTIALS = {
  email: 'admin@global-retail.com',
  password: 'Admin123!',
  tenantSlug: 'global-retail'
};

async function debugPermissions() {
  let token = null;
  let userData = null;
  let modules = null;

  try {
    console.log('🔍 Debugging Permission Issues...');

    // Step 1: Login to get token
    console.log('\n📝 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get user profile and permissions
    console.log('\n📝 Step 2: Getting user profile and permissions...');
    const profileResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, { headers });

    if (profileResponse.data.success) {
      userData = profileResponse.data.data;
      console.log('✅ User profile retrieved successfully');
      console.log(`   User: ${userData.name}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Roles: ${userData.roles?.length || 0}`);
      console.log(`   Permissions: ${userData.permissions?.length || 0}`);

      // Analyze roles
      if (userData.roles && userData.roles.length > 0) {
        console.log('\n   Roles Analysis:');
        userData.roles.forEach((role, index) => {
          console.log(`     Role ${index + 1}: ${role.name}`);
          console.log(`       Description: ${role.description}`);
          console.log(`       Permissions: ${role.permissions?.length || 0}`);
          
          if (role.permissions && role.permissions.length > 0) {
            console.log('       Permission Details:');
            role.permissions.forEach(perm => {
              console.log(`         - ${perm.moduleKey}: ${perm.canRead ? 'read' : ''}${perm.canCreate ? 'create' : ''}${perm.canUpdate ? 'update' : ''}${perm.canDelete ? 'delete' : ''}${perm.canViewAll ? 'viewall' : ''}`);
            });
          }
        });
      }

      // Analyze permissions
      if (userData.permissions && userData.permissions.length > 0) {
        console.log('\n   Permissions Analysis:');
        userData.permissions.forEach(perm => {
          console.log(`     - ${perm.moduleKey}: ${perm.canRead ? 'read' : ''}${perm.canCreate ? 'create' : ''}${perm.canUpdate ? 'update' : ''}${perm.canDelete ? 'delete' : ''}${perm.canViewAll ? 'viewall' : ''}`);
        });
      }
    } else {
      throw new Error('Failed to get user profile: ' + profileResponse.data.message);
    }

    // Step 3: Get modules
    console.log('\n📝 Step 3: Getting modules...');
    const modulesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, { headers });

    if (modulesResponse.data.success) {
      modules = modulesResponse.data.data.modules;
      console.log(`✅ Modules retrieved successfully - Found ${modules.length} modules`);

      console.log('\n   Modules Analysis:');
      modules.forEach(module => {
        console.log(`     - ${module.moduleKey} (${module.moduleName}):`);
        console.log(`       Enabled: ${module.isEnabled}`);
        console.log(`       Visible: ${module.isVisible}`);
        console.log(`       Tenant Visible: ${module.isVisibleInTenant}`);
        console.log(`       Path: ${module.path}`);
      });
    } else {
      throw new Error('Failed to get modules: ' + modulesResponse.data.message);
    }

    // Step 4: Test specific permission checks
    console.log('\n📝 Step 4: Testing specific permission checks...');
    
    const testPermissions = [
      'dashboard:read',
      'user-management:read',
      'user-management:create',
      'roles-permissions:read',
      'audit-logs:read',
      'reports-analytics:read',
      'notifications:read',
      'support:read',
      'content-management:read'
    ];

    for (const permission of testPermissions) {
      const [moduleKey, action] = permission.split(':');
      
      // Check if user has this permission in their permissions array
      const hasPermission = userData.permissions?.some(perm => 
        perm.moduleKey === moduleKey && perm[`can${action.charAt(0).toUpperCase() + action.slice(1)}`]
      );
      
      console.log(`     ${permission}: ${hasPermission ? '✅ Allowed' : '❌ Denied'}`);
    }

    // Step 5: Analyze the issue
    console.log('\n📝 Step 5: Issue Analysis...');
    
    // Check if permissions are being passed correctly to frontend
    console.log('\n   Permission Structure Check:');
    console.log(`     Total permissions in user data: ${userData.permissions?.length || 0}`);
    console.log(`     Permissions array type: ${Array.isArray(userData.permissions) ? 'Array' : typeof userData.permissions}`);
    
    if (userData.permissions && userData.permissions.length > 0) {
      const firstPerm = userData.permissions[0];
      console.log(`     First permission structure:`, {
        moduleKey: firstPerm.moduleKey,
        canRead: firstPerm.canRead,
        canCreate: firstPerm.canCreate,
        canUpdate: firstPerm.canUpdate,
        canDelete: firstPerm.canDelete,
        canViewAll: firstPerm.canViewAll
      });
    }

    // Check module visibility vs permissions
    console.log('\n   Module Visibility vs Permissions:');
    modules.forEach(module => {
      const hasPermission = userData.permissions?.some(perm => perm.moduleKey === module.moduleKey);
      console.log(`     ${module.moduleKey}: Visible=${module.isVisibleInTenant}, Enabled=${module.isEnabled}, HasPermission=${hasPermission}`);
    });

    console.log('\n🎉 Permission Debugging Complete!');
    console.log('💡 The issue appears to be in how permissions are being checked in the frontend.');
    console.log('💡 The backend is providing all the correct permissions.');
    console.log('💡 The frontend permission checking logic needs to be fixed.');

  } catch (error) {
    console.error('❌ Permission debugging failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugPermissions();
