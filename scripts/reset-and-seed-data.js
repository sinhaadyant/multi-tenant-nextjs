const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearAllData() {
  console.log('🗑️ Clearing all data...');
  
  // Clear in the correct order to avoid foreign key constraints
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantModule.deleteMany();
  await prisma.module.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.superAdmin.deleteMany();
  
  console.log('✅ All data cleared');
}

async function createModules() {
  console.log('📦 Creating modules...');
  
  const modules = [
    {
      moduleKey: 'dashboard',
      moduleName: 'Dashboard',
      description: 'Main dashboard with overview and statistics',
      icon: 'LayoutDashboard',
      path: '/dashboard',
      isActive: true,
      isVisible: true,
      orderIndex: 1,
      permissions: ['view'] // Only view permission
    },
    {
      moduleKey: 'user-management',
      moduleName: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: 'Users',
      path: '/users',
      isActive: true,
      isVisible: true,
      orderIndex: 2,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'profile',
      moduleName: 'Profile',
      description: 'User profile management',
      icon: 'User',
      path: '/profile',
      isActive: true,
      isVisible: true,
      orderIndex: 3,
      permissions: ['view', 'edit'] // No create/delete for profile
    },
    {
      moduleKey: 'support',
      moduleName: 'Support',
      description: 'Support tickets and help system',
      icon: 'LifeBuoy',
      path: '/support',
      isActive: true,
      isVisible: true,
      orderIndex: 4,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'tenant-management',
      moduleName: 'Tenant Management',
      description: 'Manage tenants (Superadmin only)',
      icon: 'Building2',
      path: '/tenants',
      isActive: true,
      isVisible: true,
      orderIndex: 5,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'roles-permissions',
      moduleName: 'Roles & Permissions',
      description: 'Manage roles and permissions',
      icon: 'Shield',
      path: '/roles',
      isActive: true,
      isVisible: true,
      orderIndex: 6,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'reports-analytics',
      moduleName: 'Reports & Analytics',
      description: 'Generate reports and view analytics',
      icon: 'BarChart3',
      path: '/reports',
      isActive: true,
      isVisible: true,
      orderIndex: 7,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'audit-logs',
      moduleName: 'Audit Logs',
      description: 'View system audit logs',
      icon: 'Activity',
      path: '/audit',
      isActive: true,
      isVisible: true,
      orderIndex: 8,
      permissions: ['view'] // Only view permission
    },
    {
      moduleKey: 'notifications',
      moduleName: 'Notifications',
      description: 'Manage notifications',
      icon: 'Bell',
      path: '/notifications',
      isActive: true,
      isVisible: true,
      orderIndex: 9,
      permissions: ['view'] // Only view permission
    },
    {
      moduleKey: 'menu-management',
      moduleName: 'Menu Management',
      description: 'Manage application menus (Superadmin only)',
      icon: 'Menu',
      path: '/menu',
      isActive: true,
      isVisible: true,
      orderIndex: 10,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'content-management',
      moduleName: 'Content Management',
      description: 'Manage content and pages',
      icon: 'FileText',
      path: '/content',
      isActive: true,
      isVisible: true,
      orderIndex: 11,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'backup-restore',
      moduleName: 'Backup & Restore',
      description: 'System backup and restore (Superadmin only)',
      icon: 'Database',
      path: '/backup',
      isActive: true,
      isVisible: true,
      orderIndex: 12,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      moduleKey: 'analytics',
      moduleName: 'Analytics',
      description: 'Advanced analytics and insights',
      icon: 'TrendingUp',
      path: '/analytics',
      isActive: true,
      isVisible: true,
      orderIndex: 13, // Last position as requested
      permissions: ['view', 'create', 'edit', 'delete']
    }
  ];

  for (const moduleData of modules) {
    await prisma.module.create({
      data: {
        moduleKey: moduleData.moduleKey,
        moduleName: moduleData.moduleName,
        description: moduleData.description,
        icon: moduleData.icon,
        path: moduleData.path,
        isActive: moduleData.isActive,
        isVisible: moduleData.isVisible,
        orderIndex: moduleData.orderIndex
      }
    });
  }
  
  console.log(`✅ Created ${modules.length} modules`);
}

async function createSuperAdmins() {
  console.log('👑 Creating superadmins...');
  
  const superAdmins = [
    {
      email: 'superadmin1@system.com',
      name: 'Super Admin One',
      password: 'SuperAdmin123!',
      contactNumber: '+1234567890'
    },
    {
      email: 'superadmin2@system.com',
      name: 'Super Admin Two',
      password: 'SuperAdmin123!',
      contactNumber: '+1234567891'
    }
  ];

  for (const adminData of superAdmins) {
    const hashedPassword = await bcrypt.hash(adminData.password, 12);
    await prisma.superAdmin.create({
      data: {
        email: adminData.email,
        name: adminData.name,
        password: hashedPassword,
        contactNumber: adminData.contactNumber,
        isActive: true
      }
    });
  }
  
  console.log(`✅ Created ${superAdmins.length} superadmins`);
}

