import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedModulePermissions() {
  console.log('🌱 Seeding Module Management Permissions...\n');

  try {
    // Create module management permissions
    const modulePermissions = [
      {
        name: 'modules.view',
        description: 'Can view the list of available modules and their current enablement status for the tenant',
        moduleKey: 'modules',
        action: 'view',
        category: 'Module Management',
        isSystem: true
      },
      {
        name: 'modules.enable_disable',
        description: 'Can enable or disable modules for the tenant',
        moduleKey: 'modules',
        action: 'enable_disable',
        category: 'Module Management',
        isSystem: true
      },
      {
        name: 'modules.manage_versions',
        description: 'Can update, rollback, or configure module versions',
        moduleKey: 'modules',
        action: 'manage_versions',
        category: 'Module Management',
        isSystem: true
      },
      {
        name: 'modules.view_analytics',
        description: 'Can view usage reports and analytics related to modules',
        moduleKey: 'modules',
        action: 'view_analytics',
        category: 'Module Management',
        isSystem: true
      }
    ];

    console.log('📝 Creating module management permissions...');
    
    for (const permission of modulePermissions) {
      const existingPermission = await prisma.permission.findUnique({
        where: { name: permission.name }
      });

      if (!existingPermission) {
        await prisma.permission.create({
          data: permission
        });
        console.log(`   ✅ Created permission: ${permission.name}`);
      } else {
        console.log(`   ⏭️  Permission already exists: ${permission.name}`);
      }
    }

    // Create default modules if they don't exist
    const defaultModules = [
      {
        moduleKey: 'dashboard',
        moduleName: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        description: 'Main dashboard with overview and key metrics',
        version: '1.0.0',
        orderIndex: 1,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'users',
        moduleName: 'User Management',
        path: '/users',
        icon: 'users',
        description: 'Manage tenant users, roles, and permissions',
        version: '1.0.0',
        orderIndex: 2,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'roles',
        moduleName: 'Roles & Permissions',
        path: '/roles',
        icon: 'shield',
        description: 'Configure roles and assign permissions to users',
        version: '1.0.0',
        orderIndex: 3,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'modules',
        moduleName: 'Module Management',
        path: '/modules',
        icon: 'package',
        description: 'Enable, disable, and configure application modules',
        version: '1.0.0',
        orderIndex: 4,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'reports',
        moduleName: 'Reports & Analytics',
        path: '/reports',
        icon: 'bar-chart',
        description: 'Generate reports and view analytics data',
        version: '1.0.0',
        orderIndex: 5,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'settings',
        moduleName: 'Settings',
        path: '/settings',
        icon: 'settings',
        description: 'Configure tenant settings and preferences',
        version: '1.0.0',
        orderIndex: 6,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'notifications',
        moduleName: 'Notifications',
        path: '/notifications',
        icon: 'bell',
        description: 'Manage notification preferences and history',
        version: '1.0.0',
        orderIndex: 7,
        isActive: true,
        isVisible: true
      },
      {
        moduleKey: 'support',
        moduleName: 'Support',
        path: '/support',
        icon: 'help-circle',
        description: 'Access help documentation and create support tickets',
        version: '1.0.0',
        orderIndex: 8,
        isActive: true,
        isVisible: true
      }
    ];

    console.log('\n📦 Creating default modules...');
    
    for (const module of defaultModules) {
      const existingModule = await prisma.module.findUnique({
        where: { moduleKey: module.moduleKey }
      });

      if (!existingModule) {
        await prisma.module.create({
          data: module
        });
        console.log(`   ✅ Created module: ${module.moduleName} (${module.moduleKey})`);
      } else {
        console.log(`   ⏭️  Module already exists: ${module.moduleName} (${module.moduleKey})`);
      }
    }

    // Create default tenant admin role with module management permissions
    console.log('\n👥 Setting up default tenant admin role...');
    
    const defaultAdminRole = await prisma.role.findFirst({
      where: {
        name: 'Tenant Admin',
        isTemplate: true
      }
    });

    if (defaultAdminRole) {
      // Get module management permissions
      const moduleManagementPermissions = await prisma.permission.findMany({
        where: {
          moduleKey: 'modules'
        }
      });

      // Assign permissions to the default admin role
      for (const permission of moduleManagementPermissions) {
        const existingRolePermission = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: defaultAdminRole.id,
              permissionId: permission.id
            }
          }
        });

        if (!existingRolePermission) {
          await prisma.rolePermission.create({
            data: {
              roleId: defaultAdminRole.id,
              permissionId: permission.id
            }
          });
          console.log(`   ✅ Assigned permission ${permission.name} to Tenant Admin role`);
        } else {
          console.log(`   ⏭️  Permission ${permission.name} already assigned to Tenant Admin role`);
        }
      }
    } else {
      console.log('   ⚠️  Default Tenant Admin role not found. Please create it first.');
    }

    console.log('\n✅ Module management permissions seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${modulePermissions.length} module management permissions created`);
    console.log(`   • ${defaultModules.length} default modules created`);
    console.log('   • Permissions assigned to default Tenant Admin role');

  } catch (error) {
    console.error('❌ Error seeding module permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedModulePermissions()
    .then(() => {
      console.log('\n🎉 Module permissions seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Module permissions seeding failed:', error);
      process.exit(1);
    });
}

export { seedModulePermissions }; 