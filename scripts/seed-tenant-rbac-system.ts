import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hierarchical Permission Structure
const permissionTemplates = [
  // Dashboard Module
  {
    module: 'Dashboard',
    submodule: 'Overview',
    permissions: [
      { name: 'dashboard_overview_view', description: 'View dashboard overview', action: 'view' },
      { name: 'dashboard_overview_export', description: 'Export dashboard data', action: 'export' }
    ]
  },
  {
    module: 'Dashboard',
    submodule: 'Analytics',
    permissions: [
      { name: 'dashboard_analytics_view', description: 'View analytics dashboard', action: 'view' },
      { name: 'dashboard_analytics_create', description: 'Create custom analytics', action: 'create' },
      { name: 'dashboard_analytics_edit', description: 'Edit analytics configurations', action: 'edit' },
      { name: 'dashboard_analytics_delete', description: 'Delete analytics', action: 'delete' },
      { name: 'dashboard_analytics_export', description: 'Export analytics data', action: 'export' }
    ]
  },

  // Users Module
  {
    module: 'Users',
    submodule: 'Management',
    permissions: [
      { name: 'users_management_view', description: 'View user list and details', action: 'view' },
      { name: 'users_management_create', description: 'Create new users', action: 'create' },
      { name: 'users_management_edit', description: 'Edit user information', action: 'edit' },
      { name: 'users_management_delete', description: 'Delete users', action: 'delete' },
      { name: 'users_management_import', description: 'Import users from file', action: 'import' },
      { name: 'users_management_export', description: 'Export user data', action: 'export' }
    ]
  },
  {
    module: 'Users',
    submodule: 'Roles',
    permissions: [
      { name: 'users_roles_view', description: 'View user roles', action: 'view' },
      { name: 'users_roles_assign', description: 'Assign roles to users', action: 'assign' },
      { name: 'users_roles_revoke', description: 'Revoke roles from users', action: 'revoke' }
    ]
  },

  // Content Module
  {
    module: 'Content',
    submodule: 'News',
    permissions: [
      { name: 'content_news_view', description: 'View news articles', action: 'view' },
      { name: 'content_news_create', description: 'Create news articles', action: 'create' },
      { name: 'content_news_edit', description: 'Edit news articles', action: 'edit' },
      { name: 'content_news_delete', description: 'Delete news articles', action: 'delete' },
      { name: 'content_news_publish', description: 'Publish news articles', action: 'publish' },
      { name: 'content_news_import', description: 'Import news content', action: 'import' },
      { name: 'content_news_export', description: 'Export news content', action: 'export' }
    ]
  },
  {
    module: 'Content',
    submodule: 'Pages',
    permissions: [
      { name: 'content_pages_view', description: 'View pages', action: 'view' },
      { name: 'content_pages_create', description: 'Create pages', action: 'create' },
      { name: 'content_pages_edit', description: 'Edit pages', action: 'edit' },
      { name: 'content_pages_delete', description: 'Delete pages', action: 'delete' },
      { name: 'content_pages_publish', description: 'Publish pages', action: 'publish' }
    ]
  },
  {
    module: 'Content',
    submodule: 'Media',
    permissions: [
      { name: 'content_media_view', description: 'View media files', action: 'view' },
      { name: 'content_media_upload', description: 'Upload media files', action: 'upload' },
      { name: 'content_media_edit', description: 'Edit media metadata', action: 'edit' },
      { name: 'content_media_delete', description: 'Delete media files', action: 'delete' },
      { name: 'content_media_share', description: 'Share media files', action: 'share' }
    ]
  },

  // Settings Module
  {
    module: 'Settings',
    submodule: 'General',
    permissions: [
      { name: 'settings_general_view', description: 'View general settings', action: 'view' },
      { name: 'settings_general_edit', description: 'Edit general settings', action: 'edit' }
    ]
  },
  {
    module: 'Settings',
    submodule: 'Security',
    permissions: [
      { name: 'settings_security_view', description: 'View security settings', action: 'view' },
      { name: 'settings_security_edit', description: 'Edit security settings', action: 'edit' },
      { name: 'settings_security_2fa', description: 'Manage 2FA settings', action: 'manage' }
    ]
  },
  {
    module: 'Settings',
    submodule: 'Billing',
    permissions: [
      { name: 'settings_billing_view', description: 'View billing information', action: 'view' },
      { name: 'settings_billing_edit', description: 'Edit billing settings', action: 'edit' },
      { name: 'settings_billing_export', description: 'Export billing data', action: 'export' }
    ]
  },

  // Communication Module
  {
    module: 'Communication',
    submodule: 'Notifications',
    permissions: [
      { name: 'communication_notifications_view', description: 'View notifications', action: 'view' },
      { name: 'communication_notifications_send', description: 'Send notifications', action: 'send' },
      { name: 'communication_notifications_manage', description: 'Manage notification templates', action: 'manage' }
    ]
  },
  {
    module: 'Communication',
    submodule: 'Announcements',
    permissions: [
      { name: 'communication_announcements_view', description: 'View announcements', action: 'view' },
      { name: 'communication_announcements_create', description: 'Create announcements', action: 'create' },
      { name: 'communication_announcements_edit', description: 'Edit announcements', action: 'edit' },
      { name: 'communication_announcements_delete', description: 'Delete announcements', action: 'delete' }
    ]
  },

  // Support Module
  {
    module: 'Support',
    submodule: 'Tickets',
    permissions: [
      { name: 'support_tickets_view', description: 'View support tickets', action: 'view' },
      { name: 'support_tickets_create', description: 'Create support tickets', action: 'create' },
      { name: 'support_tickets_edit', description: 'Edit support tickets', action: 'edit' },
      { name: 'support_tickets_delete', description: 'Delete support tickets', action: 'delete' },
      { name: 'support_tickets_respond', description: 'Respond to tickets', action: 'respond' },
      { name: 'support_tickets_close', description: 'Close support tickets', action: 'close' }
    ]
  },

  // API Module
  {
    module: 'API',
    submodule: 'Access',
    permissions: [
      { name: 'api_access_view', description: 'View API access logs', action: 'view' },
      { name: 'api_access_manage', description: 'Manage API access', action: 'manage' }
    ]
  },
  {
    module: 'API',
    submodule: 'Keys',
    permissions: [
      { name: 'api_keys_view', description: 'View API keys', action: 'view' },
      { name: 'api_keys_create', description: 'Create API keys', action: 'create' },
      { name: 'api_keys_edit', description: 'Edit API keys', action: 'edit' },
      { name: 'api_keys_delete', description: 'Delete API keys', action: 'delete' }
    ]
  }
];

