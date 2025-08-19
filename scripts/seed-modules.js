const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultModules = [
  {
    moduleKey: 'dashboard',
    moduleName: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    description: 'Main dashboard with overview and analytics',
    orderIndex: 1,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'profile',
    moduleName: 'Profile',
    path: '/profile',
    icon: 'User',
    description: 'User profile and account settings',
    orderIndex: 2,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'support',
    moduleName: 'Support',
    path: '/support',
    icon: 'LifeBuoy',
    description: 'Support tickets and help',
    orderIndex: 3,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'users',
    moduleName: 'User Management',
    path: '/users',
    icon: 'Users',
    description: 'Manage tenant users, roles, and permissions',
    orderIndex: 4,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'roles',
    moduleName: 'Roles & Permissions',
    path: '/roles',
    icon: 'Shield',
    description: 'Manage roles and assign permissions',
    orderIndex: 5,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'reports',
    moduleName: 'Reports & Analytics',
    path: '/reports',
    icon: 'BarChart3',
    description: 'Generate and view reports and analytics',
    orderIndex: 6,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'audit',
    moduleName: 'Audit Logs',
    path: '/audit',
    icon: 'ClipboardList',
    description: 'View system audit logs and activity',
    orderIndex: 7,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'notifications',
    moduleName: 'Notifications',
    path: '/notifications',
    icon: 'Bell',
    description: 'Manage notifications and alerts',
    orderIndex: 8,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'settings',
    moduleName: 'Settings',
    path: '/settings',
    icon: 'Cog',
    description: 'System and user settings',
    orderIndex: 9,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'data',
    moduleName: 'Data Management',
    path: '/data',
    icon: 'Database',
    description: 'Backup, restore, and manage data',
    orderIndex: 10,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'utilities',
    moduleName: 'Utilities',
    path: '/utilities',
    icon: 'Wrench',
    description: 'System utilities and tools',
    orderIndex: 11,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'content',
    moduleName: 'Content Management',
    path: '/content',
    icon: 'FileText',
    description: 'Manage content and documents',
    orderIndex: 12,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'analytics',
    moduleName: 'Analytics',
    path: '/analytics',
    icon: 'Activity',
    parentModuleKey: 'reports',
    description: 'Advanced analytics and insights',
    orderIndex: 1,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'user-management',
    moduleName: 'User Management',
    path: '/users/management',
    icon: 'UserCheck',
    parentModuleKey: 'users',
    description: 'Create, edit, and manage users',
    orderIndex: 1,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'role-management',
    moduleName: 'Role Management',
    path: '/roles/management',
    icon: 'ShieldCheck',
    parentModuleKey: 'roles',
    description: 'Create and manage roles',
    orderIndex: 1,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'permission-management',
    moduleName: 'Permission Management',
    path: '/roles/permissions',
    icon: 'Key',
    parentModuleKey: 'roles',
    description: 'Manage permissions and access rights',
    orderIndex: 2,
    isVisible: true,
    isActive: true
  }
];

