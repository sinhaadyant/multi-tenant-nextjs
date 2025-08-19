import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Step 1: Create SuperAdmin
    console.log('Step 1: Creating SuperAdmin...');
    const superAdminEmail = 'superadmin@example.com';
    const superAdminPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

    const superAdmin = await prisma.superAdmin.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        email: superAdminEmail,
        name: 'System Super Admin',
        password: hashedPassword,
        isActive: true,
        contactNumber: '+1234567890',
        avatar: null
      }
    });

    console.log(`✅ SuperAdmin created: ${superAdmin.email}`);

    // Step 2: Create Modules
    console.log('Step 2: Creating Modules...');
    const modules = [
      {
        moduleKey: 'dashboard',
        moduleName: 'Dashboard',
        description: 'Main dashboard and analytics',
        path: '/dashboard',
        icon: 'home',
        isActive: true,
        isVisible: true,
        orderIndex: 1
      },
      {
        moduleKey: 'users',
        moduleName: 'User Management',
        description: 'Manage users and their accounts',
        path: '/users',
        icon: 'users',
        isActive: true,
        isVisible: true,
        orderIndex: 2
      },
      {
        moduleKey: 'roles',
        moduleName: 'Roles & Permissions',
        description: 'Manage roles and permissions',
        path: '/roles',
        icon: 'shield',
        isActive: true,
        isVisible: true,
        orderIndex: 3
      },
      {
        moduleKey: 'modules',
        moduleName: 'Module Management',
        description: 'Manage system modules',
        path: '/modules',
        icon: 'puzzle',
        isActive: true,
        isVisible: true,
        orderIndex: 4
      },
      {
        moduleKey: 'tenants',
        moduleName: 'Tenant Management',
        description: 'Manage multi-tenant organizations',
        path: '/tenants',
        icon: 'building',
        isActive: true,
        isVisible: true,
        orderIndex: 5
      },
      {
        moduleKey: 'audit',
        moduleName: 'Audit Logs',
        description: 'System audit and activity logs',
        path: '/audit',
        icon: 'clipboard-list',
        isActive: true,
        isVisible: true,
        orderIndex: 6
      },
      {
        moduleKey: 'notifications',
        moduleName: 'Notifications',
        description: 'Manage system notifications',
        path: '/notifications',
        icon: 'bell',
        isActive: true,
        isVisible: true,
        orderIndex: 7
      },
      {
        moduleKey: 'support',
        moduleName: 'Support Tickets',
        description: 'Customer support ticket system',
        path: '/support',
        icon: 'life-ring',
        isActive: true,
        isVisible: true,
        orderIndex: 8
      },
      {
        moduleKey: 'reports',
        moduleName: 'Reports',
        description: 'Generate and view reports',
        path: '/reports',
        icon: 'chart-bar',
        isActive: true,
        isVisible: true,
        orderIndex: 9
      },
      {
        moduleKey: 'settings',
        moduleName: 'Settings',
        description: 'System configuration and settings',
        path: '/settings',
        icon: 'cog',
        isActive: true,
        isVisible: true,
        orderIndex: 10
      }
    ];

    for (const moduleData of modules) {
      await prisma.module.upsert({
        where: { moduleKey: moduleData.moduleKey },
        update: {},
        create: moduleData
      });
    }

    console.log(`✅ ${modules.length} modules created`);

    // Step 3: Create Global Roles
    console.log('Step 3: Creating Global Roles...');
    
    // Super Admin Role
    const superAdminRole = await prisma.role.upsert({
      where: { 
        name_isGlobal: {
          name: 'Super Admin',
          isGlobal: true
        }
      },
      update: {},
      create: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        isActive: true,
        isGlobal: true,
        isSystem: true,
        priority: 100,
        createdBy: superAdmin.id
      }
    });

    // Tenant Admin Role
    const tenantAdminRole = await prisma.role.upsert({
      where: { 
        name_isGlobal: {
          name: 'Tenant Admin',
          isGlobal: true
        }
      },
      update: {},
      create: {
        name: 'Tenant Admin',
        description: 'Full tenant access with limited system permissions',
        isActive: true,
        isGlobal: true,
        isSystem: true,
        priority: 90,
        createdBy: superAdmin.id
      }
    });

    // User Role
    const userRole = await prisma.role.upsert({
      where: { 
        name_isGlobal: {
          name: 'User',
          isGlobal: true
        }
      },
      update: {},
      create: {
        name: 'User',
        description: 'Basic user with limited permissions',
        isActive: true,
        isGlobal: true,
        isSystem: true,
        priority: 10,
        createdBy: superAdmin.id
      }
    });

    console.log('✅ Global roles created');

    // Step 4: Assign permissions to roles
    console.log('Step 4: Assigning permissions to roles...');
    
    // Super Admin gets all permissions
    const superAdminPermissions = modules.map(module => ({
      roleId: superAdminRole.id,
      moduleKey: module.moduleKey,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canViewAll: true
    }));

    await prisma.rolePermission.createMany({
      data: superAdminPermissions,
      skipDuplicates: true
    });

    // Tenant Admin gets tenant-specific permissions
    const tenantAdminPermissions = modules
      .filter(module => !['tenants'].includes(module.moduleKey))
      .map(module => ({
        roleId: tenantAdminRole.id,
        moduleKey: module.moduleKey,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canViewAll: true
      }));

    await prisma.rolePermission.createMany({
      data: tenantAdminPermissions,
      skipDuplicates: true
    });

    // User gets basic permissions
    const userPermissions = modules
      .filter(module => ['dashboard', 'notifications', 'support'].includes(module.moduleKey))
      .map(module => ({
        roleId: userRole.id,
        moduleKey: module.moduleKey,
        canCreate: module.moduleKey === 'support',
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canViewAll: false
      }));

    await prisma.rolePermission.createMany({
      data: userPermissions,
      skipDuplicates: true
    });

    console.log('✅ Permissions assigned to roles');

    // Step 5: Create Sample Tenants
    console.log('Step 5: Creating sample tenants...');
    
    const tenants = [
      {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        domain: 'acme.example.com',
        description: 'Leading technology company',
        plan: 'enterprise',
        features: JSON.stringify(['advanced_analytics', 'custom_branding', 'priority_support'])
      },
      {
        name: 'TechStart Inc',
        slug: 'techstart',
        domain: 'techstart.example.com',
        description: 'Innovative startup company',
        plan: 'starter',
        features: JSON.stringify(['basic_analytics', 'email_support'])
      },
      {
        name: 'Global Solutions',
        slug: 'global-solutions',
        domain: 'global.example.com',
        description: 'International consulting firm',
        plan: 'professional',
        features: JSON.stringify(['advanced_analytics', 'custom_branding'])
      }
    ];

    const createdTenants = [];
    for (const tenantData of tenants) {
      const tenant = await prisma.tenant.upsert({
        where: { slug: tenantData.slug },
        update: {},
        create: tenantData
      });
      createdTenants.push(tenant);
    }

    console.log(`✅ ${createdTenants.length} tenants created`);

    // Step 6: Create Tenant Users
    console.log('Step 6: Creating tenant users...');
    
    const tenantUsers = [
      {
        email: 'admin@acme-corp.com',
        name: 'Acme Admin',
        password: 'AcmeAdmin123!',
        tenantSlug: 'acme-corp',
        roleName: 'Tenant Admin'
      },
      {
        email: 'user@acme-corp.com',
        name: 'Acme User',
        password: 'AcmeUser123!',
        tenantSlug: 'acme-corp',
        roleName: 'User'
      },
      {
        email: 'admin@techstart.com',
        name: 'TechStart Admin',
        password: 'TechStart123!',
        tenantSlug: 'techstart',
        roleName: 'Tenant Admin'
      },
      {
        email: 'admin@global-solutions.com',
        name: 'Global Admin',
        password: 'GlobalAdmin123!',
        tenantSlug: 'global-solutions',
        roleName: 'Tenant Admin'
      }
    ];

    for (const userData of tenantUsers) {
      const tenant = createdTenants.find(t => t.slug === userData.tenantSlug);
      if (!tenant) continue;

      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.upsert({
        where: { 
          email_tenantId: {
            email: userData.email,
            tenantId: tenant.id
          }
        },
        update: {},
        create: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          tenantId: tenant.id,
          isActive: true
        }
      });

      // Assign role to user
      const role = await prisma.role.findFirst({
        where: { 
          name: userData.roleName,
          isGlobal: true
        }
      });

      if (role) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id,
            assignedBy: superAdmin.id
          }
        });
      }
    }

    console.log(`✅ ${tenantUsers.length} tenant users created`);

    // Step 7: Create Tenant Modules
    console.log('Step 7: Creating tenant modules...');
    
    for (const tenant of createdTenants) {
      for (const module of modules) {
        await prisma.tenantModule.upsert({
          where: {
            tenantId_moduleKey: {
              tenantId: tenant.id,
              moduleKey: module.moduleKey
            }
          },
          update: {},
          create: {
            tenantId: tenant.id,
            moduleKey: module.moduleKey,
            isEnabled: true,
            isVisible: true,
            enabledBy: superAdmin.id,
            enabledAt: new Date()
          }
        });
      }
    }

    console.log('✅ Tenant modules created');

    console.log('🎉 Database seeding completed successfully!');
    
    // Update credentials file
    const credentials = {
      superadmin: {
        email: superAdminEmail,
        password: superAdminPassword
      },
      tenants: tenantUsers.map(user => ({
        email: user.email,
        password: user.password,
        tenant: user.tenantSlug
      }))
    };

    console.log('\n📋 Generated Credentials:');
    console.log('SuperAdmin:', credentials.superadmin);
    console.log('Tenant Users:', credentials.tenants);

    return credentials;

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
    .then((credentials) => {
      console.log('\n✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase }; 