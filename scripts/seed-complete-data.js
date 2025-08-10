const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Tenant configurations
const tenants = [
  {
    name: 'TechCorp Solutions',
    slug: 'techcorp',
    domain: 'techcorp.local',
    description: 'Technology solutions company',
    plan: 'enterprise',
    region: 'US East',
    features: JSON.stringify(['dashboard', 'users', 'roles', 'reports', 'analytics', 'content', 'notifications', 'audit', 'settings']),
    isActive: true
  },
  {
    name: 'Global Retail Inc',
    slug: 'globalretail',
    domain: 'globalretail.local',
    description: 'International retail chain',
    plan: 'professional',
    region: 'US West',
    features: JSON.stringify(['dashboard', 'users', 'roles', 'reports', 'content', 'notifications']),
    isActive: true
  }
];

// User configurations for each tenant
const tenantUsers = {
  techcorp: [
    {
      name: 'John Admin',
      email: 'admin@techcorp.com',
      password: 'AdminPass123',
      role: 'Tenant Admin',
      isActive: true
    },
    {
      name: 'Sarah Manager',
      email: 'manager@techcorp.com',
      password: 'ManagerPass123',
      role: 'Tenant Manager',
      isActive: true
    },
    {
      name: 'Mike User',
      email: 'user@techcorp.com',
      password: 'UserPass123',
      role: 'Tenant User',
      isActive: true
    },
    {
      name: 'Lisa Viewer',
      email: 'viewer@techcorp.com',
      password: 'ViewerPass123',
      role: 'Read-only User',
      isActive: true
    }
  ],
  globalretail: [
    {
      name: 'David Admin',
      email: 'admin@globalretail.com',
      password: 'AdminPass123',
      role: 'Tenant Admin',
      isActive: true
    },
    {
      name: 'Emma Manager',
      email: 'manager@globalretail.com',
      password: 'ManagerPass123',
      role: 'Tenant Manager',
      isActive: true
    },
    {
      name: 'Tom User',
      email: 'user@globalretail.com',
      password: 'UserPass123',
      role: 'Tenant User',
      isActive: true
    },
    {
      name: 'Anna Viewer',
      email: 'viewer@globalretail.com',
      password: 'ViewerPass123',
      role: 'Read-only User',
      isActive: true
    }
  ]
};

// Module permissions for each role
const rolePermissions = {
  'Tenant Admin': {
    dashboard: ['view', 'create', 'edit', 'delete'],
    users: ['view', 'create', 'edit', 'delete'],
    roles: ['view', 'create', 'edit', 'delete'],
    modules: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create', 'edit', 'delete'],
    analytics: ['view', 'create', 'edit', 'delete'],
    content: ['view', 'create', 'edit', 'delete'],
    notifications: ['view', 'create', 'edit', 'delete'],
    audit: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'create', 'edit', 'delete']
  },
  'Tenant Manager': {
    dashboard: ['view'],
    users: ['view', 'create', 'edit'],
    roles: ['view'],
    modules: ['view'],
    reports: ['view', 'create', 'edit'],
    analytics: ['view', 'create'],
    content: ['view', 'create', 'edit', 'delete'],
    notifications: ['view', 'create'],
    audit: ['view'],
    settings: ['view']
  },
  'Tenant User': {
    dashboard: ['view'],
    users: ['view'],
    roles: ['view'],
    modules: ['view'],
    reports: ['view'],
    analytics: ['view'],
    content: ['view', 'create'],
    notifications: ['view'],
    audit: ['view'],
    settings: ['view']
  },
  'Read-only User': {
    dashboard: ['view'],
    users: ['view'],
    roles: ['view'],
    modules: ['view'],
    reports: ['view'],
    analytics: ['view'],
    content: ['view'],
    notifications: ['view'],
    audit: ['view'],
    settings: ['view']
  }
};

async function clearData() {
  console.log('🗑️ Clearing existing data (excluding superadmin)...');
  
  // Clear data in order to avoid foreign key constraints
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({
    where: {
      isTemplate: false
    }
  });
  await prisma.permission.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.tenant.deleteMany({});
  
  console.log('✅ Data cleared successfully');
}

