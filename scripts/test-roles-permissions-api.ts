import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000/api/superadmin';

// Mock superadmin token for testing
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer test-superadmin-token'
});

async function testRolesAPI() {
  console.log('🧪 Testing Roles API...\n');

  try {
    // Test 1: Get all roles
    console.log('1. Testing GET /api/superadmin/roles');
    const rolesResponse = await fetch(`${BASE_URL}/roles`, {
      headers: getAuthHeaders()
    });
    const rolesData = await rolesResponse.json();
    
    if (rolesResponse.ok) {
      console.log('✅ Roles fetched successfully');
      console.log(`   Found ${rolesData.data.roles.length} roles`);
    } else {
      console.log('❌ Failed to fetch roles:', rolesData.message);
    }

    // Test 2: Get all permissions
    console.log('\n2. Testing GET /api/superadmin/permissions');
    const permissionsResponse = await fetch(`${BASE_URL}/permissions`, {
      headers: getAuthHeaders()
    });
    const permissionsData = await permissionsResponse.json();
    
    if (permissionsResponse.ok) {
      console.log('✅ Permissions fetched successfully');
      console.log(`   Found ${permissionsData.data.permissions.length} permissions`);
    } else {
      console.log('❌ Failed to fetch permissions:', permissionsData.message);
    }

    // Test 3: Get specific role
    if (rolesData.data.roles.length > 0) {
      const firstRole = rolesData.data.roles[0];
      console.log(`\n3. Testing GET /api/superadmin/roles/${firstRole.id}`);
      const roleResponse = await fetch(`${BASE_URL}/roles/${firstRole.id}`, {
        headers: getAuthHeaders()
      });
      const roleData = await roleResponse.json();
      
      if (roleResponse.ok) {
        console.log('✅ Role details fetched successfully');
        console.log(`   Role: ${roleData.data.role.name}`);
        console.log(`   Permissions: ${roleData.data.role.permissions.length}`);
      } else {
        console.log('❌ Failed to fetch role details:', roleData.message);
      }
    }

    // Test 4: Get specific permission
    if (permissionsData.data.permissions.length > 0) {
      const firstPermission = permissionsData.data.permissions[0];
      console.log(`\n4. Testing GET /api/superadmin/permissions/${firstPermission.id}`);
      const permissionResponse = await fetch(`${BASE_URL}/permissions/${firstPermission.id}`, {
        headers: getAuthHeaders()
      });
      const permissionData = await permissionResponse.json();
      
      if (permissionResponse.ok) {
        console.log('✅ Permission details fetched successfully');
        console.log(`   Permission: ${permissionData.data.permission.name}`);
        console.log(`   Module: ${permissionData.data.permission.module}`);
      } else {
        console.log('❌ Failed to fetch permission details:', permissionData.message);
      }
    }

  } catch (error) {
    console.error('❌ Error testing Roles API:', error);
  }
}

async function testDatabaseConnections() {
  console.log('🔍 Testing Database Connections...\n');

  try {
    // Test roles count
    const rolesCount = await prisma.role.count();
    console.log(`✅ Roles in database: ${rolesCount}`);

    // Test permissions count
    const permissionsCount = await prisma.permission.count();
    console.log(`✅ Permissions in database: ${permissionsCount}`);

    // Test role-permission relationships
    const rolePermissionsCount = await prisma.rolePermission.count();
    console.log(`✅ Role-Permission relationships: ${rolePermissionsCount}`);

    // Test users with roles
    const usersWithRoles = await prisma.user.count({
      where: {
        roleId: { not: null }
      }
    });
    console.log(`✅ Users with assigned roles: ${usersWithRoles}`);

    // Get sample data
    const sampleRole = await prisma.role.findFirst({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (sampleRole) {
      console.log(`\n📊 Sample Role Data:`);
      console.log(`   Name: ${sampleRole.name}`);
      console.log(`   Description: ${sampleRole.description}`);
      console.log(`   Is Global: ${sampleRole.isGlobal}`);
      console.log(`   Is Active: ${sampleRole.isActive}`);
      console.log(`   Assigned Users: ${sampleRole._count.users}`);
      console.log(`   Permissions: ${sampleRole.permissions.length}`);
    }

  } catch (error) {
    console.error('❌ Error testing database connections:', error);
  }
}

async function testComponentStructure() {
  console.log('🧩 Testing Component Structure...\n');

  const fs = require('fs');
  const path = require('path');

  const requiredComponents = [
    'src/components/superadmin/roles/RolesManagement.tsx',
    'src/components/superadmin/roles/PermissionGroups.tsx',
    'src/components/superadmin/roles/RoleAssignment.tsx',
    'src/components/superadmin/roles/CreateRoleModal.tsx',
    'src/components/superadmin/roles/EditRoleModal.tsx',
    'src/components/superadmin/roles/ViewRoleModal.tsx',
    'src/components/superadmin/roles/DeleteRoleModal.tsx',
    'src/components/superadmin/roles/RolesSkeleton.tsx'
  ];

  const requiredHooks = [
    'src/hooks/useRolesAPI.ts',
    'src/hooks/usePermissionsAPI.ts'
  ];

  const requiredAPIs = [
    'src/app/api/superadmin/roles/route.ts',
    'src/app/api/superadmin/roles/[id]/route.ts',
    'src/app/api/superadmin/permissions/route.ts',
    'src/app/api/superadmin/permissions/[id]/route.ts',
    'src/app/api/superadmin/users/[id]/role/route.ts'
  ];

  console.log('Checking Components:');
  requiredComponents.forEach(component => {
    if (fs.existsSync(component)) {
      console.log(`✅ ${component}`);
    } else {
      console.log(`❌ ${component} - Missing`);
    }
  });

  console.log('\nChecking Hooks:');
  requiredHooks.forEach(hook => {
    if (fs.existsSync(hook)) {
      console.log(`✅ ${hook}`);
    } else {
      console.log(`❌ ${hook} - Missing`);
    }
  });

  console.log('\nChecking API Endpoints:');
  requiredAPIs.forEach(api => {
    if (fs.existsSync(api)) {
      console.log(`✅ ${api}`);
    } else {
      console.log(`❌ ${api} - Missing`);
    }
  });
}

async function runTests() {
  console.log('🚀 Starting Roles & Permissions Module Tests\n');
  console.log('=' .repeat(60));

  await testComponentStructure();
  console.log('\n' + '=' .repeat(60));
  
  await testDatabaseConnections();
  console.log('\n' + '=' .repeat(60));
  
  await testRolesAPI();
  console.log('\n' + '=' .repeat(60));

  console.log('\n🎉 Testing completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to: http://localhost:3000/superadmin/roles');
  console.log('3. Test the UI components and functionality');
  console.log('4. Verify all CRUD operations work correctly');

  await prisma.$disconnect();
}

runTests()
  .then(() => {
    console.log('✅ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }); 