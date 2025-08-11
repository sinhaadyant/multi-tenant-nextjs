const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateRoles() {
  try {
    console.log('🧹 Cleaning up duplicate roles...\n');

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    for (const tenant of tenants) {
      console.log(`📋 Processing tenant: ${tenant.name} (${tenant.slug})`);

      for (const user of tenant.users) {
        console.log(`   👤 User: ${user.name} (${user.email})`);
        console.log(`      Current roles: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);

        if (user.userRoles.length > 1) {
          console.log(`      ⚠️  User has ${user.userRoles.length} roles - cleaning up...`);

          // Determine which role to keep based on priority
          let roleToKeep = null;
          
          // Priority order: Admin > Tenant Admin > Manager > User > Viewer
          const rolePriority = ['Admin', 'Tenant Admin', 'Manager', 'User', 'Viewer'];
          
          for (const priorityRole of rolePriority) {
            const foundRole = user.userRoles.find(ur => ur.role.name === priorityRole);
            if (foundRole) {
              roleToKeep = foundRole;
              break;
            }
          }

          if (roleToKeep) {
            console.log(`      ✅ Keeping role: ${roleToKeep.role.name}`);

            // Remove all other roles
            const rolesToRemove = user.userRoles.filter(ur => ur.id !== roleToKeep.id);
            
            for (const roleToRemove of rolesToRemove) {
              await prisma.userRole.delete({
                where: { id: roleToRemove.id }
              });
              console.log(`      🗑️  Removed role: ${roleToRemove.role.name}`);
            }
          } else {
            console.log(`      ❌ No valid role found to keep`);
          }
        } else {
          console.log(`      ✅ User has only 1 role`);
        }
      }
    }

    console.log('\n✅ Role cleanup completed!');

  } catch (error) {
    console.error('Error cleaning up roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyRoleCleanup() {
  try {
    console.log('\n🔍 Verifying role cleanup...\n');

    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    for (const tenant of tenants) {
      console.log(`📋 Tenant: ${tenant.name} (${tenant.slug})`);

      for (const user of tenant.users) {
        const roleCount = user.userRoles.length;
        const roles = user.userRoles.map(ur => ur.role.name).join(', ');
        
        if (roleCount === 1) {
          console.log(`   ✅ ${user.name}: ${roles}`);
        } else if (roleCount === 0) {
          console.log(`   ❌ ${user.name}: No roles assigned`);
        } else {
          console.log(`   ⚠️  ${user.name}: ${roleCount} roles (${roles})`);
        }
      }
    }

  } catch (error) {
    console.error('Error verifying roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const command = process.argv[2];

if (command === 'verify') {
  verifyRoleCleanup();
} else {
  cleanupDuplicateRoles();
} 