async function createModules() {
  console.log('📦 Creating modules...');
  
  const modules = [
    { moduleKey: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'home', parentModuleKey: null, orderIndex: 1 },
    { moduleKey: 'users', moduleName: 'User Management', path: '/users', icon: 'users', parentModuleKey: null, orderIndex: 2 },
    { moduleKey: 'roles', moduleName: 'Role & Permission Management', path: '/roles', icon: 'shield', parentModuleKey: null, orderIndex: 3 },
    { moduleKey: 'modules', moduleName: 'Module Management', path: '/modules', icon: 'puzzle', parentModuleKey: null, orderIndex: 4 },
    { moduleKey: 'reports', moduleName: 'Reports & Analytics', path: '/reports', icon: 'chart-bar', parentModuleKey: null, orderIndex: 5 },
    { moduleKey: 'analytics', moduleName: 'Analytics', path: '/analytics', icon: 'trending-up', parentModuleKey: null, orderIndex: 6 },
    { moduleKey: 'content', moduleName: 'Content Management', path: '/content', icon: 'file-text', parentModuleKey: null, orderIndex: 7 },
    { moduleKey: 'notifications', moduleName: 'Notifications', path: '/notifications', icon: 'bell', parentModuleKey: null, orderIndex: 8 },
    { moduleKey: 'audit', moduleName: 'Audit Logs', path: '/audit', icon: 'clipboard-list', parentModuleKey: null, orderIndex: 9 },
    { moduleKey: 'settings', moduleName: 'Settings', path: '/settings', icon: 'cog', parentModuleKey: null, orderIndex: 10 }
  ];

  for (const module of modules) {
    await prisma.module.upsert({
      where: { moduleKey: module.moduleKey },
      update: module,
      create: module
    });
  }
  
  console.log('✅ Modules created successfully');
}

async function createPermissions() {
  console.log('🔐 Creating permissions...');
  
  const modules = await prisma.module.findMany();
  const actions = ['view', 'create', 'edit', 'delete'];
  
  for (const module of modules) {
    for (const action of actions) {
      const permissionName = `${module.moduleKey}:${action}`;
      await prisma.permission.upsert({
        where: { name: permissionName },
        update: {
          moduleKey: module.moduleKey,
          action: action,
          description: `${action} permission for ${module.moduleName}`
        },
        create: {
          name: permissionName,
          moduleKey: module.moduleKey,
          action: action,
          description: `${action} permission for ${module.moduleName}`
        }
      });
    }
  }
  
  console.log('✅ Permissions created successfully');
}

async function createTenants() {
  console.log('🏢 Creating tenants...');
  
  const createdTenants = [];
  
  for (const tenantData of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantData.slug },
      update: tenantData,
      create: tenantData
    });
    createdTenants.push(tenant);
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);
  }
  
  return createdTenants;
}

async function createRoles(tenants) {
  console.log('👥 Creating roles for each tenant...');
  
  const roleTemplates = [
    { name: 'Tenant Admin', description: 'Full access to all features', isTemplate: true },
    { name: 'Tenant Manager', description: 'Limited management access', isTemplate: true },
    { name: 'Tenant User', description: 'Basic user access', isTemplate: true },
    { name: 'Read-only User', description: 'View-only access', isTemplate: true }
  ];
  
  // Create template roles first
  const templateRoles = [];
  for (const template of roleTemplates) {
    // Check if template role already exists
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: template.name,
        isTemplate: true,
        tenantId: null
      }
    });
    
    let role;
    if (existingRole) {
      role = await prisma.role.update({
        where: { id: existingRole.id },
        data: template
      });
    } else {
      role = await prisma.role.create({
        data: template
      });
    }
    templateRoles.push(role);
  }
  
  // Create tenant-specific roles
  const allRoles = [];
  for (const tenant of tenants) {
    for (const template of roleTemplates) {
      const role = await prisma.role.create({
        data: {
          name: template.name,
          description: template.description,
          tenantId: tenant.id,
          isTemplate: false
        }
      });
      allRoles.push(role);
      console.log(`✅ Created role: ${role.name} for ${tenant.name}`);
    }
  }
  
  return { templateRoles, allRoles };
}

