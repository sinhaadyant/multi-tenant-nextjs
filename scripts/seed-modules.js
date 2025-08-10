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
    moduleKey: 'users',
    moduleName: 'User Management',
    path: '/users',
    icon: 'Users',
    description: 'Manage tenant users, roles, and permissions',
    orderIndex: 2,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'roles',
    moduleName: 'Roles & Permissions',
    path: '/roles',
    icon: 'Shield',
    description: 'Manage roles and assign permissions',
    orderIndex: 3,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'reports',
    moduleName: 'Reports & Analytics',
    path: '/reports',
    icon: 'BarChart3',
    description: 'Generate and view reports and analytics',
    orderIndex: 4,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'audit',
    moduleName: 'Audit Logs',
    path: '/audit',
    icon: 'ClipboardList',
    description: 'View system audit logs and activity',
    orderIndex: 5,
    isVisible: true,
    isActive: true
  },

  {
    moduleKey: 'support',
    moduleName: 'Support',
    path: '/support',
    icon: 'LifeBuoy',
    description: 'Support tickets and help',
    orderIndex: 8,
    isVisible: true,
    isActive: true
  },
  {
    moduleKey: 'content',
    moduleName: 'Content Management',
    path: '/content',
    icon: 'FileText',
    description: 'Manage content and documents',
    orderIndex: 9,
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
  
  // User management permissions
  { name: 'users:view', moduleKey: 'users', action: 'view', description: 'View users' },
  { name: 'users:create', moduleKey: 'users', action: 'create', description: 'Create users' },
  { name: 'users:edit', moduleKey: 'users', action: 'edit', description: 'Edit users' },
  { name: 'users:delete', moduleKey: 'users', action: 'delete', description: 'Delete users' },
  { name: 'user-management:view', moduleKey: 'user-management', action: 'view', description: 'View user management' },
  { name: 'user-management:create', moduleKey: 'user-management', action: 'create', description: 'Create users' },
  { name: 'user-management:edit', moduleKey: 'user-management', action: 'edit', description: 'Edit users' },
  { name: 'user-management:delete', moduleKey: 'user-management', action: 'delete', description: 'Delete users' },
  
  // Role management permissions
  { name: 'roles:view', moduleKey: 'roles', action: 'view', description: 'View roles' },
  { name: 'roles:create', moduleKey: 'roles', action: 'create', description: 'Create roles' },
  { name: 'roles:edit', moduleKey: 'roles', action: 'edit', description: 'Edit roles' },
  { name: 'roles:delete', moduleKey: 'roles', action: 'delete', description: 'Delete roles' },
  { name: 'role-management:view', moduleKey: 'role-management', action: 'view', description: 'View role management' },
  { name: 'role-management:create', moduleKey: 'role-management', action: 'create', description: 'Create roles' },
  { name: 'role-management:edit', moduleKey: 'role-management', action: 'edit', description: 'Edit roles' },
  { name: 'role-management:delete', moduleKey: 'role-management', action: 'delete', description: 'Delete roles' },
  { name: 'permission-management:view', moduleKey: 'permission-management', action: 'view', description: 'View permissions' },
  { name: 'permission-management:assign', moduleKey: 'permission-management', action: 'assign', description: 'Assign permissions' },
  
  // Reports permissions
  { name: 'reports:view', moduleKey: 'reports', action: 'view', description: 'View reports' },
  { name: 'reports:create', moduleKey: 'reports', action: 'create', description: 'Create reports' },
  { name: 'reports:export', moduleKey: 'reports', action: 'export', description: 'Export reports' },
  { name: 'analytics:view', moduleKey: 'analytics', action: 'view', description: 'View analytics' },
  { name: 'analytics:create', moduleKey: 'analytics', action: 'create', description: 'Create analytics' },
  
  // Audit permissions
  { name: 'audit:view', moduleKey: 'audit', action: 'view', description: 'View audit logs' },
  { name: 'audit:export', moduleKey: 'audit', action: 'export', description: 'Export audit logs' },
  

  
  // Support permissions
  { name: 'support:view', moduleKey: 'support', action: 'view', description: 'View support tickets' },
  { name: 'support:create', moduleKey: 'support', action: 'create', description: 'Create support tickets' },
  { name: 'support:manage', moduleKey: 'support', action: 'manage', description: 'Manage support tickets' },
  
  // Content permissions
  { name: 'content:view', moduleKey: 'content', action: 'view', description: 'View content' },
  { name: 'content:create', moduleKey: 'content', action: 'create', description: 'Create content' },
  { name: 'content:edit', moduleKey: 'content', action: 'edit', description: 'Edit content' },
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
    
    console.log('🌱 Seeding permissions...');
    
    // Create permissions
    for (const permissionData of defaultPermissions) {
      await prisma.permission.upsert({
        where: { name: permissionData.name },
        update: permissionData,
        create: permissionData
      });
    }
    
    console.log('✅ Permissions seeded successfully');
    
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
      
      // Assign permissions to Tenant Admin (all permissions)
      const allPermissions = await prisma.permission.findMany({ where: { isActive: true } });
      for (const permission of allPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: tenantAdminRole.id,
            permissionId: permission.id
          }
        });
      }
      
      // Assign permissions to Tenant Manager (limited permissions)
      const managerPermissions = await prisma.permission.findMany({
        where: {
          isActive: true,
          OR: [
            { moduleKey: 'dashboard' },
            { moduleKey: 'users' },
            { moduleKey: 'content' },
            { moduleKey: 'reports' }
          ]
        }
      });
      
      for (const permission of managerPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: tenantManagerRole.id,
            permissionId: permission.id
          }
        });
      }
      
      // Assign permissions to Tenant User (basic permissions)
      const userPermissions = await prisma.permission.findMany({
        where: {
          isActive: true,
          OR: [
            { moduleKey: 'dashboard' },
            { moduleKey: 'content' }
          ],
          action: { in: ['view'] }
        }
      });
      
      for (const permission of userPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: tenantUserRole.id,
            permissionId: permission.id
          }
        });
      }
      
      // Assign permissions to Read-only User (view only)
      const readOnlyPermissions = await prisma.permission.findMany({
        where: {
          isActive: true,
          action: 'view'
        }
      });
      
      for (const permission of readOnlyPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: readOnlyUserRole.id,
            permissionId: permission.id
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