async function createTenants() {
  console.log('🏢 Creating tenants...');
  
  const tenants = [
    {
      name: 'TechCorp Solutions',
      slug: 'techcorp-solutions',
      domain: 'techcorp.com',
      description: 'Technology solutions company',
      region: 'US East',
      plan: 'enterprise'
    },
    {
      name: 'Global Retail Inc',
      slug: 'global-retail',
      domain: 'globalretail.com',
      description: 'International retail corporation',
      region: 'Europe',
      plan: 'premium'
    }
  ];

  const createdTenants = [];
  for (const tenantData of tenants) {
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantData.name,
        slug: tenantData.slug,
        domain: tenantData.domain,
        description: tenantData.description,
        region: tenantData.region,
        plan: tenantData.plan,
        isActive: true,
        features: JSON.stringify(['dashboard', 'user-management', 'support', 'reports-analytics', 'audit-logs', 'notifications', 'content-management'])
      }
    });
    createdTenants.push(tenant);
  }
  
  console.log(`✅ Created ${tenants.length} tenants`);
  return createdTenants;
}

async function createRoles(tenants) {
  console.log('🛡️ Creating roles...');
  
  const roles = [];
  
  // Superadmin roles (global)
  const superadminRoles = [
    {
      name: 'System Administrator',
      description: 'Full system access with all permissions',
      isGlobal: true,
      tenantId: null
    },
    {
      name: 'Superadmin Manager',
      description: 'Superadmin with limited system management',
      isGlobal: true,
      tenantId: null
    }
  ];

  for (const roleData of superadminRoles) {
    const role = await prisma.role.create({
      data: roleData
    });
    roles.push(role);
  }

  // Tenant-specific roles
  for (const tenant of tenants) {
    const tenantRoles = [
      {
        name: `${tenant.name} Administrator`,
        description: 'Full tenant access with all permissions',
        isGlobal: false,
        tenantId: tenant.id
      },
      {
        name: `${tenant.name} Manager`,
        description: 'Tenant management with limited permissions',
        isGlobal: false,
        tenantId: tenant.id
      },
      {
        name: `${tenant.name} User`,
        description: 'Basic tenant user with limited access',
        isGlobal: false,
        tenantId: tenant.id
      }
    ];

    for (const roleData of tenantRoles) {
      const role = await prisma.role.create({
        data: roleData
      });
      roles.push(role);
    }
  }
  
  console.log(`✅ Created ${roles.length} roles`);
  return roles;
}

async function createRolePermissions(roles) {
  console.log('🔐 Creating role permissions...');
  
  // Get all modules
  const modules = await prisma.module.findMany();
  
  for (const role of roles) {
    const permissions = [];
    
    if (role.isGlobal) {
      // Superadmin roles - full access to all modules
      for (const module of modules) {
        permissions.push({
          roleId: role.id,
          moduleKey: module.moduleKey,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canViewAll: true
        });
      }
    } else {
      // Tenant roles - limited access based on role type
      const roleName = role.name.toLowerCase();
      
      if (roleName.includes('administrator')) {
        // Tenant Administrator - full access to tenant modules
        const tenantModules = ['dashboard', 'user-management', 'profile', 'support', 'roles-permissions', 'reports-analytics', 'audit-logs', 'notifications', 'content-management'];
        
        for (const moduleKey of tenantModules) {
          const module = modules.find(m => m.moduleKey === moduleKey);
          if (module) {
            permissions.push({
              roleId: role.id,
              moduleKey: module.moduleKey,
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              canViewAll: true
            });
          }
        }
      } else if (roleName.includes('manager')) {
        // Tenant Manager - moderate access
        const managerModules = ['dashboard', 'user-management', 'profile', 'support', 'reports-analytics', 'audit-logs', 'notifications'];
        
        for (const moduleKey of managerModules) {
          const module = modules.find(m => m.moduleKey === moduleKey);
          if (module) {
            permissions.push({
              roleId: role.id,
              moduleKey: module.moduleKey,
              canCreate: moduleKey === 'support' || moduleKey === 'user-management',
              canRead: true,
              canUpdate: moduleKey === 'support' || moduleKey === 'user-management',
              canDelete: false,
              canViewAll: true
            });
          }
        }
      } else {
        // Tenant User - basic access
        const userModules = ['dashboard', 'profile', 'support', 'notifications'];
        
        for (const moduleKey of userModules) {
          const module = modules.find(m => m.moduleKey === moduleKey);
          if (module) {
            permissions.push({
              roleId: role.id,
              moduleKey: module.moduleKey,
              canCreate: moduleKey === 'support',
              canRead: true,
              canUpdate: moduleKey === 'profile',
              canDelete: false,
              canViewAll: moduleKey === 'dashboard' || moduleKey === 'notifications'
            });
          }
        }
      }
    }
    
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions
      });
    }
  }
  
  console.log('✅ Created role permissions');
}

