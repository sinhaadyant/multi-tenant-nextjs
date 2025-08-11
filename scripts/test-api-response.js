const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testApiResponse() {
  try {
    console.log('🔍 Testing API Response...\n');

    // Get a user to test with
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@techcorp.com'
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        module: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            isActive: true,
          }
        }
      }
    });

    if (!user) {
      console.log('❌ No user found');
      return;
    }

    console.log('👤 Found user:', user.name, `(${user.email})`);
    console.log('🏢 Tenant:', user.tenant.name, `(${user.tenant.slug})`);
    console.log('📋 UserRoles count:', user.userRoles.length);

    // Format the response like the API does
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      tenant: user.tenant,
      roles: user.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        isDefault: userRole.role.isDefault,
        permissions: userRole.role.permissions.map(rolePermission => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          description: rolePermission.permission.description,
          module: rolePermission.permission.module.moduleKey,
          action: rolePermission.permission.action
        }))
      })),
      permissions: user.userRoles.flatMap(userRole => 
        userRole.role.permissions.map(rolePermission => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          description: rolePermission.permission.description,
          module: rolePermission.permission.module.moduleKey,
          action: rolePermission.permission.action
        }))
      )
    };

    console.log('\n📊 Formatted Response:');
    console.log('- User ID:', userProfile.id);
    console.log('- User Name:', userProfile.name);
    console.log('- User Email:', userProfile.email);
    console.log('- Roles count:', userProfile.roles.length);
    console.log('- Roles:', userProfile.roles.map(r => r.name));
    console.log('- Permissions count:', userProfile.permissions.length);

    console.log('\n🎯 Role Details:');
    userProfile.roles.forEach((role, index) => {
      console.log(`  ${index + 1}. ${role.name} (${role.permissions.length} permissions)`);
    });

    console.log('\n✅ API response simulation complete');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse(); 