import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRoleSystem() {
  console.log('🧪 Testing Role Management System...\n');

  try {
    // Test 1: Check roles with scope
    console.log('1. Checking roles with scope...');
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      }
    });

    console.log(`   Found ${roles.length} total roles`);
    
    const globalRoles = roles.filter(r => r.scope === 'GLOBAL');
    const tenantRoles = roles.filter(r => r.scope === 'TENANT');
    
    console.log(`   - Global roles: ${globalRoles.length}`);
    console.log(`   - Tenant roles: ${tenantRoles.length}`);

    // Display global roles
    console.log('\n   Global Roles:');
    globalRoles.forEach(role => {
      console.log(`     - ${role.name} (${role.permissions.length} permissions, ${role._count.userRoles} users)`);
    });

    // Display tenant roles
    console.log('\n   Tenant Roles:');
    tenantRoles.forEach(role => {
      console.log(`     - ${role.name} (${role.permissions.length} permissions, ${role._count.userRoles} users)`);
    });

    // Test 2: Check tenant role overrides table
    console.log('\n2. Checking tenant role overrides...');
    const overrides = await prisma.tenantRoleOverride.findMany({
      include: {
        role: true,
        tenant: true,
        permission: true
      }
    });

    console.log(`   Found ${overrides.length} role overrides`);
    if (overrides.length > 0) {
      overrides.forEach(override => {
        console.log(`     - ${override.tenant.name}: ${override.role.name} -> ${override.permission.name} (${override.isGranted ? 'granted' : 'denied'})`);
      });
    }

    // Test 3: Check user role assignments
    console.log('\n3. Checking user role assignments...');
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: true,
        role: true
      }
    });

    console.log(`   Found ${userRoles.length} user role assignments`);
    
    // Group by user
    const userRoleMap = new Map();
    userRoles.forEach(ur => {
      if (!userRoleMap.has(ur.user.email)) {
        userRoleMap.set(ur.user.email, []);
      }
      userRoleMap.get(ur.user.email).push(ur.role.name);
    });

    userRoleMap.forEach((roles, email) => {
      console.log(`     - ${email}: ${roles.join(', ')}`);
    });

    // Test 4: Check permissions
    console.log('\n4. Checking permissions...');
    const permissions = await prisma.permission.findMany({
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`   Found ${permissions.length} permissions`);
    
    // Show permissions by module
    const modulePermissions = new Map();
    permissions.forEach(permission => {
      if (!modulePermissions.has(permission.moduleKey)) {
        modulePermissions.set(permission.moduleKey, []);
      }
      modulePermissions.get(permission.moduleKey).push(permission.name);
    });

    modulePermissions.forEach((perms, module) => {
      console.log(`     - ${module}: ${perms.length} permissions`);
    });

    // Test 5: Test permission resolution for a specific user
    console.log('\n5. Testing permission resolution...');
    const testUser = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {}
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
                },
                tenantOverrides: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (testUser) {
      console.log(`   Testing permissions for user: ${testUser.email}`);
      
      const userPermissions = new Set();
      testUser.userRoles.forEach(userRole => {
        const role = userRole.role;
        
        // Get base permissions
        role.permissions.forEach(rp => {
          userPermissions.add(rp.permission.name);
        });

        // Apply overrides if global role
        if (role.scope === 'GLOBAL' && role.tenantOverrides.length > 0) {
          const overrideMap = new Map();
          role.tenantOverrides.forEach(override => {
            overrideMap.set(override.permissionId, override.isGranted);
          });

          role.permissions.forEach(rp => {
            if (overrideMap.has(rp.permissionId) && !overrideMap.get(rp.permissionId)) {
              userPermissions.delete(rp.permission.name);
            }
          });
        }
      });

      console.log(`   User has ${userPermissions.size} effective permissions`);
      console.log(`   Permissions: ${Array.from(userPermissions).join(', ')}`);
    }

    console.log('\n✅ Role Management System Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total Roles: ${roles.length}`);
    console.log(`   - Global Roles: ${globalRoles.length}`);
    console.log(`   - Tenant Roles: ${tenantRoles.length}`);
    console.log(`   - Role Overrides: ${overrides.length}`);
    console.log(`   - User Assignments: ${userRoles.length}`);
    console.log(`   - Permissions: ${permissions.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRoleSystem()
    .then(() => {
      console.log('\n🎉 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testRoleSystem };
