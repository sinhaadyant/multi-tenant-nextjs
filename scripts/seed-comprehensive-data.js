const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function seedComprehensiveData() {
  try {
    console.log('Starting comprehensive data seeding...');

    // 1. Create SuperAdmin
    console.log('Creating SuperAdmin...');
    const superAdminPassword = await hashPassword('AdminPass123');
    const superAdmin = await prisma.superAdmin.upsert({
      where: { email: 'admin@superadmin.com' },
      update: {},
      create: {
        email: 'admin@superadmin.com',
        name: 'Super Administrator',
        password: superAdminPassword,
        isActive: true,
        contactNumber: '+1-555-0123',
        avatar: null
      }
    });
    console.log('SuperAdmin created:', superAdmin.email);

    // 2. Create Tenants
    console.log('Creating Tenants...');
    const tenants = await Promise.all([
      prisma.tenant.upsert({
        where: { slug: 'techcorp' },
        update: {},
        create: {
          name: 'TechCorp Solutions',
          slug: 'techcorp',
          domain: 'techcorp.com',
          description: 'Leading technology solutions provider',
          isActive: true,
          plan: 'enterprise',
          region: 'US East',
          features: JSON.stringify(['dashboard', 'users', 'roles', 'modules', 'audit', 'support', 'notifications', 'settings']),
          metadata: JSON.stringify({ industry: 'Technology', size: '500+ employees' })
        }
      }),
      prisma.tenant.upsert({
        where: { slug: 'globalretail' },
        update: {},
        create: {
          name: 'Global Retail Inc',
          slug: 'globalretail',
          domain: 'globalretail.com',
          description: 'International retail chain',
          isActive: true,
          plan: 'professional',
          region: 'US West',
          features: JSON.stringify(['dashboard', 'users', 'roles', 'modules', 'audit', 'support', 'notifications', 'settings']),
          metadata: JSON.stringify({ industry: 'Retail', size: '1000+ employees' })
        }
      })
    ]);
    console.log('Tenants created:', tenants.map(t => t.name));

    // 3. Create Modules (if not exists)
    console.log('Creating Modules...');
    const modules = [
      { moduleKey: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', isActive: true, isVisible: true, orderIndex: 1 },
      { moduleKey: 'users', moduleName: 'User Management', path: '/users', icon: 'Users', isActive: true, isVisible: true, orderIndex: 2 },
      { moduleKey: 'roles', moduleName: 'Roles & Permissions', path: '/roles', icon: 'Shield', isActive: true, isVisible: true, orderIndex: 3 },
      { moduleKey: 'modules', moduleName: 'Module Management', path: '/modules', icon: 'Cog', isActive: true, isVisible: true, orderIndex: 4 },
      { moduleKey: 'audit', moduleName: 'Audit Logs', path: '/audit', icon: 'ClipboardList', isActive: true, isVisible: true, orderIndex: 5 },
      { moduleKey: 'support', moduleName: 'Support', path: '/support', icon: 'LifeBuoy', isActive: true, isVisible: true, orderIndex: 6 },
      { moduleKey: 'notifications', moduleName: 'Notifications', path: '/notifications', icon: 'Bell', isActive: true, isVisible: true, orderIndex: 7 },
      { moduleKey: 'settings', moduleName: 'Settings', path: '/settings', icon: 'Settings', isActive: true, isVisible: true, orderIndex: 8 }
    ];

    for (const moduleData of modules) {
      await prisma.module.upsert({
        where: { moduleKey: moduleData.moduleKey },
        update: {},
        create: moduleData
      });
    }
    console.log('Modules created/updated');

    // 4. Create Permissions
    console.log('Creating Permissions...');
    const permissions = [
      { name: 'dashboard:view', description: 'View dashboard', moduleKey: 'dashboard', action: 'view' },
      { name: 'notifications:view', description: 'View notifications', moduleKey: 'notifications', action: 'view' },
      { name: 'users:view', description: 'View users', moduleKey: 'users', action: 'view' },
      { name: 'users:create', description: 'Create users', moduleKey: 'users', action: 'create' },
      { name: 'users:edit', description: 'Edit users', moduleKey: 'users', action: 'edit' },
      { name: 'users:delete', description: 'Delete users', moduleKey: 'users', action: 'delete' },
      { name: 'roles:view', description: 'View roles', moduleKey: 'roles', action: 'view' },
      { name: 'roles:create', description: 'Create roles', moduleKey: 'roles', action: 'create' },
      { name: 'roles:edit', description: 'Edit roles', moduleKey: 'roles', action: 'edit' },
      { name: 'roles:delete', description: 'Delete roles', moduleKey: 'roles', action: 'delete' },
      { name: 'modules:view', description: 'View modules', moduleKey: 'modules', action: 'view' },
      { name: 'modules:edit', description: 'Edit modules', moduleKey: 'modules', action: 'edit' },
      { name: 'audit:view', description: 'View audit logs', moduleKey: 'audit', action: 'view' },
      { name: 'settings:view', description: 'View settings', moduleKey: 'settings', action: 'view' },
      { name: 'settings:edit', description: 'Edit settings', moduleKey: 'settings', action: 'edit' },
      { name: 'support:view', description: 'View support', moduleKey: 'support', action: 'view' },
      { name: 'support:create', description: 'Create support tickets', moduleKey: 'support', action: 'create' },
      { name: 'support:edit', description: 'Edit support tickets', moduleKey: 'support', action: 'edit' }
    ];

    for (const permissionData of permissions) {
      await prisma.permission.upsert({
        where: { name: permissionData.name },
        update: {},
        create: permissionData
      });
    }
    console.log('Permissions created/updated');

    // 5. Create Tenant Modules
    console.log('Creating Tenant Modules...');
    for (const tenant of tenants) {
      for (const module of modules) {
        await prisma.tenantModule.upsert({
          where: { tenantId_moduleKey: { tenantId: tenant.id, moduleKey: module.moduleKey } },
          update: {},
          create: {
            tenantId: tenant.id,
            moduleKey: module.moduleKey,
            isEnabled: true,
            isVisible: true,
            enabledAt: new Date(),
            enabledBy: superAdmin.id
          }
        });
      }
    }
    console.log('Tenant Modules created/updated');

    // 6. Create Roles for each tenant
    console.log('Creating Roles...');
    const roleDefinitions = [
      { name: 'Admin', description: 'Full administrative access', color: '#dc2626', priority: 1 },
      { name: 'Manager', description: 'Management level access', color: '#ea580c', priority: 2 },
      { name: 'User', description: 'Standard user access', color: '#2563eb', priority: 3 },
      { name: 'Viewer', description: 'Read-only access', color: '#059669', priority: 4 }
    ];

    const createdRoles = [];
    for (const tenant of tenants) {
      for (const roleDef of roleDefinitions) {
        const role = await prisma.role.upsert({
          where: { name_tenantId: { name: roleDef.name, tenantId: tenant.id } },
          update: {},
          create: {
            name: roleDef.name,
            description: roleDef.description,
            isActive: true,
            isDefault: roleDef.name === 'User',
            tenantId: tenant.id,
            color: roleDef.color,
            priority: roleDef.priority,
            isSystem: true
          }
        });
        createdRoles.push(role);
      }
    }
    console.log('Roles created:', createdRoles.length);

    // 7. Assign permissions to roles
    console.log('Assigning permissions to roles...');
    const adminPermissions = permissions.map(p => p.name);
    const managerPermissions = [
      'dashboard:view', 'notifications:view', 'users:view', 'users:create', 'users:edit',
      'roles:view', 'modules:view', 'audit:view', 'settings:view', 'support:view', 'support:create', 'support:edit'
    ];
    const userPermissions = [
      'dashboard:view', 'notifications:view', 'support:view', 'support:create'
    ];
    const viewerPermissions = [
      'dashboard:view', 'notifications:view', 'support:view'
    ];

    for (const role of createdRoles) {
      let permissionsToAssign = [];
      if (role.name === 'Admin') permissionsToAssign = adminPermissions;
      else if (role.name === 'Manager') permissionsToAssign = managerPermissions;
      else if (role.name === 'User') permissionsToAssign = userPermissions;
      else if (role.name === 'Viewer') permissionsToAssign = viewerPermissions;

      for (const permissionName of permissionsToAssign) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }
    console.log('Permissions assigned to roles');

    // 8. Create Users for each tenant
    console.log('Creating Users...');
    const userDefinitions = [
      { email: 'admin', name: 'Admin User', role: 'Admin' },
      { email: 'manager', name: 'Manager User', role: 'Manager' },
      { email: 'user', name: 'Standard User', role: 'User' },
      { email: 'viewer', name: 'Viewer User', role: 'Viewer' }
    ];

    const createdUsers = [];
    for (const tenant of tenants) {
      for (const userDef of userDefinitions) {
        const userPassword = await hashPassword('AdminPass123');
        const user = await prisma.user.upsert({
          where: { email_tenantId: { email: `${userDef.email}@${tenant.slug}.com`, tenantId: tenant.id } },
          update: {},
          create: {
            email: `${userDef.email}@${tenant.slug}.com`,
            name: `${userDef.name} (${tenant.name})`,
            password: userPassword,
            isActive: true,
            tenantId: tenant.id,
            contactNumber: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`
          }
        });
        createdUsers.push(user);

        // Assign role to user
        const role = createdRoles.find(r => r.name === userDef.role && r.tenantId === tenant.id);
        if (role) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
            update: {},
            create: {
              userId: user.id,
              roleId: role.id,
              assignedBy: superAdmin.id
            }
          });
        }
      }
    }
    console.log('Users created:', createdUsers.length);

    // 9. Create Notifications
    console.log('Creating Notifications...');
    const notifications = [
      {
        title: 'Welcome to the Platform',
        message: 'Welcome to our multi-tenant platform! We\'re excited to have you on board.',
        type: 'info',
        priority: 'medium',
        targetType: 'superadmin',
        status: 'sent',
        sentAt: new Date()
      },
      {
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance will occur on Sunday at 2 AM EST. Expected downtime: 30 minutes.',
        type: 'warning',
        priority: 'high',
        targetType: 'superadmin',
        status: 'sent',
        sentAt: new Date()
      },
      {
        title: 'New Feature Available',
        message: 'Enhanced audit logging is now available. Check out the new features in the audit module.',
        type: 'success',
        priority: 'medium',
        targetType: 'superadmin',
        status: 'sent',
        sentAt: new Date()
      }
    ];

    for (const notificationData of notifications) {
      const notification = await prisma.notification.create({
        data: {
          ...notificationData,
          createdBy: superAdmin.id,
          createdByType: 'superadmin'
        }
      });

      // Create user notifications for all users
      for (const user of createdUsers) {
        await prisma.userNotification.create({
          data: {
            notificationId: notification.id,
            userId: user.id,
            tenantId: user.tenantId,
            isRead: Math.random() > 0.5, // Randomly mark some as read
            readAt: Math.random() > 0.5 ? new Date() : null
          }
        });
      }
    }
    console.log('Notifications created');

    // 10. Create Support Tickets
    console.log('Creating Support Tickets...');
    const supportTickets = [
      {
        title: 'Login Issues',
        description: 'Users are experiencing intermittent login problems. Need assistance.',
        category: 'technical',
        priority: 'high',
        status: 'open'
      },
      {
        title: 'Feature Request',
        description: 'Request for additional reporting capabilities in the dashboard.',
        category: 'feature',
        priority: 'medium',
        status: 'in_progress'
      },
      {
        title: 'User Account Setup',
        description: 'Need help setting up new user accounts with proper permissions.',
        category: 'account',
        priority: 'low',
        status: 'resolved'
      },
      {
        title: 'Performance Issues',
        description: 'Dashboard is loading slowly. Performance optimization needed.',
        category: 'technical',
        priority: 'high',
        status: 'open'
      }
    ];

    for (const ticketData of supportTickets) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const ticket = await prisma.supportTicket.create({
        data: {
          ...ticketData,
          tenantId: randomUser.tenantId,
          userId: randomUser.id
        }
      });

      // Add comments to tickets
      const comments = [
        {
          text: 'Thank you for reporting this issue. We are investigating.',
          commentedBy: superAdmin.id,
          commenterType: 'superadmin'
        },
        {
          text: 'This has been escalated to our technical team.',
          commentedBy: superAdmin.id,
          commenterType: 'superadmin'
        }
      ];

      for (const commentData of comments) {
        await prisma.supportTicketComment.create({
          data: {
            ...commentData,
            ticketId: ticket.id
          }
        });
      }
    }
    console.log('Support Tickets created');

    // 11. Create Audit Logs
    console.log('Creating Audit Logs...');
    const auditActions = [
      { action: 'user_login', resourceType: 'user', severity: 'info' },
      { action: 'user_created', resourceType: 'user', severity: 'info' },
      { action: 'role_assigned', resourceType: 'role', severity: 'info' },
      { action: 'permission_updated', resourceType: 'permission', severity: 'warning' },
      { action: 'module_enabled', resourceType: 'module', severity: 'info' },
      { action: 'support_ticket_created', resourceType: 'support', severity: 'info' }
    ];

    for (let i = 0; i < 50; i++) {
      const randomAction = auditActions[Math.floor(Math.random() * auditActions.length)];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      await prisma.auditLog.create({
        data: {
          action: randomAction.action,
          details: `Sample audit log entry ${i + 1}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: randomUser.tenantId,
          userId: randomUser.id,
          resourceType: randomAction.resourceType,
          severity: randomAction.severity,
          status: 'success',
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        }
      });
    }
    console.log('Audit Logs created');

    // 12. Create System Settings
    console.log('Creating System Settings...');
    const systemSettings = [
      { key: 'maintenance_mode', value: 'false' },
      { key: 'max_users_per_tenant', value: '1000' },
      { key: 'session_timeout_minutes', value: '30' },
      { key: 'password_policy_min_length', value: '8' },
      { key: 'enable_audit_logging', value: 'true' },
      { key: 'default_tenant_plan', value: 'starter' }
    ];

    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
    }
    console.log('System Settings created/updated');

    console.log('✅ Comprehensive data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- SuperAdmin: 1`);
    console.log(`- Tenants: ${tenants.length}`);
    console.log(`- Modules: ${modules.length}`);
    console.log(`- Permissions: ${permissions.length}`);
    console.log(`- Roles: ${createdRoles.length}`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log(`- Support Tickets: ${supportTickets.length}`);
    console.log(`- Audit Logs: 50`);
    console.log(`- System Settings: ${systemSettings.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  seedComprehensiveData()
    .then(() => {
      console.log('🎉 Data seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedComprehensiveData }; 