#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function testTenantPermissions() {
  console.log('🧪 Testing Tenant Admin permissions...');

  try {
    // Find a tenant admin user
    const adminUser = await prisma.user.findFirst({
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

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`\n👤 Testing permissions for: ${adminUser.email}`);
    console.log(`🏢 Tenant: ${adminUser.tenant?.name || 'Unknown'}`);

    // Extract all permissions
    const allPermissions: string[] = [];
    const modulePermissions: { [key: string]: string[] } = {};

    adminUser.userRoles.forEach(userRole => {
      console.log(`\n📋 Role: ${userRole.role.name}`);
      console.log(`📝 Description: ${userRole.role.description}`);
      
      userRole.role.permissions.forEach(rp => {
        const permission = rp.permission;
        const permissionKey = `${permission.moduleKey}:${permission.action}`;
        
        // Add to all permissions
        if (!allPermissions.includes(permissionKey)) {
          allPermissions.push(permissionKey);
        }

        // Add to module permissions
        if (!modulePermissions[permission.moduleKey]) {
          modulePermissions[permission.moduleKey] = [];
        }
        if (!modulePermissions[permission.moduleKey].includes(permission.action)) {
          modulePermissions[permission.moduleKey].push(permission.action);
        }
      });
    });

    console.log('\n🔑 All Permissions:');
    allPermissions.sort().forEach(permission => {
      console.log(`  ✅ ${permission}`);
    });

    console.log('\n📦 Module Permissions:');
    Object.entries(modulePermissions).forEach(([module, actions]) => {
      console.log(`  📁 ${module}: ${actions.join(', ')}`);
    });

    // Test specific permissions
    const requiredPermissions = [
      'dashboard:view',
      'users:view',
      'users:create',
      'users:update',
      'users:delete',
      'roles:view',
      'audit:view',
      'notifications:view',
      'settings:view',
      'support:view'
    ];

    console.log('\n🧪 Testing Required Permissions:');
    let allRequiredPresent = true;
    
    requiredPermissions.forEach(permission => {
      const hasPermission = allPermissions.includes(permission);
      const status = hasPermission ? '✅' : '❌';
      console.log(`  ${status} ${permission}`);
      
      if (!hasPermission) {
        allRequiredPresent = false;
      }
    });

    if (allRequiredPresent) {
      console.log('\n🎉 All required permissions are present!');
      console.log('✅ Tenant admin should be able to access all features.');
    } else {
      console.log('\n⚠️ Some required permissions are missing.');
      console.log('❌ Tenant admin may have limited access.');
    }

    // Test API access simulation
    console.log('\n🌐 API Access Test:');
    console.log('The following API endpoints should be accessible:');
    console.log('  GET /api/tenant/[tenantSlug]/dashboard');
    console.log('  GET /api/tenant/[tenantSlug]/users');
    console.log('  GET /api/tenant/[tenantSlug]/roles');
    console.log('  GET /api/tenant/[tenantSlug]/audit');
    console.log('  GET /api/tenant/[tenantSlug]/permissions/current-user');

  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTenantPermissions(); 