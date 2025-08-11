#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkAllModulePermissions() {
  console.log('🔍 Checking permissions for all modules across all tenants...\n');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
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

    console.log(`Found ${tenants.length} active tenants\n`);

    // Define all expected modules
    const expectedModules = [
      'dashboard',
      'users', 
      'roles',
      'audit',
      'notifications',
      'settings',
      'support'
    ];

    // Define expected permissions for each module
    const expectedPermissions = {
      dashboard: ['view'],
      users: ['view', 'create', 'update', 'delete', 'export'],
      roles: ['view', 'create', 'update', 'delete'],
      audit: ['view', 'export'],
      notifications: ['view', 'create', 'update', 'delete'],
      settings: ['view', 'update'],
      support: ['view', 'create', 'update']
    };

    for (const tenant of tenants) {
      console.log(`🏢 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   Users: ${tenant.users.length}`);
      
      // Check each user in the tenant
      for (const user of tenant.users) {
        console.log(`\n   👤 User: ${user.name} (${user.email})`);
        console.log(`      Active: ${user.isActive}`);
        console.log(`      Roles: ${user.userRoles.length}`);
        
        if (user.userRoles.length === 0) {
          console.log(`      ❌ No roles assigned`);
          continue;
        }

        // Collect all permissions from user's roles
        const userPermissions: string[] = [];
        const modulePermissions: { [key: string]: string[] } = {};

        for (const userRole of user.userRoles) {
          const role = userRole.role;
          console.log(`      Role: ${role.name}`);
          
          for (const rp of role.permissions) {
            const permission = rp.permission;
            const permissionKey = `${permission.moduleKey}:${permission.action}`;
            
            if (!userPermissions.includes(permissionKey)) {
              userPermissions.push(permissionKey);
            }

            if (!modulePermissions[permission.moduleKey]) {
              modulePermissions[permission.moduleKey] = [];
            }
            if (!modulePermissions[permission.moduleKey].includes(permission.action)) {
              modulePermissions[permission.moduleKey].push(permission.action);
            }
          }
        }

        console.log(`      Total permissions: ${userPermissions.length}`);
        
        // Check each expected module
        for (const module of expectedModules) {
          const hasModulePermissions = modulePermissions[module] && modulePermissions[module].length > 0;
          const expectedModulePermissions = expectedPermissions[module as keyof typeof expectedPermissions];
          
          if (hasModulePermissions) {
            const missingPermissions = expectedModulePermissions.filter(
              perm => !modulePermissions[module].includes(perm)
            );
            
            if (missingPermissions.length > 0) {
              console.log(`      ⚠️  ${module}: Missing permissions: ${missingPermissions.join(', ')}`);
            } else {
              console.log(`      ✅ ${module}: All permissions present`);
            }
          } else {
            console.log(`      ❌ ${module}: No permissions`);
          }
        }

        // Check for admin users specifically
        const isAdmin = user.email.includes('admin@');
        if (isAdmin) {
          console.log(`      🔑 Admin user detected`);
          
          // Check if admin has all necessary permissions
          const criticalPermissions = ['users:view', 'roles:view', 'dashboard:view'];
          const missingCritical = criticalPermissions.filter(perm => !userPermissions.includes(perm));
          
          if (missingCritical.length > 0) {
            console.log(`      ❌ Admin missing critical permissions: ${missingCritical.join(', ')}`);
          } else {
            console.log(`      ✅ Admin has all critical permissions`);
          }
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }

    // Check global permission issues
    console.log('🌐 Global Permission Analysis:\n');

    // Check if all modules exist
    const modules = await prisma.module.findMany();
    console.log(`Database modules (${modules.length}):`, modules.map(m => m.moduleKey));

    // Check if all expected permissions exist
    const permissions = await prisma.permission.findMany();
    console.log(`\nDatabase permissions (${permissions.length}):`);
    
    const permissionByModule: { [key: string]: string[] } = {};
    for (const perm of permissions) {
      if (!permissionByModule[perm.moduleKey]) {
        permissionByModule[perm.moduleKey] = [];
      }
      permissionByModule[perm.moduleKey].push(perm.action);
    }

    for (const module of expectedModules) {
      const dbPermissions = permissionByModule[module] || [];
      const expectedPerms = expectedPermissions[module as keyof typeof expectedPermissions];
      
      const missing = expectedPerms.filter(perm => !dbPermissions.includes(perm));
      const extra = dbPermissions.filter(perm => !expectedPerms.includes(perm));
      
      if (missing.length > 0) {
        console.log(`   ❌ ${module}: Missing permissions: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`   ⚠️  ${module}: Extra permissions: ${extra.join(', ')}`);
      }
      if (missing.length === 0 && extra.length === 0) {
        console.log(`   ✅ ${module}: All expected permissions present`);
      }
    }

    // Check role assignments
    console.log('\n👥 Role Assignment Analysis:\n');
    
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: true
          }
        }
      }
    });

    for (const role of roles) {
      console.log(`Role: ${role.name}`);
      console.log(`   Users with this role: ${role.userRoles.length}`);
      console.log(`   Permissions: ${role.permissions.length}`);
      
      if (role.permissions.length === 0) {
        console.log(`   ❌ No permissions assigned to role`);
      }
      
      if (role.userRoles.length === 0) {
        console.log(`   ⚠️  No users assigned to role`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking module permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllModulePermissions(); 