const defaultPermissions = [
  // Dashboard permissions
  { name: 'dashboard:view', moduleKey: 'dashboard', action: 'view', description: 'View dashboard' },
  { name: 'dashboard:read', moduleKey: 'dashboard', action: 'read', description: 'Read dashboard' },
  
  // Profile permissions
  { name: 'profile:view', moduleKey: 'profile', action: 'view', description: 'View profile' },
  { name: 'profile:read', moduleKey: 'profile', action: 'read', description: 'Read profile' },
  { name: 'profile:update', moduleKey: 'profile', action: 'update', description: 'Update profile' },
  
  // Support permissions
  { name: 'support:view', moduleKey: 'support', action: 'view', description: 'View support tickets' },
  { name: 'support:read', moduleKey: 'support', action: 'read', description: 'Read support tickets' },
  { name: 'support:create', moduleKey: 'support', action: 'create', description: 'Create support tickets' },
  { name: 'support:manage', moduleKey: 'support', action: 'manage', description: 'Manage support tickets' },
  
  // User management permissions
  { name: 'users:view', moduleKey: 'users', action: 'view', description: 'View users' },
  { name: 'users:read', moduleKey: 'users', action: 'read', description: 'Read users' },
  { name: 'users:create', moduleKey: 'users', action: 'create', description: 'Create users' },
  { name: 'users:edit', moduleKey: 'users', action: 'edit', description: 'Edit users' },
  { name: 'users:update', moduleKey: 'users', action: 'update', description: 'Update users' },
  { name: 'users:delete', moduleKey: 'users', action: 'delete', description: 'Delete users' },
  { name: 'user-management:view', moduleKey: 'user-management', action: 'view', description: 'View user management' },
  { name: 'user-management:create', moduleKey: 'user-management', action: 'create', description: 'Create users' },
  { name: 'user-management:edit', moduleKey: 'user-management', action: 'edit', description: 'Edit users' },
  { name: 'user-management:delete', moduleKey: 'user-management', action: 'delete', description: 'Delete users' },
  
  // Role management permissions
  { name: 'roles:view', moduleKey: 'roles', action: 'view', description: 'View roles' },
  { name: 'roles:read', moduleKey: 'roles', action: 'read', description: 'Read roles' },
  { name: 'roles:create', moduleKey: 'roles', action: 'create', description: 'Create roles' },
  { name: 'roles:edit', moduleKey: 'roles', action: 'edit', description: 'Edit roles' },
  { name: 'roles:update', moduleKey: 'roles', action: 'update', description: 'Update roles' },
  { name: 'roles:delete', moduleKey: 'roles', action: 'delete', description: 'Delete roles' },
  { name: 'role-management:view', moduleKey: 'role-management', action: 'view', description: 'View role management' },
  { name: 'role-management:create', moduleKey: 'role-management', action: 'create', description: 'Create roles' },
  { name: 'role-management:edit', moduleKey: 'role-management', action: 'edit', description: 'Edit roles' },
  { name: 'role-management:delete', moduleKey: 'role-management', action: 'delete', description: 'Delete roles' },
  { name: 'permission-management:view', moduleKey: 'permission-management', action: 'view', description: 'View permissions' },
  { name: 'permission-management:assign', moduleKey: 'permission-management', action: 'assign', description: 'Assign permissions' },
  
  // Reports permissions
  { name: 'reports:view', moduleKey: 'reports', action: 'view', description: 'View reports' },
  { name: 'reports:read', moduleKey: 'reports', action: 'read', description: 'Read reports' },
  { name: 'reports:create', moduleKey: 'reports', action: 'create', description: 'Create reports' },
  { name: 'reports:export', moduleKey: 'reports', action: 'export', description: 'Export reports' },
  { name: 'analytics:view', moduleKey: 'analytics', action: 'view', description: 'View analytics' },
  { name: 'analytics:create', moduleKey: 'analytics', action: 'create', description: 'Create analytics' },
  
  // Audit permissions
  { name: 'audit:view', moduleKey: 'audit', action: 'view', description: 'View audit logs' },
  { name: 'audit:read', moduleKey: 'audit', action: 'read', description: 'Read audit logs' },
  { name: 'audit:export', moduleKey: 'audit', action: 'export', description: 'Export audit logs' },
  
  // Notifications permissions
  { name: 'notifications:view', moduleKey: 'notifications', action: 'view', description: 'View notifications' },
  { name: 'notifications:read', moduleKey: 'notifications', action: 'read', description: 'Read notifications' },
  { name: 'notifications:create', moduleKey: 'notifications', action: 'create', description: 'Create notifications' },
  { name: 'notifications:update', moduleKey: 'notifications', action: 'update', description: 'Update notifications' },
  { name: 'notifications:delete', moduleKey: 'notifications', action: 'delete', description: 'Delete notifications' },
  
  // Settings permissions
  { name: 'settings:view', moduleKey: 'settings', action: 'view', description: 'View settings' },
  { name: 'settings:read', moduleKey: 'settings', action: 'read', description: 'Read settings' },
  { name: 'settings:update', moduleKey: 'settings', action: 'update', description: 'Update settings' },
  
  // Data management permissions
  { name: 'data:view', moduleKey: 'data', action: 'view', description: 'View data management' },
  { name: 'data:read', moduleKey: 'data', action: 'read', description: 'Read data' },
  { name: 'data:create', moduleKey: 'data', action: 'create', description: 'Create data' },
  { name: 'data:update', moduleKey: 'data', action: 'update', description: 'Update data' },
  { name: 'data:delete', moduleKey: 'data', action: 'delete', description: 'Delete data' },
  
  // Utilities permissions
  { name: 'utilities:view', moduleKey: 'utilities', action: 'view', description: 'View utilities' },
  { name: 'utilities:read', moduleKey: 'utilities', action: 'read', description: 'Read utilities' },
  { name: 'utilities:create', moduleKey: 'utilities', action: 'create', description: 'Create utilities' },
  
  // Content permissions
  { name: 'content:view', moduleKey: 'content', action: 'view', description: 'View content' },
  { name: 'content:read', moduleKey: 'content', action: 'read', description: 'Read content' },
  { name: 'content:create', moduleKey: 'content', action: 'create', description: 'Create content' },
  { name: 'content:edit', moduleKey: 'content', action: 'edit', description: 'Edit content' },
  { name: 'content:update', moduleKey: 'content', action: 'update', description: 'Update content' },
  { name: 'content:delete', moduleKey: 'content', action: 'delete', description: 'Delete content' }
];

