const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPermissions() {
  try {
    console.log('🔍 Checking user permissions...\n');

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${tenants.length} active tenants\n`);

    for (const tenant of tenants) {
      console.log(`📋 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   Users: ${tenant.users.length}\n`);

      for (const user of tenant.users) {
        console.log(`   👤 User: ${user.name} (${user.email})`);
        console.log(`      Active: ${user.isActive}`);
        console.log(`      Roles: ${user.userRoles.length}`);

        if (user.userRoles.length === 0) {
          console.log(`      ⚠️  WARNING: User has no roles assigned!`);
        }

        for (const userRole of user.userRoles) {
          const role = userRole.role;
          console.log(`      📝 Role: ${role.name} (${role.permissions.length} permissions)`);
          
          const permissions = role.permissions.map(rp => rp.permission);
          const userPermissions = permissions.map(p => `${p.moduleKey}:${p.action}`);
          
          console.log(`         Permissions: ${userPermissions.join(', ')}`);
          
          // Check for users:view permission
          const hasUsersView = userPermissions.includes('users:view');
          console.log(`         Has users:view: ${hasUsersView ? '✅' : '❌'}`);
        }
        console.log('');
      }
    }

    // Check if there are any default roles
    const defaultRoles = await prisma.role.findMany({
      where: { isDefault: true },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log('🔧 Default Roles:');
    for (const role of defaultRoles) {
      console.log(`   ${role.name} (${role.permissions.length} permissions)`);
      const permissions = role.permissions.map(rp => rp.permission);
      const permissionStrings = permissions.map(p => `${p.moduleKey}:${p.action}`);
      console.log(`   Permissions: ${permissionStrings.join(', ')}\n`);
    }

    // Check available permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: [
        { moduleKey: 'asc' },
        { action: 'asc' }
      ]
    });

    console.log('📋 Available Permissions:');
    const permissionsByModule = {};
    for (const permission of allPermissions) {
      if (!permissionsByModule[permission.moduleKey]) {
        permissionsByModule[permission.moduleKey] = [];
      }
      permissionsByModule[permission.moduleKey].push(permission.action);
    }

    for (const [module, actions] of Object.entries(permissionsByModule)) {
      console.log(`   ${module}: ${actions.join(', ')}`);
    }

  } catch (error) {
    console.error('Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixUserPermissions() {
  try {
    console.log('🔧 Fixing user permissions...\n');

    // Get all users without roles
    const usersWithoutRoles = await prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: {
          none: {}
        }
      },
      include: {
        tenant: true
      }
    });

    console.log(`Found ${usersWithoutRoles.length} users without roles\n`);

    for (const user of usersWithoutRoles) {
      console.log(`Fixing permissions for ${user.name} (${user.email}) in ${user.tenant.name}`);

      // Find or create a default role for this tenant
      let defaultRole = await prisma.role.findFirst({
        where: {
          tenantId: user.tenant.id,
          isDefault: true
        }
      });

      if (!defaultRole) {
        console.log(`   Creating default role for ${user.tenant.name}`);
        
        // Create a default role with basic permissions
        defaultRole = await prisma.role.create({
          data: {
            name: 'User',
            description: 'Default user role with basic permissions',
            isDefault: true,
            tenantId: user.tenant.id,
            permissions: {
              create: [
                { permissionId: 'dashboard:view' },
                { permissionId: 'users:view' },
                { permissionId: 'profile:view' },
                { permissionId: 'profile:update' }
              ]
            }
          }
        });
      }

      // Assign the role to the user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id
        }
      });

      console.log(`   ✅ Assigned role: ${defaultRole.name}`);
    }

    console.log('\n✅ Permission fix completed!');

  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const command = process.argv[2];

if (command === 'fix') {
  fixUserPermissions();
} else {
  checkUserPermissions();
} 