async function createUsers(tenants, roles) {
  console.log('👥 Creating users...');
  
  const users = [];
  
  // Create users for each tenant
  for (const tenant of tenants) {
    const tenantRoles = roles.filter(r => r.tenantId === tenant.id);
    const adminRole = tenantRoles.find(r => r.name.includes('Administrator'));
    const managerRole = tenantRoles.find(r => r.name.includes('Manager'));
    const userRole = tenantRoles.find(r => r.name.includes('User'));
    
    const tenantUsers = [
      {
        email: `admin@${tenant.slug}.com`,
        name: `${tenant.name} Admin`,
        password: 'Admin123!',
        roleId: adminRole?.id
      },
      {
        email: `manager@${tenant.slug}.com`,
        name: `${tenant.name} Manager`,
        password: 'Manager123!',
        roleId: managerRole?.id
      },
      {
        email: `user@${tenant.slug}.com`,
        name: `${tenant.name} User`,
        password: 'User123!',
        roleId: userRole?.id
      }
    ];

    for (const userData of tenantUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          tenantId: tenant.id,
          isActive: true
        }
      });
      
      // Assign role to user
      if (userData.roleId) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: userData.roleId
          }
        });
      }
      
      users.push(user);
    }
  }
  
  console.log(`✅ Created ${users.length} users`);
}

async function createTenantModules(tenants) {
  console.log('🔧 Creating tenant modules...');
  
  const modules = await prisma.module.findMany();
  
  for (const tenant of tenants) {
    const tenantModules = [];
    
    // Different modules for different tenants
    if (tenant.slug === 'techcorp-solutions') {
      // TechCorp gets more technical modules
      const techModules = ['dashboard', 'user-management', 'profile', 'support', 'roles-permissions', 'reports-analytics', 'audit-logs', 'notifications', 'content-management', 'analytics'];
      
      for (const moduleKey of techModules) {
        const module = modules.find(m => m.moduleKey === moduleKey);
        if (module) {
          tenantModules.push({
            tenantId: tenant.id,
            moduleKey: module.moduleKey,
            isEnabled: true,
            isVisible: true
          });
        }
      }
    } else {
      // Global Retail gets standard modules
      const retailModules = ['dashboard', 'user-management', 'profile', 'support', 'reports-analytics', 'audit-logs', 'notifications', 'content-management'];
      
      for (const moduleKey of retailModules) {
        const module = modules.find(m => m.moduleKey === moduleKey);
        if (module) {
          tenantModules.push({
            tenantId: tenant.id,
            moduleKey: module.moduleKey,
            isEnabled: true,
            isVisible: true
          });
        }
      }
    }
    
    if (tenantModules.length > 0) {
      await prisma.tenantModule.createMany({
        data: tenantModules
      });
    }
  }
  
  console.log('✅ Created tenant modules');
}

async function main() {
  try {
    console.log('🚀 Starting data reset and seeding...\n');
    
    await clearAllData();
    await createModules();
    await createSuperAdmins();
    const tenants = await createTenants();
    const roles = await createRoles(tenants);
    await createRolePermissions(roles);
    await createUsers(tenants, roles);
    await createTenantModules(tenants);
    
    console.log('\n🎉 Data reset and seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- 2 Superadmins created');
    console.log('- 2 Tenants created');
    console.log('- 13 Modules created with new structure');
    console.log('- 8 Roles created (2 global, 6 tenant-specific)');
    console.log('- 6 Users created (3 per tenant)');
    console.log('- Role permissions configured');
    console.log('- Tenant modules configured');
    
    console.log('\n🔑 Login Credentials:');
    console.log('Superadmins:');
    console.log('- superadmin1@system.com / SuperAdmin123!');
    console.log('- superadmin2@system.com / SuperAdmin123!');
    console.log('\nTenant Users:');
    console.log('- admin@techcorp-solutions.com / Admin123!');
    console.log('- manager@techcorp-solutions.com / Manager123!');
    console.log('- user@techcorp-solutions.com / User123!');
    console.log('- admin@global-retail.com / Admin123!');
    console.log('- manager@global-retail.com / Manager123!');
    console.log('- user@global-retail.com / User123!');
    
  } catch (error) {
    console.error('❌ Error during data reset and seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
