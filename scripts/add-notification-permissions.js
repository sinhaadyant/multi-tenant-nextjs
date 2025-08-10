const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addNotificationPermissions() {
  try {
    console.log('🔧 Adding notification module and permissions...');

    // First, ensure the notifications module exists
    const notificationModule = await prisma.module.upsert({
      where: { moduleKey: 'notifications' },
      update: {},
      create: {
        moduleKey: 'notifications',
        moduleName: 'Notifications',
        path: '/superadmin/notifications',
        icon: 'bell',
        description: 'Manage system notifications',
        isActive: true,
        isVisible: true,
        orderIndex: 6,
      },
    });

    console.log('✅ Notification module created/updated:', notificationModule.moduleName);

    // Define notification permissions
    const notificationPermissions = [
      {
        name: 'view_notifications',
        description: 'View notifications list and details',
        moduleKey: 'notifications',
        action: 'view',
        resource: 'notifications',
        category: 'notifications',
        isSystem: true,
      },
      {
        name: 'create_notifications',
        description: 'Create new notifications',
        moduleKey: 'notifications',
        action: 'create',
        resource: 'notifications',
        category: 'notifications',
        isSystem: true,
      },
      {
        name: 'edit_notifications',
        description: 'Edit existing notifications',
        moduleKey: 'notifications',
        action: 'edit',
        resource: 'notifications',
        category: 'notifications',
        isSystem: true,
      },
      {
        name: 'delete_notifications',
        description: 'Delete notifications',
        moduleKey: 'notifications',
        action: 'delete',
        resource: 'notifications',
        category: 'notifications',
        isSystem: true,
      },
      {
        name: 'send_notifications',
        description: 'Send notifications to target audience',
        moduleKey: 'notifications',
        action: 'send',
        resource: 'notifications',
        category: 'notifications',
        isSystem: true,
      },
    ];

    // Create permissions
    for (const permissionData of notificationPermissions) {
      const permission = await prisma.permission.upsert({
        where: {
          moduleKey_action_resource: {
            moduleKey: permissionData.moduleKey,
            action: permissionData.action,
            resource: permissionData.resource,
          },
        },
        update: {
          description: permissionData.description,
          category: permissionData.category,
          isSystem: permissionData.isSystem,
        },
        create: permissionData,
      });

      console.log(`✅ Permission created/updated: ${permission.name}`);
    }

    // Get all superadmin roles and assign notification permissions
    const superAdminRoles = await prisma.role.findMany({
      where: {
        isSystem: true,
        tenantId: null, // Superadmin roles
      },
    });

    for (const role of superAdminRoles) {
      console.log(`🔧 Assigning notification permissions to role: ${role.name}`);

      // Get all notification permissions
      const notificationPerms = await prisma.permission.findMany({
        where: {
          moduleKey: 'notifications',
        },
      });

      // Assign permissions to role
      for (const perm of notificationPerms) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }

      console.log(`✅ Assigned ${notificationPerms.length} permissions to role: ${role.name}`);
    }

    console.log('🎉 Notification permissions setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up notification permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addNotificationPermissions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addNotificationPermissions }; 