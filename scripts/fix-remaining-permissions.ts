#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function fixRemainingPermissions() {
  console.log('🔧 Fixing remaining permission issues...\n');

  try {
    // Get all roles
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log(`Found ${roles.length} roles`);

    // Define the correct permissions for each role
    const correctRolePermissions = {
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
        'users:view', 'users:create', 'users:update', 'users:delete', 'users:export',
        'roles:view',
        'audit:view', 'audit:export',
        'notifications:view', 'notifications:create', 'notifications:update', 'notifications:delete',
        'settings:view', 'settings:update',
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

    // Fix each role
    for (const role of roles) {
      const roleName = role.name;
      const expectedPermissions = correctRolePermissions[roleName as keyof typeof correctRolePermissions];
      
      if (!expectedPermissions) {
        console.log(`⚠️  No expected permissions defined for role: ${roleName}`);
        continue;
      }

      console.log(`\n🔧 Fixing role: ${roleName}`);
      
      // Get current permissions
      const currentPermissions = role.permissions.map(rp => rp.permission.name);
      console.log(`   Current permissions (${currentPermissions.length}):`, currentPermissions);
      
      // Find missing permissions
      const missingPermissions = expectedPermissions.filter(perm => !currentPermissions.includes(perm));
      const extraPermissions = currentPermissions.filter(perm => !expectedPermissions.includes(perm));
      
      if (missingPermissions.length > 0) {
        console.log(`   Missing permissions: ${missingPermissions.join(', ')}`);
      }
      
      if (extraPermissions.length > 0) {
        console.log(`   Extra permissions: ${extraPermissions.join(', ')}`);
      }

      // Add missing permissions
      for (const permissionName of missingPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          console.log(`   ✅ Added: ${permissionName}`);
        } else {
          console.log(`   ❌ Permission not found: ${permissionName}`);
        }
      }

      // Remove extra permissions (optional - uncomment if needed)
      /*
      for (const permissionName of extraPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.deleteMany({
            where: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          console.log(`   🗑️  Removed: ${permissionName}`);
        }
      }
      */
    }

    console.log('\n🎉 Remaining permissions have been fixed!');

  } catch (error) {
    console.error('❌ Error fixing remaining permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingPermissions(); 