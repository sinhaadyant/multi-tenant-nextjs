import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAndSeedDatabase() {
  console.log('🔄 Starting database reset and seeding...');

  try {
    // Clear all data in reverse dependency order
    console.log('🗑️ Clearing existing data...');
    
    await prisma.auditLog.deleteMany({});
    await prisma.supportTicketCommentAttachment.deleteMany({});
    await prisma.supportTicketAttachment.deleteMany({});
    await prisma.supportTicketComment.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.inviteToken.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.superAdmin.deleteMany({});

    console.log('✅ All data cleared successfully');

    // Create SuperAdmin
    console.log('👑 Creating SuperAdmin...');
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email: 'admin@example.com',
        name: 'Super Administrator',
        password: await bcrypt.hash('admin123', 10),
        isActive: true,
        contactNumber: '+1234567890'
      }
    });
    console.log('✅ SuperAdmin created:', superAdmin.email);

    // Create modules first
    console.log('📦 Creating modules...');
    const modules = await prisma.module.createMany({
      data: [
        { moduleKey: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'dashboard', orderIndex: 1 },
        { moduleKey: 'users', moduleName: 'User Management', path: '/users', icon: 'users', orderIndex: 2 },
        { moduleKey: 'roles', moduleName: 'Role Management', path: '/roles', icon: 'roles', orderIndex: 3 },
        { moduleKey: 'reports', moduleName: 'Reports', path: '/reports', icon: 'reports', orderIndex: 4 },
        { moduleKey: 'settings', moduleName: 'Settings', path: '/settings', icon: 'settings', orderIndex: 5 },
        { moduleKey: 'audit', moduleName: 'Audit Logs', path: '/audit', icon: 'audit', orderIndex: 6 },
        { moduleKey: 'notifications', moduleName: 'Notifications', path: '/notifications', icon: 'notifications', orderIndex: 7 },
        { moduleKey: 'backup', moduleName: 'Backup & Restore', path: '/backup', icon: 'backup', orderIndex: 8 },
        { moduleKey: 'support', moduleName: 'Support', path: '/support', icon: 'support', orderIndex: 9 },
        { moduleKey: 'analytics', moduleName: 'Analytics', path: '/analytics', icon: 'analytics', orderIndex: 10 },
        { moduleKey: 'content', moduleName: 'Content Management', path: '/content', icon: 'content', orderIndex: 11 }
      ]
    });
    console.log('✅ Modules created:', modules.count);

    // Create permissions
    console.log('🔐 Creating permissions...');
    const permissions = await prisma.permission.createMany({
      data: [
        // Dashboard permissions
        { name: 'dashboard.view', description: 'View dashboard', moduleKey: 'dashboard', action: 'view' },
        { name: 'dashboard.manage', description: 'Manage dashboard', moduleKey: 'dashboard', action: 'manage' },
        
        // User management permissions
        { name: 'users.view', description: 'View users', moduleKey: 'users', action: 'view' },
        { name: 'users.create', description: 'Create users', moduleKey: 'users', action: 'create' },
        { name: 'users.edit', description: 'Edit users', moduleKey: 'users', action: 'edit' },
        { name: 'users.delete', description: 'Delete users', moduleKey: 'users', action: 'delete' },
        { name: 'users.manage', description: 'Manage users', moduleKey: 'users', action: 'manage' },
        
        // Role management permissions
        { name: 'roles.view', description: 'View roles', moduleKey: 'roles', action: 'view' },
        { name: 'roles.create', description: 'Create roles', moduleKey: 'roles', action: 'create' },
        { name: 'roles.edit', description: 'Edit roles', moduleKey: 'roles', action: 'edit' },
        { name: 'roles.delete', description: 'Delete roles', moduleKey: 'roles', action: 'delete' },
        { name: 'roles.manage', description: 'Manage roles', moduleKey: 'roles', action: 'manage' },
        
        // Reports permissions
        { name: 'reports.view', description: 'View reports', moduleKey: 'reports', action: 'view' },
        { name: 'reports.create', description: 'Create reports', moduleKey: 'reports', action: 'create' },
        { name: 'reports.edit', description: 'Edit reports', moduleKey: 'reports', action: 'edit' },
        { name: 'reports.delete', description: 'Delete reports', moduleKey: 'reports', action: 'delete' },
        
        // Settings permissions
        { name: 'settings.view', description: 'View settings', moduleKey: 'settings', action: 'view' },
        { name: 'settings.edit', description: 'Edit settings', moduleKey: 'settings', action: 'edit' },
        { name: 'settings.manage', description: 'Manage settings', moduleKey: 'settings', action: 'manage' },
        
        // Audit permissions
        { name: 'audit.view', description: 'View audit logs', moduleKey: 'audit', action: 'view' },
        { name: 'audit.manage', description: 'Manage audit logs', moduleKey: 'audit', action: 'manage' },
        
        // Notifications permissions
        { name: 'notifications.view', description: 'View notifications', moduleKey: 'notifications', action: 'view' },
        { name: 'notifications.create', description: 'Create notifications', moduleKey: 'notifications', action: 'create' },
        { name: 'notifications.manage', description: 'Manage notifications', moduleKey: 'notifications', action: 'manage' },
        
        // Backup permissions
        { name: 'backup.view', description: 'View backups', moduleKey: 'backup', action: 'view' },
        { name: 'backup.create', description: 'Create backups', moduleKey: 'backup', action: 'create' },
        { name: 'backup.restore', description: 'Restore backups', moduleKey: 'backup', action: 'restore' },
        
        // Support permissions
        { name: 'support.view', description: 'View support tickets', moduleKey: 'support', action: 'view' },
        { name: 'support.create', description: 'Create support tickets', moduleKey: 'support', action: 'create' },
        { name: 'support.edit', description: 'Edit support tickets', moduleKey: 'support', action: 'edit' },
        { name: 'support.manage', description: 'Manage support tickets', moduleKey: 'support', action: 'manage' },
        
        // Analytics permissions
        { name: 'analytics.view', description: 'View analytics', moduleKey: 'analytics', action: 'view' },
        { name: 'analytics.manage', description: 'Manage analytics', moduleKey: 'analytics', action: 'manage' },
        
        // Content permissions
        { name: 'content.view', description: 'View content', moduleKey: 'content', action: 'view' },
        { name: 'content.create', description: 'Create content', moduleKey: 'content', action: 'create' },
        { name: 'content.edit', description: 'Edit content', moduleKey: 'content', action: 'edit' },
        { name: 'content.delete', description: 'Delete content', moduleKey: 'content', action: 'delete' },
        { name: 'content.manage', description: 'Manage content', moduleKey: 'content', action: 'manage' }
      ]
    });
    console.log('✅ Permissions created:', permissions.count);

    // Fetch created permissions for role assignment
    const allPermissions = await prisma.permission.findMany();

    // Create tenants
    console.log('🏢 Creating tenants...');
    const tenants = await Promise.all([
      prisma.tenant.create({
        data: {
          name: 'Acme Corporation',
          slug: 'acme',
          domain: 'acme.com',
          description: 'Leading technology solutions provider',
          isActive: true,
          plan: 'enterprise',
          region: 'US East',
          features: JSON.stringify(['advanced_analytics', 'custom_integrations', 'priority_support'])
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'TechStart Inc',
          slug: 'techstart',
          domain: 'techstart.io',
          description: 'Innovative startup in the tech industry',
          isActive: true,
          plan: 'professional',
          region: 'US West',
          features: JSON.stringify(['basic_analytics', 'api_access'])
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'Global Solutions Ltd',
          slug: 'globalsolutions',
          domain: 'globalsolutions.com',
          description: 'International consulting firm',
          isActive: true,
          plan: 'enterprise',
          region: 'EU Central',
          features: JSON.stringify(['advanced_analytics', 'multi_region', 'custom_integrations'])
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'Disabled Company',
          slug: 'disabled-company',
          domain: 'disabled.com',
          description: 'Suspended tenant for testing',
          isActive: false,
          plan: 'starter',
          region: 'US East',
          features: JSON.stringify(['basic_features'])
        }
      })
    ]);
    console.log('✅ Tenants created:', tenants.length);

    // Create template roles (global roles from SuperAdmin)
    console.log('🎭 Creating template roles...');
    const templateRoles = await Promise.all([
      prisma.role.create({
        data: {
          name: 'Admin Template',
          description: 'Full administrative access template',
          isTemplate: true,
          isActive: true,
          isDefault: false
        }
      }),
      prisma.role.create({
        data: {
          name: 'Manager Template',
          description: 'Management level access template',
          isTemplate: true,
        isActive: true,
          isDefault: false
        }
      }),
      prisma.role.create({
        data: {
          name: 'User Template',
          description: 'Standard user access template',
          isTemplate: true,
          isActive: true,
          isDefault: true
        }
      })
    ]);
    console.log('✅ Template roles created:', templateRoles.length);

    // Create tenant-specific roles
    console.log('🎭 Creating tenant-specific roles...');
    const tenantRoles = await Promise.all([
      // Acme Corporation roles
      prisma.role.create({
        data: {
          name: 'Acme Admin',
          description: 'Administrator for Acme Corporation',
          isTemplate: false,
          isActive: true,
          isDefault: false,
          tenantId: tenants[0].id
        }
      }),
      prisma.role.create({
        data: {
          name: 'Acme Manager',
          description: 'Manager for Acme Corporation',
          isTemplate: false,
          isActive: true,
          isDefault: false,
          tenantId: tenants[0].id
        }
      }),
      prisma.role.create({
        data: {
          name: 'Acme User',
          description: 'Standard user for Acme Corporation',
          isTemplate: false,
          isActive: true,
          isDefault: true,
          tenantId: tenants[0].id
        }
      }),

      // TechStart Inc roles
      prisma.role.create({
        data: {
          name: 'TechStart Admin',
          description: 'Administrator for TechStart Inc',
          isTemplate: false,
          isActive: true,
          isDefault: false,
          tenantId: tenants[1].id
        }
      }),
      prisma.role.create({
        data: {
          name: 'TechStart Developer',
          description: 'Developer role for TechStart Inc',
          isTemplate: false,
          isActive: true,
          isDefault: false,
          tenantId: tenants[1].id
        }
      }),

      // Global Solutions roles
      prisma.role.create({
        data: {
          name: 'Global Admin',
          description: 'Administrator for Global Solutions',
          isTemplate: false,
          isActive: true,
          isDefault: false,
          tenantId: tenants[2].id
        }
      }),
      prisma.role.create({
        data: {
          name: 'Global Consultant',
          description: 'Consultant role for Global Solutions',
          isTemplate: false,
          isActive: true,
          isDefault: false,
          tenantId: tenants[2].id
        }
      })
    ]);
    console.log('✅ Tenant-specific roles created:', tenantRoles.length);

    // Assign permissions to template roles
    console.log('🔗 Assigning permissions to template roles...');
    
    // Admin Template - all permissions
    const adminTemplate = templateRoles[0];
    const adminPermissions = allPermissions.map(p => ({
      roleId: adminTemplate.id,
      permissionId: p.id
    }));
    await prisma.rolePermission.createMany({ data: adminPermissions });

    // Manager Template - management permissions
    const managerTemplate = templateRoles[1];
    const managerPermissions = allPermissions
      .filter(p => !p.action.includes('delete') && p.module !== 'settings')
      .map(p => ({
        roleId: managerTemplate.id,
        permissionId: p.id
      }));
    await prisma.rolePermission.createMany({ data: managerPermissions });

    // User Template - basic permissions
    const userTemplate = templateRoles[2];
    const userPermissions = allPermissions
      .filter(p => p.action === 'view' && ['dashboard', 'content', 'reports'].includes(p.module))
      .map(p => ({
        roleId: userTemplate.id,
        permissionId: p.id
      }));
    await prisma.rolePermission.createMany({ data: userPermissions });

    // Assign permissions to tenant-specific roles
    console.log('🔗 Assigning permissions to tenant-specific roles...');
    
    // Acme Admin - all permissions
    const acmeAdmin = tenantRoles[0];
    const acmeAdminPermissions = allPermissions.map(p => ({
      roleId: acmeAdmin.id,
      permissionId: p.id
    }));
    await prisma.rolePermission.createMany({ data: acmeAdminPermissions });

    // Acme Manager - management permissions
    const acmeManager = tenantRoles[1];
    const acmeManagerPermissions = allPermissions
      .filter(p => !p.action.includes('delete') && p.module !== 'settings')
      .map(p => ({
        roleId: acmeManager.id,
        permissionId: p.id
      }));
    await prisma.rolePermission.createMany({ data: acmeManagerPermissions });

    // Acme User - basic permissions
    const acmeUser = tenantRoles[2];
    const acmeUserPermissions = allPermissions
      .filter(p => p.action === 'view' && ['dashboard', 'content', 'reports'].includes(p.module))
      .map(p => ({
        roleId: acmeUser.id,
        permissionId: p.id
      }));
    await prisma.rolePermission.createMany({ data: acmeUserPermissions });

    // TechStart Admin - all permissions
    const techStartAdmin = tenantRoles[3];
    const techStartAdminPermissions = allPermissions.map(p => ({
      roleId: techStartAdmin.id,
      permissionId: p.id
    }));
    await prisma.rolePermission.createMany({ data: techStartAdminPermissions });

    // TechStart Developer - development permissions
    const techStartDeveloper = tenantRoles[4];
    const developerPermissions = allPermissions
      .filter(p => ['dashboard', 'content', 'analytics', 'reports'].includes(p.module))
      .map(p => ({
        roleId: techStartDeveloper.id,
        permissionId: p.id
      }));
    await prisma.rolePermission.createMany({ data: developerPermissions });

    // Global Admin - all permissions
    const globalAdmin = tenantRoles[5];
    const globalAdminPermissions = allPermissions.map(p => ({
      roleId: globalAdmin.id,
      permissionId: p.id
    }));
    await prisma.rolePermission.createMany({ data: globalAdminPermissions });

    // Global Consultant - consulting permissions
    const globalConsultant = tenantRoles[6];
    const consultantPermissions = allPermissions
      .filter(p => ['dashboard', 'reports', 'analytics', 'content'].includes(p.module))
      .map(p => ({
        roleId: globalConsultant.id,
        permissionId: p.id
      }));
    await prisma.rolePermission.createMany({ data: consultantPermissions });

    console.log('✅ Permissions assigned to roles');

    // Create users
    console.log('👥 Creating users...');
    const users = await Promise.all([
      // Acme Corporation users
      prisma.user.create({
        data: {
          name: 'John Smith',
          email: 'admin@acme.com',
          password: await bcrypt.hash('admin123', 10),
          isActive: true,
          tenantId: tenants[0].id,
          contactNumber: '+12345678901',
          lastLogin: new Date()
        }
      }),
      prisma.user.create({
        data: {
          name: 'Sarah Johnson',
          email: 'manager@acme.com',
          password: await bcrypt.hash('manager123', 10),
          isActive: true,
          tenantId: tenants[0].id,
          contactNumber: '+12345678902',
          lastLogin: new Date()
        }
      }),
      prisma.user.create({
        data: {
          name: 'Mike Wilson',
          email: 'user@acme.com',
          password: await bcrypt.hash('user123', 10),
          isActive: true,
          tenantId: tenants[0].id,
          contactNumber: '+12345678903',
          lastLogin: new Date()
        }
      }),
      prisma.user.create({
        data: {
          name: 'Disabled User',
          email: 'disabled@acme.com',
          password: await bcrypt.hash('user123', 10),
          isActive: false,
          tenantId: tenants[0].id,
          contactNumber: '+12345678904'
        }
      }),

      // TechStart Inc users
      prisma.user.create({
        data: {
          name: 'Alex Chen',
          email: 'admin@techstart.io',
          password: await bcrypt.hash('admin123', 10),
          isActive: true,
          tenantId: tenants[1].id,
          contactNumber: '+12345678905',
          lastLogin: new Date()
        }
      }),
      prisma.user.create({
        data: {
          name: 'Emily Davis',
          email: 'developer@techstart.io',
          password: await bcrypt.hash('dev123', 10),
          isActive: true,
          tenantId: tenants[1].id,
          contactNumber: '+12345678906',
          lastLogin: new Date()
        }
      }),

      // Global Solutions users
      prisma.user.create({
        data: {
          name: 'Maria Rodriguez',
          email: 'admin@globalsolutions.com',
          password: await bcrypt.hash('admin123', 10),
          isActive: true,
          tenantId: tenants[2].id,
          contactNumber: '+12345678907',
          lastLogin: new Date()
        }
      }),
      prisma.user.create({
        data: {
          name: 'David Brown',
          email: 'consultant@globalsolutions.com',
          password: await bcrypt.hash('consultant123', 10),
          isActive: true,
          tenantId: tenants[2].id,
          contactNumber: '+12345678908',
          lastLogin: new Date()
        }
      })
    ]);
    console.log('✅ Users created:', users.length);

    // Assign roles to users
    console.log('🔗 Assigning roles to users...');
    const userRoles = await Promise.all([
      // Acme users
      prisma.userRole.create({
        data: {
          userId: users[0].id, // admin@acme.com
          roleId: tenantRoles[0].id, // Acme Admin
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[1].id, // manager@acme.com
          roleId: tenantRoles[1].id, // Acme Manager
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[2].id, // user@acme.com
          roleId: tenantRoles[2].id, // Acme User
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[3].id, // disabled@acme.com
          roleId: tenantRoles[2].id, // Acme User
          assignedBy: superAdmin.id
        }
      }),

      // TechStart users
      prisma.userRole.create({
        data: {
          userId: users[4].id, // admin@techstart.io
          roleId: tenantRoles[3].id, // TechStart Admin
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[5].id, // developer@techstart.io
          roleId: tenantRoles[4].id, // TechStart Developer
          assignedBy: superAdmin.id
        }
      }),

      // Global Solutions users
      prisma.userRole.create({
        data: {
          userId: users[6].id, // admin@globalsolutions.com
          roleId: tenantRoles[5].id, // Global Admin
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[7].id, // consultant@globalsolutions.com
          roleId: tenantRoles[6].id, // Global Consultant
          assignedBy: superAdmin.id
        }
      })
    ]);
    console.log('✅ User roles assigned:', userRoles.length);

    // Create some sample audit logs
    console.log('📝 Creating sample audit logs...');
    const auditLogs = await Promise.all([
      prisma.auditLog.create({
        data: {
          action: 'user.login',
          details: 'User logged in successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          userId: users[0].id,
          tenantId: tenants[0].id
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'role.create',
          details: 'New role "Content Manager" created',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          userId: users[0].id,
          tenantId: tenants[0].id
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'user.create',
          details: 'New user "Jane Doe" created',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          userId: users[4].id,
          tenantId: tenants[1].id
        }
      })
    ]);
    console.log('✅ Sample audit logs created:', auditLogs.length);

    // Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          title: 'Welcome to Acme Corporation',
          message: 'Your account has been successfully created. Welcome to the team!',
          priority: 'medium',
          targetType: 'tenant',
          targetTenantId: tenants[0].id,
          createdBy: superAdmin.id
        }
      }),
      prisma.notification.create({
        data: {
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur on Sunday at 2 AM EST.',
          priority: 'high',
          targetType: 'superadmin',
          createdBy: superAdmin.id
        }
      })
    ]);
    console.log('✅ Sample notifications created:', notifications.length);

    // Create sample support tickets
    console.log('🎫 Creating sample support tickets...');
    const supportTickets = await Promise.all([
      prisma.supportTicket.create({
        data: {
          title: 'Login Issue',
          description: 'Unable to login to the system. Getting "Invalid credentials" error.',
          category: 'technical',
          status: 'open',
          priority: 'high',
          userId: users[2].id,
          tenantId: tenants[0].id
        }
      }),
      prisma.supportTicket.create({
        data: {
          title: 'Feature Request',
          description: 'Would like to request additional reporting features for analytics.',
          category: 'feature',
          status: 'open',
          priority: 'medium',
          userId: users[5].id,
          tenantId: tenants[1].id
        }
      })
    ]);
    console.log('✅ Sample support tickets created:', supportTickets.length);

    // Create sample reports
    console.log('📊 Creating sample reports...');
    const reports = await Promise.all([
      prisma.report.create({
        data: {
          name: 'User Activity Report',
          type: 'analytics',
          data: JSON.stringify({
            totalUsers: 150,
            activeUsers: 120,
            newUsers: 25,
            period: 'last_30_days'
          }),
          tenantId: tenants[0].id
        }
      }),
      prisma.report.create({
        data: {
          name: 'System Performance Report',
          type: 'system',
          data: JSON.stringify({
            uptime: 99.9,
            responseTime: 250,
            errorRate: 0.1,
            period: 'last_24_hours'
          }),
          superAdminId: superAdmin.id
        }
      })
    ]);
    console.log('✅ Sample reports created:', reports.length);

    console.log('\n🎉 Database reset and seeding completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log(`├── SuperAdmin: admin@example.com / admin123`);
    console.log(`├── Tenants: ${tenants.length} (including 1 disabled)`);
    console.log(`├── Template Roles: ${templateRoles.length}`);
    console.log(`├── Tenant Roles: ${tenantRoles.length}`);
    console.log(`├── Users: ${users.length} (including 1 disabled)`);
    console.log(`├── Permissions: ${allPermissions.length}`);
    console.log(`└── Sample Data: Audit logs, Notifications, Support tickets, Reports`);

    console.log('\n🔗 Test URLs:');
    console.log('├── SuperAdmin Login: http://localhost:3000/superadmin/login');
    console.log('├── Acme Login: http://localhost:3000/acme/login');
    console.log('├── TechStart Login: http://localhost:3000/techstart/login');
    console.log('└── Global Solutions Login: http://localhost:3000/globalsolutions/login');

    console.log('\n👤 Test Credentials:');
    console.log('├── SuperAdmin: admin@example.com / admin123');
    console.log('├── Acme Admin: admin@acme.com / admin123');
    console.log('├── Acme Manager: manager@acme.com / manager123');
    console.log('├── Acme User: user@acme.com / user123');
    console.log('├── Acme Disabled: disabled@acme.com / user123');
    console.log('├── TechStart Admin: admin@techstart.io / admin123');
    console.log('├── TechStart Developer: developer@techstart.io / dev123');
    console.log('├── Global Admin: admin@globalsolutions.com / admin123');
    console.log('└── Global Consultant: consultant@globalsolutions.com / consultant123');

  } catch (error) {
    console.error('❌ Error during database reset and seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetAndSeedDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 