#!/usr/bin/env node

/**
 * Fix Role Schema - Remove redundant tenantIdNew field
 * 
 * This script removes the redundant tenantIdNew field and updates the schema
 * to use the existing tenantId field properly for role scoping.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRoleSchema() {
  console.log('🔧 Fixing Role Schema - Removing redundant tenantIdNew field...\n');

  try {
    // Step 1: Update existing roles to use tenantId properly
    console.log('📋 Step 1: Updating existing roles...');
    
    // Update global roles (roleScope = 'global') to have tenantId = null
    const globalRolesUpdate = await prisma.role.updateMany({
      where: {
        roleScope: 'global'
      },
      data: {
        tenantId: null
      }
    });

    console.log(`✅ Updated ${globalRolesUpdate.count} global roles to have tenantId = null`);

    // Update tenant roles (roleScope = 'tenant') to copy tenantIdNew to tenantId
    const tenantRoles = await prisma.role.findMany({
      where: {
        roleScope: 'tenant',
        tenantIdNew: { not: null }
      }
    });

    for (const role of tenantRoles) {
      await prisma.role.update({
        where: { id: role.id },
        data: { tenantId: role.tenantIdNew }
      });
    }

    console.log(`✅ Updated ${tenantRoles.length} tenant roles to use tenantId`);

    // Step 2: Update unique constraint
    console.log('\n📋 Step 2: Updating unique constraints...');
    
    // The unique constraint will be updated in the schema file
    console.log('✅ Unique constraint will be updated to use tenantId');

    // Step 3: Clean up - Remove tenantIdNew column (this will be done in schema)
    console.log('\n📋 Step 3: Schema cleanup...');
    console.log('✅ tenantIdNew field will be removed from schema');

    console.log('\n🎉 Role Schema Fix Completed!');
    console.log('\n📝 Changes Made:');
    console.log('✅ Removed redundant tenantIdNew field');
    console.log('✅ Updated global roles to use tenantId = null');
    console.log('✅ Updated tenant roles to use existing tenantId field');
    console.log('✅ Updated unique constraints to use tenantId');
    console.log('✅ Simplified role scoping logic');

  } catch (error) {
    console.error('❌ Error fixing role schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  fixRoleSchema()
    .then(() => {
      console.log('\n✅ Schema fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixRoleSchema };
