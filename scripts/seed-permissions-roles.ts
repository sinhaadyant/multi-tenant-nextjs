import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define permissions that tenant users can have
const permissions = [
  // User Management (within tenant)
  { name: 'can_view_users', description: 'Can view user list and details within tenant', module: 'users', action: 'read' },
  { name: 'can_create_users', description: 'Can create new users within tenant', module: 'users', action: 'create' },
  { name: 'can_edit_users', description: 'Can edit user details within tenant', module: 'users', action: 'update' },
  { name: 'can_delete_users', description: 'Can delete users within tenant', module: 'users', action: 'delete' },
  { name: 'can_assign_roles', description: 'Can assign roles to users within tenant', module: 'users', action: 'assign_role' },

  // Tenant Settings (tenant-specific)
  { name: 'can_view_tenant_settings', description: 'Can view tenant settings', module: 'tenant', action: 'read' },
  { name: 'can_edit_tenant_settings', description: 'Can edit tenant settings', module: 'tenant', action: 'update' },
  { name: 'can_manage_tenant_billing', description: 'Can manage tenant billing and subscriptions', module: 'tenant', action: 'manage_billing' },

  // Content Management (tenant-specific)
  { name: 'can_view_content', description: 'Can view tenant content', module: 'content', action: 'read' },
  { name: 'can_create_content', description: 'Can create new content', module: 'content', action: 'create' },
  { name: 'can_edit_content', description: 'Can edit existing content', module: 'content', action: 'update' },
  { name: 'can_delete_content', description: 'Can delete content', module: 'content', action: 'delete' },
  { name: 'can_publish_content', description: 'Can publish content', module: 'content', action: 'publish' },

  // Analytics & Reports (tenant-specific)
  { name: 'can_view_analytics', description: 'Can view tenant analytics and reports', module: 'analytics', action: 'read' },
  { name: 'can_export_reports', description: 'Can export reports and data', module: 'analytics', action: 'export' },
  { name: 'can_manage_dashboards', description: 'Can create and manage dashboards', module: 'analytics', action: 'manage_dashboards' },

  // Communication (tenant-specific)
  { name: 'can_send_notifications', description: 'Can send notifications to users', module: 'communication', action: 'send' },
  { name: 'can_manage_announcements', description: 'Can create and manage announcements', module: 'communication', action: 'manage_announcements' },
  { name: 'can_view_communication_logs', description: 'Can view communication history', module: 'communication', action: 'read_logs' },

  // File Management (tenant-specific)
  { name: 'can_upload_files', description: 'Can upload files to tenant storage', module: 'files', action: 'upload' },
  { name: 'can_view_files', description: 'Can view files in tenant storage', module: 'files', action: 'read' },
  { name: 'can_delete_files', description: 'Can delete files from tenant storage', module: 'files', action: 'delete' },
  { name: 'can_share_files', description: 'Can share files with other users', module: 'files', action: 'share' },

  // Support & Help (tenant-specific)
  { name: 'can_create_support_tickets', description: 'Can create support tickets', module: 'support', action: 'create' },
  { name: 'can_view_support_tickets', description: 'Can view support tickets', module: 'support', action: 'read' },
  { name: 'can_respond_to_tickets', description: 'Can respond to support tickets', module: 'support', action: 'respond' },
  { name: 'can_close_tickets', description: 'Can close support tickets', module: 'support', action: 'close' },

  // API Access (tenant-specific)
  { name: 'can_access_api', description: 'Can access tenant API endpoints', module: 'api', action: 'access' },
  { name: 'can_manage_api_keys', description: 'Can manage API keys for tenant', module: 'api', action: 'manage_keys' }
];

// Define roles for tenant users (not for SuperAdmin)
const roles = [
  {
    name: 'Tenant Administrator',
    description: 'Full access to all tenant features and user management',
    isGlobal: false, // Tenant-specific role
    isActive: true,
    permissions: [
      // User Management
      'can_view_users', 'can_create_users', 'can_edit_users', 'can_delete_users', 'can_assign_roles',
      // Tenant Settings
      'can_view_tenant_settings', 'can_edit_tenant_settings', 'can_manage_tenant_billing',
      // Content Management
      'can_view_content', 'can_create_content', 'can_edit_content', 'can_delete_content', 'can_publish_content',
      // Analytics
      'can_view_analytics', 'can_export_reports', 'can_manage_dashboards',
      // Communication
      'can_send_notifications', 'can_manage_announcements', 'can_view_communication_logs',
      // File Management
      'can_upload_files', 'can_view_files', 'can_delete_files', 'can_share_files',
      // Support
      'can_create_support_tickets', 'can_view_support_tickets', 'can_respond_to_tickets', 'can_close_tickets',
      // API Access
      'can_access_api', 'can_manage_api_keys'
    ]
  },
  {
    name: 'Content Manager',
    description: 'Can manage content, files, and communications',
    isGlobal: false,
    isActive: true,
    permissions: [
      // Content Management
      'can_view_content', 'can_create_content', 'can_edit_content', 'can_delete_content', 'can_publish_content',
      // File Management
      'can_upload_files', 'can_view_files', 'can_delete_files', 'can_share_files',
      // Communication
      'can_send_notifications', 'can_manage_announcements', 'can_view_communication_logs',
      // Basic user viewing
      'can_view_users'
    ]
  },
  {
    name: 'User Manager',
    description: 'Can manage users and assign roles within the tenant',
    isGlobal: false,
    isActive: true,
    permissions: [
      // User Management
      'can_view_users', 'can_create_users', 'can_edit_users', 'can_delete_users', 'can_assign_roles',
      // Basic content viewing
      'can_view_content',
      // Basic analytics
      'can_view_analytics'
    ]
  },
  {
    name: 'Analyst',
    description: 'Can view analytics, reports, and create dashboards',
    isGlobal: false,
    isActive: true,
    permissions: [
      // Analytics
      'can_view_analytics', 'can_export_reports', 'can_manage_dashboards',
      // Basic content viewing
      'can_view_content',
      // Basic user viewing
      'can_view_users'
    ]
  },
  {
    name: 'Support Agent',
    description: 'Can handle support tickets and user communications',
    isGlobal: false,
    isActive: true,
    permissions: [
      // Support
      'can_create_support_tickets', 'can_view_support_tickets', 'can_respond_to_tickets', 'can_close_tickets',
      // Communication
      'can_send_notifications', 'can_view_communication_logs',
      // Basic user viewing
      'can_view_users',
      // Basic content viewing
      'can_view_content'
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to tenant content and basic features',
    isGlobal: false,
    isActive: true,
    permissions: [
      // Basic viewing permissions
      'can_view_users', 'can_view_content', 'can_view_analytics', 'can_view_files',
      // Support
      'can_create_support_tickets', 'can_view_support_tickets'
    ]
  }
];

async function seedPermissionsAndRoles() {
  try {
    console.log('🌱 Starting to seed permissions and roles for tenant users...');
    
    // Clear existing data
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    console.log('✅ Cleared existing permissions and roles');

    // Create permissions
    const createdPermissions = await Promise.all(
      permissions.map(permission => prisma.permission.create({ data: permission }))
    );
    console.log(`✅ Created ${createdPermissions.length} permissions for tenant users`);

    // Create roles and assign permissions
    for (const roleData of roles) {
      const { permissions: permissionNames, ...roleInfo } = roleData;
      
      const role = await prisma.role.create({ data: roleInfo });
      
      // Find permission IDs for this role
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

      console.log(`✅ Created role "${role.name}" with ${permissionIds.length} permissions`);
    }

    // Get statistics
    const totalRoles = await prisma.role.count();
    const totalPermissions = await prisma.permission.count();
    const totalRolePermissions = await prisma.rolePermission.count();

    console.log('\n📊 Seeding Summary:');
    console.log(`   Total Permissions: ${totalPermissions}`);
    console.log(`   Total Roles: ${totalRoles}`);
    console.log(`   Total Role-Permission Relationships: ${totalRolePermissions}`);

    console.log('\n🎯 Role Summary:');
    for (const role of roles) {
      console.log(`   • ${role.name}: ${role.permissions.length} permissions`);
    }

    console.log('\n📋 Permission Modules:');
    const modules = [...new Set(permissions.map(p => p.module))];
    modules.forEach(module => {
      const modulePermissions = permissions.filter(p => p.module === module);
      console.log(`   • ${module}: ${modulePermissions.length} permissions`);
    });

    console.log('\n🎉 Successfully seeded permissions and roles for tenant users!');
    console.log('\n💡 Note: SuperAdmin has full access without needing specific permissions.');
    console.log('   These roles and permissions are for tenant users only.');

  } catch (error) {
    console.error('❌ Error seeding permissions and roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPermissionsAndRoles()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 