async function seedModules() {
  try {
    console.log('🌱 Seeding modules...');
    
    // Create modules
    for (const moduleData of defaultModules) {
      await prisma.module.upsert({
        where: { moduleKey: moduleData.moduleKey },
        update: moduleData,
        create: moduleData
      });
    }
    
    console.log('✅ Modules seeded successfully');
    
    console.log('🌱 Permissions are handled through RolePermission model - skipping direct permission seeding');
    
    // Create default roles with permissions
    console.log('🌱 Creating default roles...');
    
    // Check if roles already exist
    const existingRoles = await prisma.role.findMany({
      where: { isTemplate: true }
    });
    
    if (existingRoles.length === 0) {
      // Tenant Admin role
      const tenantAdminRole = await prisma.role.create({
        data: {
          name: 'Tenant Admin',
          description: 'Full access to all tenant features',
          isDefault: false,
          isTemplate: true,
          isActive: true,
          tenantId: null
        }
      });
      
      // Tenant Manager role
      const tenantManagerRole = await prisma.role.create({
        data: {
          name: 'Tenant Manager',
          description: 'Can manage specific modules and users',
          isDefault: false,
          isTemplate: true,
          isActive: true,
          tenantId: null
        }
      });
      
      // Tenant User role
      const tenantUserRole = await prisma.role.create({
        data: {
          name: 'Tenant User',
          description: 'Standard user with limited access',
          isDefault: true,
          isTemplate: true,
          isActive: true,
          tenantId: null
        }
      });
      
      // Read-only User role
      const readOnlyUserRole = await prisma.role.create({
        data: {
          name: 'Read-only User',
          description: 'Can only view data without modification',
          isDefault: false,
          isTemplate: true,
          isActive: true,
          tenantId: null
        }
      });
      
      // Assign permissions to Tenant Admin (all modules with all permissions)
      const allModules = await prisma.module.findMany({ where: { isActive: true } });
      for (const module of allModules) {
        await prisma.rolePermission.create({
          data: {
            roleId: tenantAdminRole.id,
            moduleKey: module.moduleKey,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canViewAll: true
          }
        });
      }
      
      // Assign permissions to Tenant Manager (limited modules with read/update permissions)
      const managerModules = ['dashboard', 'users', 'content', 'reports', 'profile', 'support'];
      for (const moduleKey of managerModules) {
        await prisma.rolePermission.create({
          data: {
            roleId: tenantManagerRole.id,
            moduleKey: moduleKey,
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: false,
            canViewAll: false
          }
        });
      }
      
      // Assign permissions to Tenant User (basic permissions - dashboard, profile, support, content)
      const userModules = ['dashboard', 'profile', 'support', 'content'];
      for (const moduleKey of userModules) {
        await prisma.rolePermission.create({
          data: {
            roleId: tenantUserRole.id,
            moduleKey: moduleKey,
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false
          }
        });
      }
      
      // Assign permissions to Read-only User (view only for all modules)
      const readOnlyModules = ['dashboard', 'profile', 'support', 'content', 'reports'];
      for (const moduleKey of readOnlyModules) {
        await prisma.rolePermission.create({
          data: {
            roleId: readOnlyUserRole.id,
            moduleKey: moduleKey,
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false
          }
        });
      }
      
      console.log('✅ Default roles created successfully');
    } else {
      console.log('✅ Default roles already exist, skipping creation');
    }
    
    console.log('🎉 Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedModules(); 