// SuperAdmin Role Templates (for tenant admins to import)
const roleTemplates = [
  {
    name: 'Tenant Administrator',
    description: 'Full access to all tenant features and user management',
    isTemplate: true,
    permissions: [
      // Dashboard
      'dashboard_overview_view', 'dashboard_overview_export',
      'dashboard_analytics_view', 'dashboard_analytics_create', 'dashboard_analytics_edit', 'dashboard_analytics_delete', 'dashboard_analytics_export',
      // Users
      'users_management_view', 'users_management_create', 'users_management_edit', 'users_management_delete', 'users_management_import', 'users_management_export',
      'users_roles_view', 'users_roles_assign', 'users_roles_revoke',
      // Content
      'content_news_view', 'content_news_create', 'content_news_edit', 'content_news_delete', 'content_news_publish', 'content_news_import', 'content_news_export',
      'content_pages_view', 'content_pages_create', 'content_pages_edit', 'content_pages_delete', 'content_pages_publish',
      'content_media_view', 'content_media_upload', 'content_media_edit', 'content_media_delete', 'content_media_share',
      // Settings
      'settings_general_view', 'settings_general_edit',
      'settings_security_view', 'settings_security_edit', 'settings_security_2fa',
      'settings_billing_view', 'settings_billing_edit', 'settings_billing_export',
      // Communication
      'communication_notifications_view', 'communication_notifications_send', 'communication_notifications_manage',
      'communication_announcements_view', 'communication_announcements_create', 'communication_announcements_edit', 'communication_announcements_delete',
      // Support
      'support_tickets_view', 'support_tickets_create', 'support_tickets_edit', 'support_tickets_delete', 'support_tickets_respond', 'support_tickets_close',
      // API
      'api_access_view', 'api_access_manage',
      'api_keys_view', 'api_keys_create', 'api_keys_edit', 'api_keys_delete'
    ]
  },
  {
    name: 'Content Manager',
    description: 'Can manage content, media, and communications',
    isTemplate: true,
    permissions: [
      // Dashboard
      'dashboard_overview_view', 'dashboard_analytics_view',
      // Content
      'content_news_view', 'content_news_create', 'content_news_edit', 'content_news_delete', 'content_news_publish', 'content_news_import', 'content_news_export',
      'content_pages_view', 'content_pages_create', 'content_pages_edit', 'content_pages_delete', 'content_pages_publish',
      'content_media_view', 'content_media_upload', 'content_media_edit', 'content_media_delete', 'content_media_share',
      // Communication
      'communication_notifications_view', 'communication_notifications_send',
      'communication_announcements_view', 'communication_announcements_create', 'communication_announcements_edit', 'communication_announcements_delete',
      // Basic user viewing
      'users_management_view'
    ]
  },
  {
    name: 'User Manager',
    description: 'Can manage users and assign roles within the tenant',
    isTemplate: true,
    permissions: [
      // Dashboard
      'dashboard_overview_view', 'dashboard_analytics_view',
      // Users
      'users_management_view', 'users_management_create', 'users_management_edit', 'users_management_delete', 'users_management_import', 'users_management_export',
      'users_roles_view', 'users_roles_assign', 'users_roles_revoke',
      // Basic content viewing
      'content_news_view', 'content_pages_view'
    ]
  },
  {
    name: 'Analyst',
    description: 'Can view analytics, reports, and create dashboards',
    isTemplate: true,
    permissions: [
      // Dashboard
      'dashboard_overview_view', 'dashboard_overview_export',
      'dashboard_analytics_view', 'dashboard_analytics_create', 'dashboard_analytics_edit', 'dashboard_analytics_delete', 'dashboard_analytics_export',
      // Basic content viewing
      'content_news_view', 'content_pages_view',
      // Basic user viewing
      'users_management_view'
    ]
  },
  {
    name: 'Support Agent',
    description: 'Can handle support tickets and user communications',
    isTemplate: true,
    permissions: [
      // Support
      'support_tickets_view', 'support_tickets_create', 'support_tickets_edit', 'support_tickets_delete', 'support_tickets_respond', 'support_tickets_close',
      // Communication
      'communication_notifications_view', 'communication_notifications_send',
      'communication_announcements_view',
      // Basic user viewing
      'users_management_view',
      // Basic content viewing
      'content_news_view', 'content_pages_view'
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to tenant content and basic features',
    isTemplate: true,
    permissions: [
      // Dashboard
      'dashboard_overview_view',
      // Basic viewing permissions
      'users_management_view', 'content_news_view', 'content_pages_view', 'content_media_view',
      // Support
      'support_tickets_view', 'support_tickets_create'
    ]
  }
];

async function seedTenantRBACSystem() {
  try {
    console.log('🌱 Starting to seed Tenant RBAC System...');
    
    // Clear existing data
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    console.log('✅ Cleared existing RBAC data');

    // Create all permissions
    const allPermissions = [];
    for (const template of permissionTemplates) {
      for (const permission of template.permissions) {
        allPermissions.push({
          name: permission.name,
          description: permission.description,
          module: template.module,
          submodule: template.submodule,
          action: permission.action,
          isActive: true
        });
      }
    }

    const createdPermissions = await Promise.all(
      allPermissions.map(permission => prisma.permission.create({ data: permission }))
    );
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // Create role templates (SuperAdmin templates)
    for (const roleTemplate of roleTemplates) {
      const { permissions: permissionNames, ...roleInfo } = roleTemplate;
      
      const role = await prisma.role.create({ data: roleInfo });
      
      // Find permission IDs for this role template
      const permissionIds = await prisma.permission.findMany({
        where: { name: { in: permissionNames } },
        select: { id: true }
      });

      // Create role-permission relationships
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(p => ({ roleId: role.id, permissionId: p.id }))
        });
      }

      console.log(`✅ Created role template "${role.name}" with ${permissionIds.length} permissions`);
    }

    // Get statistics
    const totalRoles = await prisma.role.count();
    const totalPermissions = await prisma.permission.count();
    const totalRolePermissions = await prisma.rolePermission.count();

    console.log('\n📊 Seeding Summary:');
    console.log(`   Total Permissions: ${totalPermissions}`);
    console.log(`   Total Role Templates: ${totalRoles}`);
    console.log(`   Total Role-Permission Relationships: ${totalRolePermissions}`);

    console.log('\n🎯 Role Templates Summary:');
    for (const roleTemplate of roleTemplates) {
      console.log(`   • ${roleTemplate.name}: ${roleTemplate.permissions.length} permissions`);
    }

    console.log('\n📋 Permission Modules:');
    const modules = [...new Set(allPermissions.map(p => p.module))];
    modules.forEach(module => {
      const modulePermissions = allPermissions.filter(p => p.module === module);
      const submodules = [...new Set(modulePermissions.map(p => p.submodule))];
      console.log(`   • ${module}: ${modulePermissions.length} permissions (${submodules.join(', ')})`);
    });

    console.log('\n🎉 Successfully seeded Tenant RBAC System!');
    console.log('\n💡 Architecture Notes:');
    console.log('   • SuperAdmin has full access without permissions');
    console.log('   • Role templates are available for tenant admins to import');
    console.log('   • Each tenant will have their own isolated role schema');
    console.log('   • Users can have multiple roles within their tenant');

  } catch (error) {
    console.error('❌ Error seeding Tenant RBAC System:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTenantRBACSystem()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 