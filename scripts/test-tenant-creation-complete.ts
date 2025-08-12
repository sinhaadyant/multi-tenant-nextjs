import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTenantCreationComplete() {
  console.log('🧪 Testing Complete Tenant Creation Process...\n');

  try {
    // Test 1: Check if there are any existing tenants
    const existingTenants = await prisma.tenant.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 Existing Tenants:');
    console.log(`Total tenants found: ${existingTenants.length}\n`);

    if (existingTenants.length > 0) {
      const latestTenant = existingTenants[0];
      console.log(`Latest Tenant: ${latestTenant.name} (${latestTenant.slug})`);
      console.log(`Created: ${latestTenant.createdAt.toISOString()}\n`);

      // Test 2: Check roles for the latest tenant
      const tenantRoles = await prisma.role.findMany({
        where: { tenantId: latestTenant.id },
        select: {
          id: true,
          name: true,
          description: true,
          isDefault: true,
          priority: true,
          color: true
        },
        orderBy: { priority: 'asc' }
      });

      console.log(`👥 Roles for Tenant "${latestTenant.name}":`);
      console.log(`Total roles found: ${tenantRoles.length}\n`);

      if (tenantRoles.length > 0) {
        tenantRoles.forEach((role, index) => {
          console.log(`Role ${index + 1}:`);
          console.log(`  ID: ${role.id}`);
          console.log(`  Name: ${role.name}`);
          console.log(`  Description: ${role.description || 'N/A'}`);
          console.log(`  Default: ${role.isDefault}`);
          console.log(`  Priority: ${role.priority}`);
          console.log(`  Color: ${role.color}`);
          console.log('');
        });
      }

      // Test 3: Check permissions for Admin role
      const adminRole = tenantRoles.find(r => r.name === 'Admin');
      if (adminRole) {
        const adminPermissions = await prisma.rolePermission.findMany({
          where: { roleId: adminRole.id },
          include: {
            permission: {
              select: {
                name: true,
                action: true,
                moduleKey: true,
                description: true
              }
            }
          }
        });

        console.log(`🔐 Permissions for Admin Role:`);
        console.log(`Total permissions: ${adminPermissions.length}\n`);

        if (adminPermissions.length > 0) {
          adminPermissions.slice(0, 10).forEach((rp, index) => {
            console.log(`Permission ${index + 1}:`);
            console.log(`  Name: ${rp.permission.name}`);
            console.log(`  Action: ${rp.permission.action}`);
            console.log(`  Module: ${rp.permission.moduleKey}`);
            console.log(`  Description: ${rp.permission.description || 'N/A'}`);
            console.log('');
          });

          if (adminPermissions.length > 10) {
            console.log(`... and ${adminPermissions.length - 10} more permissions\n`);
          }
        }
      }

      // Test 4: Check tenant modules
      const tenantModules = await prisma.tenantModule.findMany({
        where: { tenantId: latestTenant.id },
        include: {
          module: {
            select: {
              moduleKey: true,
              moduleName: true,
              description: true
            }
          }
        },
        orderBy: { module: { orderIndex: 'asc' } }
      });

      console.log(`📦 Modules for Tenant "${latestTenant.name}":`);
      console.log(`Total modules enabled: ${tenantModules.length}\n`);

      if (tenantModules.length > 0) {
        tenantModules.forEach((tm, index) => {
          console.log(`Module ${index + 1}:`);
          console.log(`  Key: ${tm.module.moduleKey}`);
          console.log(`  Name: ${tm.module.moduleName}`);
          console.log(`  Description: ${tm.module.description || 'N/A'}`);
          console.log(`  Enabled: ${tm.isEnabled}`);
          console.log(`  Visible: ${tm.isVisible}`);
          console.log('');
        });
      }

      // Test 5: Check admin user and role assignment
      const adminUser = await prisma.user.findFirst({
        where: { tenantId: latestTenant.id },
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      });

      if (adminUser) {
        console.log(`👤 Admin User for Tenant "${latestTenant.name}":`);
        console.log(`  ID: ${adminUser.id}`);
        console.log(`  Name: ${adminUser.name}`);
        console.log(`  Email: ${adminUser.email}`);
        console.log(`  Active: ${adminUser.isActive}`);
        console.log(`  Roles: ${adminUser.userRoles.map(ur => ur.role.name).join(', ')}`);
        console.log('');
      }

      // Test 6: Check database counts
      console.log('🗄️ Database Summary:');
      
      const tenantCount = await prisma.tenant.count();
      const roleCount = await prisma.role.count();
      const userCount = await prisma.user.count();
      const userRoleCount = await prisma.userRole.count();
      const rolePermissionCount = await prisma.rolePermission.count();
      const tenantModuleCount = await prisma.tenantModule.count();
      
      console.log(`Tenants: ${tenantCount}`);
      console.log(`Roles: ${roleCount}`);
      console.log(`Users: ${userCount}`);
      console.log(`User-Role Assignments: ${userRoleCount}`);
      console.log(`Role-Permission Assignments: ${rolePermissionCount}`);
      console.log(`Tenant-Module Assignments: ${tenantModuleCount}\n`);

    } else {
      console.log('⚠️  No tenants found. Run tenant creation to test the complete process.\n');
    }

    console.log('✅ Complete Tenant Creation test completed!');

  } catch (error) {
    console.error('❌ Error testing complete tenant creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTenantCreationComplete();
