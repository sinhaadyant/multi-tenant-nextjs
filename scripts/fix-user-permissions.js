const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserPermissions() {
  try {
    console.log('🔧 Fixing user permissions...\n');

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        roles: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    for (const tenant of tenants) {
      console.log(`📋 Processing tenant: ${tenant.name} (${tenant.slug})`);

      // Find the users:view permission
      const usersViewPermission = await prisma.permission.findFirst({
        where: {
          moduleKey: 'users',
          action: 'view'
        }
      });

      if (!usersViewPermission) {
        console.log(`   ❌ users:view permission not found in database`);
        continue;
      }

      // Find roles that should have users:view permission
      const rolesToUpdate = ['User', 'Viewer'];
      
      for (const roleName of rolesToUpdate) {
        const role = tenant.roles.find(r => r.name === roleName);
        
        if (!role) {
          console.log(`   ⚠️  Role '${roleName}' not found for tenant ${tenant.name}`);
          continue;
        }

        // Check if role already has users:view permission
        const hasUsersView = role.permissions.some(rp => 
          rp.permission.moduleKey === 'users' && rp.permission.action === 'view'
        );

        if (hasUsersView) {
          console.log(`   ✅ Role '${roleName}' already has users:view permission`);
          continue;
        }

        // Add users:view permission to the role
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: usersViewPermission.id
          }
        });

        console.log(`   ✅ Added users:view permission to role '${roleName}'`);
      }
    }

    console.log('\n✅ Permission fix completed!');

  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixUserPermissions(); 