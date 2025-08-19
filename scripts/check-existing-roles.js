const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingRoles() {
  try {
    console.log('🔍 Checking existing roles...');

    const roles = await prisma.role.findMany({
      include: {
        permissions: true
      }
    });

    console.log(`Found ${roles.length} roles:`);
    
    for (const role of roles) {
      console.log(`\n📋 Role: ${role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Description: ${role.description}`);
      console.log(`   Is Global: ${role.isGlobal}`);
      console.log(`   Is Template: ${role.isTemplate}`);
      console.log(`   Is Default: ${role.isDefault}`);
      console.log(`   Tenant ID: ${role.tenantId}`);
      console.log(`   Permissions: ${role.permissions.length}`);
      
      if (role.permissions.length > 0) {
        console.log('   Module Permissions:');
        for (const perm of role.permissions) {
          console.log(`     - ${perm.moduleKey}: create=${perm.canCreate}, read=${perm.canRead}, update=${perm.canUpdate}, delete=${perm.canDelete}, viewAll=${perm.canViewAll}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingRoles();