async function assignPermissions(roles) {
  console.log('🔗 Assigning permissions to roles...');
  
  const permissions = await prisma.permission.findMany();
  const permissionMap = {};
  
  // Create a map of permissions by module and action
  for (const permission of permissions) {
    if (!permissionMap[permission.moduleKey]) {
      permissionMap[permission.moduleKey] = {};
    }
    permissionMap[permission.moduleKey][permission.action] = permission;
  }
  
  // Assign permissions to each role
  for (const role of roles.allRoles) {
    const roleName = role.name;
    const rolePerms = rolePermissions[roleName];
    
    if (rolePerms) {
      for (const [moduleKey, actions] of Object.entries(rolePerms)) {
        for (const action of actions) {
          const permission = permissionMap[moduleKey]?.[action];
          if (permission) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }
      }
      console.log(`✅ Assigned permissions to role: ${role.name}`);
    }
  }
}

async function createUsers(tenants) {
  console.log('👤 Creating users for each tenant...');
  
  const allUsers = [];
  
  for (const tenant of tenants) {
    const tenantSlug = tenant.slug;
    const users = tenantUsers[tenantSlug];
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          tenantId: tenant.id,
          isActive: userData.isActive
        }
      });
      
      allUsers.push({ ...user, role: userData.role });
      console.log(`✅ Created user: ${user.name} (${user.email}) in ${tenant.name}`);
    }
  }
  
  return allUsers;
}

async function assignUserRoles(users, roles) {
  console.log('🔗 Assigning roles to users...');
  
  const roleMap = {};
  for (const role of roles.allRoles) {
    const key = `${role.name}_${role.tenantId}`;
    roleMap[key] = role;
  }
  
  for (const user of users) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });
    
    const roleKey = `${user.role}_${userRecord.tenantId}`;
    const role = roleMap[roleKey];
    
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: 'system'
        }
      });
      console.log(`✅ Assigned role ${user.role} to user ${user.name}`);
    }
  }
}

async function seedCompleteData() {
  try {
    console.log('🚀 Starting complete data seeding...\n');
    
    // Step 1: Clear existing data
    await clearData();
    
    // Step 2: Create modules
    await createModules();
    
    // Step 3: Create permissions
    await createPermissions();
    
    // Step 4: Create tenants
    const tenants = await createTenants();
    
    // Step 5: Create roles
    const roles = await createRoles(tenants);
    
    // Step 6: Assign permissions to roles
    await assignPermissions(roles);
    
    // Step 7: Create users
    const users = await createUsers(tenants);
    
    // Step 8: Assign roles to users
    await assignUserRoles(users, roles);
    
    console.log('\n🎉 Complete data seeding finished successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Tenants created: ${tenants.length}`);
    console.log(`   - Roles created: ${roles.allRoles.length}`);
    console.log(`   - Users created: ${users.length}`);
    console.log(`   - Modules created: 10`);
    console.log(`   - Permissions created: 40`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('\nTechCorp Solutions (techcorp):');
    console.log('   - Admin: admin@techcorp.com / AdminPass123');
    console.log('   - Manager: manager@techcorp.com / ManagerPass123');
    console.log('   - User: user@techcorp.com / UserPass123');
    console.log('   - Viewer: viewer@techcorp.com / ViewerPass123');
    
    console.log('\nGlobal Retail Inc (globalretail):');
    console.log('   - Admin: admin@globalretail.com / AdminPass123');
    console.log('   - Manager: manager@globalretail.com / ManagerPass123');
    console.log('   - User: user@globalretail.com / UserPass123');
    console.log('   - Viewer: viewer@globalretail.com / ViewerPass123');
    
    console.log('\n🌐 Access URLs:');
    console.log('   - TechCorp: http://localhost:3000/techcorp/login');
    console.log('   - Global Retail: http://localhost:3000/globalretail/login');
    console.log('   - Superadmin: http://localhost:3000/superadmin/login');
    
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedCompleteData(); 