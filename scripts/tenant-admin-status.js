const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showTenantAdminStatus() {
  try {
    console.log('🔍 Tenant Admin Permissions Status\n');

    // Get all available permissions
    const allPermissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ moduleKey: 'asc' }, { action: 'asc' }]
    });

    // Remove duplicates based on moduleKey:action combination
    const uniquePermissions = [];
    const seen = new Set();
    for (const permission of allPermissions) {
      const key = `${permission.moduleKey}:${permission.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePermissions.push(permission);
      }
    }

    // Get all tenants with admin users
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: {
            isActive: true,
            userRoles: {
              some: {
                role: {
                  name: {
                    contains: 'Admin'
                  }
                }
              }
            }
          },
          include: {
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

    console.log(`📊 System Overview:`);
    console.log(`   Total Tenants: ${tenants.length}`);
    console.log(`   Total Permissions: ${uniquePermissions.length} (${allPermissions.length} total including duplicates)`);
    console.log(`   Total Admin Users: ${tenants.reduce((sum, t) => sum + t.users.length, 0)}\n`);

    for (const tenant of tenants) {
      console.log(`🏢 ${tenant.name} (${tenant.slug})`);
      
      for (const user of tenant.users) {
        const userPermissions = new Set();
        const roles = [];

        for (const userRole of user.userRoles) {
          roles.push(userRole.role.name);
          for (const rp of userRole.role.permissions) {
            userPermissions.add(`${rp.permission.moduleKey}:${rp.permission.action}`);
          }
        }

        const permissionCount = userPermissions.size;
        const totalPermissions = uniquePermissions.length;
        const percentage = ((permissionCount / totalPermissions) * 100).toFixed(1);

        console.log(`   👤 ${user.name} (${user.email})`);
        console.log(`      Roles: ${roles.join(', ')}`);
        console.log(`      Permissions: ${permissionCount}/${totalPermissions} (${percentage}%)`);
        
        if (permissionCount === totalPermissions) {
          console.log(`      Status: ✅ FULL ACCESS`);
        } else {
          console.log(`      Status: ⚠️  PARTIAL ACCESS`);
        }
        console.log('');
      }
    }

    // Show permission breakdown
    console.log('📋 Permission Categories:');
    const permissionsByModule = {};
    uniquePermissions.forEach(perm => {
      if (!permissionsByModule[perm.moduleKey]) {
        permissionsByModule[perm.moduleKey] = [];
      }
      permissionsByModule[perm.moduleKey].push(perm.action);
    });

    Object.entries(permissionsByModule).forEach(([module, actions]) => {
      console.log(`   ${module}: ${actions.join(', ')}`);
    });

  } catch (error) {
    console.error('Error checking tenant admin status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showTenantAdminStatus(); 