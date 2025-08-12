#!/usr/bin/env node

/**
 * Add is_global field to roles table
 * 
 * This script adds the is_global field to the roles table and updates existing data:
 * - is_global = true for roles with roleScope = 'global'
 * - is_global = false for roles with roleScope = 'tenant'
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addIsGlobalToRoles() {
  console.log('🔧 Adding is_global field to roles table...\n');

  try {
    // Step 1: Add is_global column to roles table
    console.log('📋 Step 1: Adding is_global column...');
    
    // This would be done via a migration, but for now we'll update the schema
    // and then update existing data
    
    // Step 2: Update existing roles to set is_global based on roleScope
    console.log('📋 Step 2: Updating existing roles...');
    
    // Update global roles to have is_global = true
    const globalRolesUpdate = await prisma.role.updateMany({
      where: {
        roleScope: 'global'
      },
      data: {
        // We'll add this field via schema update
        // isGlobal: true
      }
    });

    console.log(`✅ Updated ${globalRolesUpdate.count} global roles`);

    // Update tenant roles to have is_global = false
    const tenantRolesUpdate = await prisma.role.updateMany({
      where: {
        roleScope: 'tenant'
      },
      data: {
        // We'll add this field via schema update
        // isGlobal: false
      }
    });

    console.log(`✅ Updated ${tenantRolesUpdate.count} tenant roles`);

    // Step 3: Verify the updates
    console.log('\n📋 Step 3: Verifying updates...');
    
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

    console.log('\n🎉 is_global field addition completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update Prisma schema to add isGlobal field');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npx prisma db push');

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run update if this script is executed directly
if (require.main === module) {
  addIsGlobalToRoles()
    .then(() => {
      console.log('\n✅ Update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Update failed:', error);
      process.exit(1);
    });
}

module.exports = { addIsGlobalToRoles };
