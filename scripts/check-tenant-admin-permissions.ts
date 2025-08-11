#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkTenantAdminPermissions() {
  console.log('🔍 Checking Tenant Admin permissions...');

  try {
    // Find tenant admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'admin@'
        }
      },
      include: {
        tenant: true,
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
    });

    console.log(`Found ${adminUsers.length} admin users`);

    for (const user of adminUsers) {
      console.log(`\n👤 User: ${user.email} (${user.tenant?.name || 'Unknown Tenant'})`);
      console.log(`   Tenant: ${user.tenant?.slug || 'Unknown'}`);
      console.log(`   Active: ${user.isActive}`);
      
      if (user.userRoles.length === 0) {
        console.log('   ❌ No roles assigned');
        continue;
      }

      console.log(`   Roles (${user.userRoles.length}):`);
      
      for (const userRole of user.userRoles) {
        const role = userRole.role;
        console.log(`     - ${role.name} (${role.description})`);
        
        if (role.permissions.length === 0) {
          console.log('       ❌ No permissions assigned to this role');
          continue;
        }

        console.log(`       Permissions (${role.permissions.length}):`);
        
        // Group permissions by module
        const modulePermissions: { [key: string]: string[] } = {};
        role.permissions.forEach(rp => {
          const permission = rp.permission;
          if (!modulePermissions[permission.moduleKey]) {
            modulePermissions[permission.moduleKey] = [];
          }
          modulePermissions[permission.moduleKey].push(permission.action);
        });

        // Display permissions by module
        Object.entries(modulePermissions).forEach(([module, actions]) => {
          console.log(`         ${module}: ${actions.join(', ')}`);
        });

        // Check specifically for users:view permission
        const hasUsersView = role.permissions.some(rp => 
          rp.permission.moduleKey === 'users' && rp.permission.action === 'view'
        );
        
        if (hasUsersView) {
          console.log('       ✅ Has users:view permission');
        } else {
          console.log('       ❌ Missing users:view permission');
        }
      }
    }

    // Also check the Tenant Admin role directly
    console.log('\n🔍 Checking Tenant Admin role directly...');
    const tenantAdminRole = await prisma.role.findFirst({
      where: { name: 'Tenant Admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (tenantAdminRole) {
      console.log(`Role: ${tenantAdminRole.name}`);
      console.log(`Description: ${tenantAdminRole.description}`);
      console.log(`Permissions (${tenantAdminRole.permissions.length}):`);
      
      const modulePermissions: { [key: string]: string[] } = {};
      tenantAdminRole.permissions.forEach(rp => {
        const permission = rp.permission;
        if (!modulePermissions[permission.moduleKey]) {
          modulePermissions[permission.moduleKey] = [];
        }
        modulePermissions[permission.moduleKey].push(permission.action);
      });

      Object.entries(modulePermissions).forEach(([module, actions]) => {
        console.log(`  ${module}: ${actions.join(', ')}`);
      });

      const hasUsersView = tenantAdminRole.permissions.some(rp => 
        rp.permission.moduleKey === 'users' && rp.permission.action === 'view'
      );
      
      if (hasUsersView) {
        console.log('✅ Tenant Admin role has users:view permission');
      } else {
        console.log('❌ Tenant Admin role is missing users:view permission');
      }
    } else {
      console.log('❌ Tenant Admin role not found');
    }

  } catch (error) {
    console.error('❌ Error checking Tenant Admin permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantAdminPermissions(); 