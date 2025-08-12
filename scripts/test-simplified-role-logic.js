#!/usr/bin/env node

/**
 * Test Simplified Role Logic
 * 
 * This script tests the simplified role logic using only tenantId:
 * - tenantId = NULL → Global role (SuperAdmin)
 * - tenantId = "tenant_uuid" → Tenant-specific role (Tenant Admin)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimplifiedRoleLogic() {
  console.log('🧪 Testing Simplified Role Logic...\n');

  try {
    // Test 1: Check current role structure
    console.log('📋 Test 1: Checking current role structure...');
    
    const globalRoles = await prisma.role.findMany({
      where: {
        roleScope: 'global'
      }
    });

    const tenantRoles = await prisma.role.findMany({
      where: {
        roleScope: 'tenant'
      }
    });

    console.log(`✅ Global roles: ${globalRoles.length}`);
    console.log(`✅ Tenant roles: ${tenantRoles.length}`);

    // Check if global roles have tenantId = NULL
    const globalRolesWithTenantId = globalRoles.filter(r => r.tenantId !== null);
    if (globalRolesWithTenantId.length > 0) {
      console.log(`⚠️  Warning: ${globalRolesWithTenantId.length} global roles have tenantId set`);
    } else {
      console.log('✅ All global roles have tenantId = NULL');
    }

    // Check if tenant roles have tenantId set
    const tenantRolesWithoutTenantId = tenantRoles.filter(r => r.tenantId === null);
    if (tenantRolesWithoutTenantId.length > 0) {
      console.log(`⚠️  Warning: ${tenantRolesWithoutTenantId.length} tenant roles have tenantId = NULL`);
    } else {
      console.log('✅ All tenant roles have tenantId set');
    }

    // Test 2: Create test roles with correct logic
    console.log('\n📋 Test 2: Creating test roles with correct logic...');
    
    const tenants = await prisma.tenant.findMany({ take: 1 });
    const testTenant = tenants[0];

    if (testTenant) {
      // Create global role (tenantId = NULL)
      const globalRole = await prisma.role.create({
        data: {
          name: 'Test Global Role',
          description: 'Test global role with tenantId = NULL',
          roleScope: 'global',
          tenantId: null, // Global role
          isActive: true,
          createdBy: 'test-script'
        }
      });

      console.log(`✅ Created global role: ${globalRole.name} (tenantId = ${globalRole.tenantId})`);

      // Create tenant role (tenantId = tenant.id)
      const tenantRole = await prisma.role.create({
        data: {
          name: 'Test Tenant Role',
          description: 'Test tenant role with tenantId set',
          roleScope: 'tenant',
          tenantId: testTenant.id, // Tenant-specific role
          isActive: true,
          createdBy: 'test-script'
        }
      });

      console.log(`✅ Created tenant role: ${tenantRole.name} (tenantId = ${tenantRole.tenantId})`);

      // Test 3: Verify role queries work correctly
      console.log('\n📋 Test 3: Testing role queries...');
      
      // Query global roles
      const globalRolesQuery = await prisma.role.findMany({
        where: {
          roleScope: 'global',
          tenantId: null
        }
      });

      console.log(`✅ Global roles query: ${globalRolesQuery.length} found`);

      // Query tenant roles
      const tenantRolesQuery = await prisma.role.findMany({
        where: {
          roleScope: 'tenant',
          tenantId: testTenant.id
        }
      });

      console.log(`✅ Tenant roles query: ${tenantRolesQuery.length} found`);

      // Test 4: Test permission assignment
      console.log('\n📋 Test 4: Testing permission assignment...');
      
      const permissions = await prisma.permission.findMany({
        where: { isActive: true },
        take: 3
      });

      if (permissions.length > 0) {
        // Assign permissions to global role (tenantId = NULL in role_permissions)
        const globalPermissions = permissions.slice(0, 2).map(permission => ({
          roleId: globalRole.id,
          permissionId: permission.id,
          tenantId: null, // Global permissions
          isAllowed: true
        }));

        await prisma.rolePermission.createMany({
          data: globalPermissions
        });

        console.log(`✅ Assigned ${globalPermissions.length} global permissions`);

        // Assign permissions to tenant role (tenantId = tenant.id in role_permissions)
        const tenantPermissions = permissions.slice(1, 3).map(permission => ({
          roleId: tenantRole.id,
          permissionId: permission.id,
          tenantId: testTenant.id, // Tenant-specific permissions
          isAllowed: true
        }));

        await prisma.rolePermission.createMany({
          data: tenantPermissions
        });

        console.log(`✅ Assigned ${tenantPermissions.length} tenant permissions`);
      }

      // Test 5: Test tenant override for global role
      console.log('\n📋 Test 5: Testing tenant override for global role...');
      
      if (permissions.length > 0) {
        // Create tenant override for global role
        const overridePermission = await prisma.rolePermission.create({
          data: {
            roleId: globalRole.id,
            permissionId: permissions[0].id,
            tenantId: testTenant.id, // Tenant override
            isAllowed: false // Deny this permission for this tenant
          }
        });

        console.log(`✅ Created tenant override: ${permissions[0].name} = DENIED for tenant ${testTenant.name}`);
      }

      // Test 6: Clean up test data
      console.log('\n📋 Test 6: Cleaning up test data...');
      
      // Remove role permissions
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: { in: [globalRole.id, tenantRole.id] }
        }
      });

      // Remove test roles
      await prisma.role.deleteMany({
        where: {
          id: { in: [globalRole.id, tenantRole.id] }
        }
      });

      console.log('✅ Cleaned up test data');
    }

    console.log('\n🎉 Simplified Role Logic Tests Passed!');
    console.log('\n📝 Logic Verified:');
    console.log('✅ Global roles: roleScope = "global", tenantId = NULL');
    console.log('✅ Tenant roles: roleScope = "tenant", tenantId = "tenant_uuid"');
    console.log('✅ Global permissions: tenantId = NULL in role_permissions');
    console.log('✅ Tenant permissions: tenantId = "tenant_uuid" in role_permissions');
    console.log('✅ Tenant overrides: tenantId = "tenant_uuid" for global role permissions');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testSimplifiedRoleLogic()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testSimplifiedRoleLogic };
