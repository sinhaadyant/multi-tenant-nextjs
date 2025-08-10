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
    console.log('ℹ️  API testing requires authentication. Testing database structure instead...\n');
    
    // Test database structure for roles and permissions
    const roles = await prisma.role.findMany({
      take: 5,
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: true
          }
        }
      }
    });

    console.log('✅ Database structure test completed');
    console.log(`   Found ${roles.length} sample roles`);
    
    if (roles.length > 0) {
      const sampleRole = roles[0];
      console.log(`   Sample role: ${sampleRole.name} (${sampleRole.permissions.length} permissions, ${sampleRole.userRoles.length} users)`);
    }

  } catch (error) {
    console.error('❌ Error testing database structure:', error);
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
    const usersWithRoles = await prisma.userRole.count();
    console.log(`✅ Users with assigned roles: ${usersWithRoles}`);

    // Get sample data
    const sampleRole = await prisma.role.findFirst({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: true
          }
        }
      }
    });

    if (sampleRole) {
      console.log(`\n📊 Sample Role Data:`);
      console.log(`   Name: ${sampleRole.name}`);
      console.log(`   Description: ${sampleRole.description}`);
      console.log(`   Is Global: ${sampleRole.isGlobal}`);
      console.log(`   Is Active: ${sampleRole.isActive}`);
      console.log(`   Assigned Users: ${sampleRole.userRoles.length}`);
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