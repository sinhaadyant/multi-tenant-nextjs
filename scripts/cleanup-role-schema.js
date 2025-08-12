#!/usr/bin/env node

/**
 * Cleanup Role Schema
 * 
 * This script removes the redundant tenantIdNew field and simplifies the role schema
 * to use only tenantId with clear logic:
 * - tenantId = NULL → Global role (SuperAdmin)
 * - tenantId = "tenant_uuid" → Tenant-specific role (Tenant Admin)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupRoleSchema() {
  console.log('🧹 Cleaning up Role Schema...\n');

  try {
    // Step 1: Update existing roles to use tenantId properly
    console.log('📋 Step 1: Updating existing roles...');
    
    // Update global roles (roleScope = 'global') to have tenantId = NULL
    const globalRolesUpdate = await prisma.role.updateMany({
      where: {
        roleScope: 'global'
      },
      data: {
        tenantId: null
      }
    });

    console.log(`✅ Updated ${globalRolesUpdate.count} global roles to have tenantId = NULL`);

    // Update tenant roles (roleScope = 'tenant') to use tenantIdNew as tenantId
    const tenantRoles = await prisma.role.findMany({
      where: {
        roleScope: 'tenant',
        tenantIdNew: { not: null }
      }
    });

    for (const role of tenantRoles) {
      await prisma.role.update({
        where: { id: role.id },
        data: {
          tenantId: role.tenantIdNew
        }
      });
    }

    console.log(`✅ Updated ${tenantRoles.length} tenant roles to use proper tenantId`);

    // Step 2: Update role permissions to use tenantId properly
    console.log('\n📋 Step 2: Updating role permissions...');
    
    // Update global role permissions (tenantId = NULL) to use role's tenantId
    const globalRolePermissions = await prisma.rolePermission.findMany({
      where: {
        tenantId: null
      },
      include: {
        role: true
      }
    });

    for (const rp of globalRolePermissions) {
      // If role is global, keep tenantId = NULL
      // If role is tenant-specific, set tenantId = role.tenantId
      if (rp.role.roleScope === 'tenant' && rp.role.tenantId) {
        await prisma.rolePermission.update({
          where: { id: rp.id },
          data: {
            tenantId: rp.role.tenantId
          }
        });
      }
    }

    console.log(`✅ Updated ${globalRolePermissions.length} role permissions`);

    // Step 3: Verify the cleanup
    console.log('\n📋 Step 3: Verifying cleanup...');
    
    const globalRoles = await prisma.role.findMany({
      where: {
        roleScope: 'global'
      }
    });

    const tenantRolesAfter = await prisma.role.findMany({
      where: {
        roleScope: 'tenant'
      }
    });

    console.log(`✅ Global roles: ${globalRoles.length} (all should have tenantId = NULL)`);
    console.log(`✅ Tenant roles: ${tenantRolesAfter.length} (all should have tenantId set)`);

    // Verify global roles have tenantId = NULL
    const globalRolesWithTenantId = globalRoles.filter(r => r.tenantId !== null);
    if (globalRolesWithTenantId.length > 0) {
      console.log(`⚠️  Warning: ${globalRolesWithTenantId.length} global roles still have tenantId set`);
    } else {
      console.log('✅ All global roles have tenantId = NULL');
    }

    // Verify tenant roles have tenantId set
    const tenantRolesWithoutTenantId = tenantRolesAfter.filter(r => r.tenantId === null);
    if (tenantRolesWithoutTenantId.length > 0) {
      console.log(`⚠️  Warning: ${tenantRolesWithoutTenantId.length} tenant roles have tenantId = NULL`);
    } else {
      console.log('✅ All tenant roles have tenantId set');
    }

    console.log('\n🎉 Role Schema Cleanup Completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update Prisma schema to remove tenantIdNew field');
    console.log('2. Update API code to use only tenantId');
    console.log('3. Run: npx prisma generate');
    console.log('4. Run: npx prisma db push');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupRoleSchema()
    .then(() => {
      console.log('\n✅ Cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupRoleSchema };
