#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function fixAllModulePermissions() {
  console.log('🔧 Fixing permissions for all modules...\n');

  try {
    // Step 1: Ensure all modules exist
    console.log('1. Creating/updating modules...');
    const modules = [
      { moduleKey: 'dashboard', moduleName: 'Dashboard', description: 'Main dashboard with overview and analytics' },
      { moduleKey: 'users', moduleName: 'Users', description: 'User management system' },
      { moduleKey: 'roles', moduleName: 'Roles', description: 'Role and permission management' },
      { moduleKey: 'audit', moduleName: 'Audit Logs', description: 'System audit and activity logs' },
      { moduleKey: 'notifications', moduleName: 'Notifications', description: 'Notification management' },
      { moduleKey: 'settings', moduleName: 'Settings', description: 'System and tenant settings' },
      { moduleKey: 'support', moduleName: 'Support', description: 'Support ticket management' }
    ];

    for (const moduleData of modules) {
      await prisma.module.upsert({
        where: { moduleKey: moduleData.moduleKey },
        update: {},
        create: moduleData
      });
    }
    console.log('✅ Modules created/updated');

    // Step 2: Create all necessary permissions
    console.log('\n2. Creating/updating permissions...');
    const permissions = [
      // Dashboard
      { name: 'dashboard:view', description: 'View dashboard', moduleKey: 'dashboard', action: 'view' },
      
      // Users
      { name: 'users:view', description: 'View users', moduleKey: 'users', action: 'view' },
      { name: 'users:create', description: 'Create users', moduleKey: 'users', action: 'create' },
      { name: 'users:update', description: 'Update users', moduleKey: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', moduleKey: 'users', action: 'delete' },
      { name: 'users:export', description: 'Export users', moduleKey: 'users', action: 'export' },
      
      // Roles
      { name: 'roles:view', description: 'View roles', moduleKey: 'roles', action: 'view' },
      { name: 'roles:create', description: 'Create roles', moduleKey: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Update roles', moduleKey: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', moduleKey: 'roles', action: 'delete' },
      
      // Audit
      { name: 'audit:view', description: 'View audit logs', moduleKey: 'audit', action: 'view' },
      { name: 'audit:export', description: 'Export audit logs', moduleKey: 'audit', action: 'export' },
      
      // Notifications
      { name: 'notifications:view', description: 'View notifications', moduleKey: 'notifications', action: 'view' },
      { name: 'notifications:create', description: 'Create notifications', moduleKey: 'notifications', action: 'create' },
      { name: 'notifications:update', description: 'Update notifications', moduleKey: 'notifications', action: 'update' },
      { name: 'notifications:delete', description: 'Delete notifications', moduleKey: 'notifications', action: 'delete' },
      
      // Settings
      { name: 'settings:view', description: 'View settings', moduleKey: 'settings', action: 'view' },
      { name: 'settings:update', description: 'Update settings', moduleKey: 'settings', action: 'update' },
      
      // Support
      { name: 'support:view', description: 'View support', moduleKey: 'support', action: 'view' },
      { name: 'support:create', description: 'Create support tickets', moduleKey: 'support', action: 'create' },
      { name: 'support:update', description: 'Update support tickets', moduleKey: 'support', action: 'update' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }
    console.log('✅ Permissions created/updated');

    // Step 3: Fix role permissions
    console.log('\n3. Fixing role permissions...');

    // Get existing roles first
    const existingRoles = await prisma.role.findMany({
      where: {
        name: {
          in: ['Tenant Admin', 'Manager', 'User', 'Viewer']
        }
      }
    });

    console.log(`   Found ${existingRoles.length} existing roles`);
    
    // Create roles if they don't exist
    const roleNames = ['Tenant Admin', 'Manager', 'User', 'Viewer'];
    const roles = [];

    for (const roleName of roleNames) {
      let role = existingRoles.find(r => r.name === roleName);
      
      if (!role) {
        console.log(`   Creating role: ${roleName}`);
        role = await prisma.role.create({
          data: {
            name: roleName,
            description: getRoleDescription(roleName),
            isDefault: roleName === 'User'
          }
        });
      } else {
        console.log(`   Using existing role: ${roleName}`);
      }
      
      roles.push(role);
    }

    function getRoleDescription(roleName: string): string {
      switch (roleName) {
        case 'Tenant Admin':
          return 'Tenant-level administration with full access to tenant resources';
        case 'Manager':
          return 'Management level access with limited administrative capabilities';
        case 'User':
          return 'Standard user access with basic functionality';
        case 'Viewer':
          return 'Read-only access to view data';
        default:
          return '';
      }
    }

    // Define permissions for each role
    const rolePermissions = {
      'Tenant Admin': [
        'dashboard:view',
        'users:view', 'users:create', 'users:update', 'users:delete', 'users:export',
        'roles:view', 'roles:create', 'roles:update', 'roles:delete',
        'audit:view', 'audit:export',
        'notifications:view', 'notifications:create', 'notifications:update', 'notifications:delete',
        'settings:view', 'settings:update',
        'support:view', 'support:create', 'support:update'
      ],
      'Manager': [
        'dashboard:view',
        'users:view', 'users:create', 'users:update',
        'roles:view',
        'audit:view',
        'notifications:view', 'notifications:create', 'notifications:update',
        'settings:view',
        'support:view', 'support:create', 'support:update'
      ],
      'User': [
        'dashboard:view',
        'users:view',
        'notifications:view',
        'support:view', 'support:create'
      ],
      'Viewer': [
        'dashboard:view',
        'users:view',
        'notifications:view',
        'support:view'
      ]
    };

    // Assign permissions to roles
    for (const role of roles) {
      console.log(`   Assigning permissions to ${role.name}...`);
      
      const permissionsToAssign = rolePermissions[role.name as keyof typeof rolePermissions] || [];
      
      for (const permissionName of permissionsToAssign) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
      
      console.log(`   ✅ ${role.name}: ${permissionsToAssign.length} permissions assigned`);
    }

    // Step 4: Ensure all admin users have Tenant Admin role
    console.log('\n4. Ensuring admin users have proper roles...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'admin@'
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const tenantAdminRole = roles.find(r => r.name === 'Tenant Admin');
    
    for (const user of adminUsers) {
      const hasTenantAdminRole = user.userRoles.some(ur => ur.role.name === 'Tenant Admin');
      
      if (!hasTenantAdminRole && tenantAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: tenantAdminRole.id
          }
        });
        console.log(`   ✅ Assigned Tenant Admin role to ${user.email}`);
      } else {
        console.log(`   ℹ️  ${user.email} already has Tenant Admin role`);
      }
    }

    console.log('\n🎉 All module permissions have been fixed!');
    console.log('\n📋 Summary:');
    console.log('- Modules: Created/updated 7 modules');
    console.log('- Permissions: Created/updated 22 permissions');
    console.log('- Roles: Fixed permissions for 4 roles');
    console.log('- Admin users: Ensured proper role assignments');

  } catch (error) {
    console.error('❌ Error fixing module permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllModulePermissions(); 