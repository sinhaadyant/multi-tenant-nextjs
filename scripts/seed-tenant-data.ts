#!/usr/bin/env tsx

/**
 * Seed Tenant Data Script
 * 
 * This script creates sample tenants, users, roles, and permissions for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTenantData() {
  console.log('🌱 Seeding tenant data...\n');

  try {
    // Create sample tenants
    const tenants = [
      {
        name: 'Acme Corporation',
        slug: 'acme',
        domain: 'acme.example.com',
        description: 'A leading technology company',
        plan: 'enterprise',
        region: 'US East',
        features: JSON.stringify(['advanced_analytics', 'custom_branding', 'priority_support'])
      },
      {
        name: 'TechStart Inc',
        slug: 'techstart',
        domain: 'techstart.example.com',
        description: 'Innovative startup company',
        plan: 'starter',
        region: 'US West',
        features: JSON.stringify(['basic_analytics', 'email_support'])
      },
      {
        name: 'Global Solutions',
        slug: 'globalsolutions',
        domain: 'globalsolutions.example.com',
        description: 'International consulting firm',
        plan: 'professional',
        region: 'EU West',
        features: JSON.stringify(['advanced_analytics', 'custom_branding', 'phone_support'])
      }
    ];

    for (const tenantData of tenants) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: tenantData.slug }
      });

      if (!existingTenant) {
        const tenant = await prisma.tenant.create({
          data: tenantData
        });
        console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);
      } else {
        console.log(`⚠️  Tenant already exists: ${existingTenant.name} (${existingTenant.slug})`);
      }
    }

    // Create permissions
    const permissions = [
      // Dashboard permissions
      { name: 'dashboard.view', description: 'View dashboard', module: 'Dashboard', submodule: 'Overview', action: 'view' },
      
      // User management permissions
      { name: 'users.view', description: 'View users', module: 'Users', submodule: 'Management', action: 'view' },
      { name: 'users.create', description: 'Create users', module: 'Users', submodule: 'Management', action: 'create' },
      { name: 'users.edit', description: 'Edit users', module: 'Users', submodule: 'Management', action: 'edit' },
      { name: 'users.delete', description: 'Delete users', module: 'Users', submodule: 'Management', action: 'delete' },
      
      // Role management permissions
      { name: 'roles.view', description: 'View roles', module: 'Roles', submodule: 'Management', action: 'view' },
      { name: 'roles.create', description: 'Create roles', module: 'Roles', submodule: 'Management', action: 'create' },
      { name: 'roles.edit', description: 'Edit roles', module: 'Roles', submodule: 'Management', action: 'edit' },
      { name: 'roles.delete', description: 'Delete roles', module: 'Roles', submodule: 'Management', action: 'delete' },
      
      // Reports permissions
      { name: 'reports.view', description: 'View reports', module: 'Reports', submodule: 'Analytics', action: 'view' },
      { name: 'reports.create', description: 'Create reports', module: 'Reports', submodule: 'Analytics', action: 'create' },
      { name: 'reports.download', description: 'Download reports', module: 'Reports', submodule: 'Analytics', action: 'download' },
      
      // Settings permissions
      { name: 'settings.view', description: 'View settings', module: 'Settings', submodule: 'Configuration', action: 'view' },
      { name: 'settings.edit', description: 'Edit settings', module: 'Settings', submodule: 'Configuration', action: 'edit' },
      
      // Analytics permissions
      { name: 'analytics.view', description: 'View analytics', module: 'Analytics', submodule: 'Insights', action: 'view' },
      
      // Notifications permissions
      { name: 'notifications.view', description: 'View notifications', module: 'Notifications', submodule: 'Management', action: 'view' },
      { name: 'notifications.edit', description: 'Edit notifications', module: 'Notifications', submodule: 'Management', action: 'edit' },
      
      // Support permissions
      { name: 'support.view', description: 'View support', module: 'Support', submodule: 'Help', action: 'view' },
      { name: 'support.create', description: 'Create support tickets', module: 'Support', submodule: 'Help', action: 'create' }
    ];

    for (const permissionData of permissions) {
      const existingPermission = await prisma.permission.findUnique({
        where: { name: permissionData.name }
      });

      if (!existingPermission) {
        const permission = await prisma.permission.create({
          data: permissionData
        });
        console.log(`✅ Created permission: ${permission.name}`);
      } else {
        console.log(`⚠️  Permission already exists: ${existingPermission.name}`);
      }
    }

    // Get all tenants and permissions for role creation
    const allTenants = await prisma.tenant.findMany();
    const allPermissions = await prisma.permission.findMany();

    // Create roles for each tenant
    for (const tenant of allTenants) {
      // Admin role
      const adminRole = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Full access to all features',
          isDefault: false,
          tenantId: tenant.id
        }
      });

      // Assign all permissions to admin role
      for (const permission of allPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
      }

      // User role
      const userRole = await prisma.role.create({
        data: {
          name: 'User',
          description: 'Basic user access',
          isDefault: true,
          tenantId: tenant.id
        }
      });

      // Assign basic permissions to user role
      const basicPermissions = allPermissions.filter(p => 
        ['dashboard.view', 'users.view', 'reports.view', 'analytics.view', 'notifications.view', 'support.view', 'support.create'].includes(p.name)
      );

      for (const permission of basicPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        });
      }

      // Manager role
      const managerRole = await prisma.role.create({
        data: {
          name: 'Manager',
          description: 'Management level access',
          isDefault: false,
          tenantId: tenant.id
        }
      });

      // Assign manager permissions
      const managerPermissions = allPermissions.filter(p => 
        !['roles.delete', 'settings.edit'].includes(p.name)
      );

      for (const permission of managerPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: managerRole.id,
            permissionId: permission.id
          }
        });
      }

      console.log(`✅ Created roles for tenant: ${tenant.name}`);
    }

    // Create sample users for each tenant
    const userData = [
      {
        name: 'John Admin',
        email: 'admin@acme.com',
        password: 'admin123',
        tenantSlug: 'acme',
        roleName: 'Admin'
      },
      {
        name: 'Jane Manager',
        email: 'manager@acme.com',
        password: 'manager123',
        tenantSlug: 'acme',
        roleName: 'Manager'
      },
      {
        name: 'Bob User',
        email: 'user@acme.com',
        password: 'user123',
        tenantSlug: 'acme',
        roleName: 'User'
      },
      {
        name: 'Alice Admin',
        email: 'admin@techstart.com',
        password: 'admin123',
        tenantSlug: 'techstart',
        roleName: 'Admin'
      },
      {
        name: 'Charlie User',
        email: 'user@techstart.com',
        password: 'user123',
        tenantSlug: 'techstart',
        roleName: 'User'
      },
      {
        name: 'David Admin',
        email: 'admin@globalsolutions.com',
        password: 'admin123',
        tenantSlug: 'globalsolutions',
        roleName: 'Admin'
      },
      {
        name: 'Eva Manager',
        email: 'manager@globalsolutions.com',
        password: 'manager123',
        tenantSlug: 'globalsolutions',
        roleName: 'Manager'
      }
    ];

    for (const userInfo of userData) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: userInfo.tenantSlug }
      });

      if (!tenant) {
        console.log(`❌ Tenant not found: ${userInfo.tenantSlug}`);
        continue;
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          email: userInfo.email,
          tenantId: tenant.id
        }
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userInfo.password, 10);
        
        const user = await prisma.user.create({
          data: {
            name: userInfo.name,
            email: userInfo.email,
            password: hashedPassword,
            tenantId: tenant.id,
            isActive: true
          }
        });

        // Assign role to user
        const role = await prisma.role.findFirst({
          where: {
            name: userInfo.roleName,
            tenantId: tenant.id
          }
        });

        if (role) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              assignedBy: 'system'
            }
          });
        }

        console.log(`✅ Created user: ${user.name} (${user.email}) in ${tenant.name}`);
      } else {
        console.log(`⚠️  User already exists: ${existingUser.name} (${existingUser.email})`);
      }
    }

    console.log('\n🎉 Tenant data seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Acme Corporation (acme):');
    console.log('  - Admin: admin@acme.com / admin123');
    console.log('  - Manager: manager@acme.com / manager123');
    console.log('  - User: user@acme.com / user123');
    console.log('\nTechStart Inc (techstart):');
    console.log('  - Admin: admin@techstart.com / admin123');
    console.log('  - User: user@techstart.com / user123');
    console.log('\nGlobal Solutions (globalsolutions):');
    console.log('  - Admin: admin@globalsolutions.com / admin123');
    console.log('  - Manager: manager@globalsolutions.com / manager123');

  } catch (error) {
    console.error('❌ Error seeding tenant data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedTenantData(); 