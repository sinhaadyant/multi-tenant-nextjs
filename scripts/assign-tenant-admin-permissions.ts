#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function assignTenantAdminPermissions() {
  console.log('🔧 Assigning Tenant Admin permissions...');

  try {
    // Get or create Tenant Admin role
    let tenantAdminRole = await prisma.role.findFirst({
      where: { name: 'Tenant Admin' }
    });

    if (!tenantAdminRole) {
      console.log('Creating Tenant Admin role...');
      tenantAdminRole = await prisma.role.create({
        data: {
          name: 'Tenant Admin',
          description: 'Tenant-level administration with full access to tenant resources',
          isDefault: false
        }
      });
      console.log('✅ Tenant Admin role created');
    } else {
      console.log('✅ Tenant Admin role already exists');
    }

    // Create or ensure all necessary modules exist
    const requiredModules = [
      { moduleKey: 'dashboard', moduleName: 'Dashboard', description: 'Main dashboard with overview and analytics' },
      { moduleKey: 'users', moduleName: 'Users', description: 'User management system' },
      { moduleKey: 'roles', moduleName: 'Roles', description: 'Role and permission management' },
      { moduleKey: 'audit', moduleName: 'Audit Logs', description: 'System audit and activity logs' },
      { moduleKey: 'notifications', moduleName: 'Notifications', description: 'Notification management' },
      { moduleKey: 'settings', moduleName: 'Settings', description: 'System and tenant settings' },
      { moduleKey: 'support', moduleName: 'Support', description: 'Support ticket management' }
    ];

    console.log('Creating/updating modules...');
    for (const moduleData of requiredModules) {
      await prisma.module.upsert({
        where: { moduleKey: moduleData.moduleKey },
        update: {},
        create: moduleData
      });
    }
    console.log('✅ Modules created/updated');

    // Create or ensure all necessary permissions exist
    const requiredPermissions = [
      { name: 'dashboard:view', description: 'View dashboard', moduleKey: 'dashboard', action: 'view' },
      { name: 'users:view', description: 'View users', moduleKey: 'users', action: 'view' },
      { name: 'users:create', description: 'Create users', moduleKey: 'users', action: 'create' },
      { name: 'users:update', description: 'Update users', moduleKey: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', moduleKey: 'users', action: 'delete' },
      { name: 'users:export', description: 'Export users', moduleKey: 'users', action: 'export' },
      { name: 'roles:view', description: 'View roles', moduleKey: 'roles', action: 'view' },
      { name: 'roles:create', description: 'Create roles', moduleKey: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Update roles', moduleKey: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', moduleKey: 'roles', action: 'delete' },
      { name: 'audit:view', description: 'View audit logs', moduleKey: 'audit', action: 'view' },
      { name: 'audit:export', description: 'Export audit logs', moduleKey: 'audit', action: 'export' },
      { name: 'notifications:view', description: 'View notifications', moduleKey: 'notifications', action: 'view' },
      { name: 'notifications:create', description: 'Create notifications', moduleKey: 'notifications', action: 'create' },
      { name: 'notifications:update', description: 'Update notifications', moduleKey: 'notifications', action: 'update' },
      { name: 'notifications:delete', description: 'Delete notifications', moduleKey: 'notifications', action: 'delete' },
      { name: 'settings:view', description: 'View settings', moduleKey: 'settings', action: 'view' },
      { name: 'settings:update', description: 'Update settings', moduleKey: 'settings', action: 'update' },
      { name: 'support:view', description: 'View support', moduleKey: 'support', action: 'view' },
      { name: 'support:create', description: 'Create support tickets', moduleKey: 'support', action: 'create' },
      { name: 'support:update', description: 'Update support tickets', moduleKey: 'support', action: 'update' }
    ];

    console.log('Creating/updating permissions...');
    for (const permission of requiredPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }
    console.log('✅ Permissions created/updated');

    // Assign all permissions to Tenant Admin role
    console.log('Assigning permissions to Tenant Admin role...');
    for (const permission of requiredPermissions) {
      const perm = await prisma.permission.findUnique({
        where: { name: permission.name }
      });

      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: tenantAdminRole.id,
              permissionId: perm.id
            }
          },
          update: {},
          create: {
            roleId: tenantAdminRole.id,
            permissionId: perm.id
          }
        });
      }
    }
    console.log('✅ Permissions assigned to Tenant Admin role');

    // Find all tenant admin users (users with admin@*.com email pattern)
    const adminUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'admin@'
        }
      },
      include: {
        tenant: true
      }
    });

    console.log(`Found ${adminUsers.length} admin users`);

    // Assign Tenant Admin role to all admin users
    for (const user of adminUsers) {
      // Check if user already has the role
      const existingRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          roleId: tenantAdminRole.id
        }
      });

      if (!existingRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: tenantAdminRole.id
          }
        });
        console.log(`✅ Assigned Tenant Admin role to ${user.email} (${user.tenant?.name || 'Unknown Tenant'})`);
      } else {
        console.log(`ℹ️ User ${user.email} already has Tenant Admin role`);
      }
    }

    console.log('🎉 Tenant Admin permissions assignment completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`- Tenant Admin role: ${tenantAdminRole.name}`);
    console.log(`- Modules created: ${requiredModules.length}`);
    console.log(`- Permissions assigned: ${requiredPermissions.length}`);
    console.log(`- Admin users updated: ${adminUsers.length}`);
    console.log('');
    console.log('🔑 Admin users can now access:');
    console.log('- Dashboard with stats');
    console.log('- User management');
    console.log('- Role management');
    console.log('- Audit logs');
    console.log('- Notifications');
    console.log('- Settings');
    console.log('- Support');

  } catch (error) {
    console.error('❌ Error assigning Tenant Admin permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignTenantAdminPermissions(); 