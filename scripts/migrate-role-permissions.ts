import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRolePermissions() {
  console.log('Starting role permissions migration...');

  try {
    // Get all existing role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        permission: true
      }
    });

    console.log(`Found ${rolePermissions.length} role permissions to migrate`);

    let updatedCount = 0;

    for (const rolePermission of rolePermissions) {
      const permission = rolePermission.permission;
      
      // Determine granular permissions based on the action
      let canCreate = false;
      let canRead = false;
      let canUpdate = false;
      let canDelete = false;
      let canViewAll = false;

      switch (permission.action) {
        case 'create':
          canCreate = true;
          break;
        case 'read':
        case 'view':
          canRead = true;
          break;
        case 'update':
        case 'edit':
          canUpdate = true;
          break;
        case 'delete':
          canDelete = true;
          break;
        case 'view_all':
        case 'viewAll':
          canViewAll = true;
          canRead = true; // view_all implies read permission
          break;
        default:
          // For other actions, try to infer from action name
          if (permission.action.includes('create')) canCreate = true;
          if (permission.action.includes('read') || permission.action.includes('view')) canRead = true;
          if (permission.action.includes('update') || permission.action.includes('edit')) canUpdate = true;
          if (permission.action.includes('delete')) canDelete = true;
          if (permission.action.includes('all')) canViewAll = true;
          break;
      }

      // Update the role permission with granular permissions
      await prisma.rolePermission.update({
        where: {
          id: rolePermission.id
        },
        data: {
          canCreate,
          canRead,
          canUpdate,
          canDelete,
          canViewAll
        }
      });

      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount} role permissions...`);
      }
    }

    console.log(`Successfully migrated ${updatedCount} role permissions`);

    // Create some default global roles if they don't exist
    await createDefaultGlobalRoles();

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultGlobalRoles() {
  console.log('Creating default global roles...');

  // Check if global roles already exist
  const existingGlobalRoles = await prisma.role.findMany({
    where: {
      tenantId: null
    }
  });

  if (existingGlobalRoles.length > 0) {
    console.log('Global roles already exist, skipping creation');
    return;
  }

  // Get all permissions
  const permissions = await prisma.permission.findMany({
    where: {
      isActive: true
    }
  });

  // Create Super Admin role
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      isActive: true,
      isSystem: true,
      tenantId: null,
      priority: 100
    }
  });

  // Assign all permissions to Super Admin
  const superAdminPermissions = permissions.map(permission => ({
    roleId: superAdminRole.id,
    permissionId: permission.id,
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canViewAll: true
  }));

  await prisma.rolePermission.createMany({
    data: superAdminPermissions
  });

  // Create Tenant Admin role
  const tenantAdminRole = await prisma.role.create({
    data: {
      name: 'Tenant Admin',
      description: 'Full tenant access with limited system permissions',
      isActive: true,
      isSystem: true,
      tenantId: null,
      priority: 90
    }
  });

  // Assign tenant-specific permissions to Tenant Admin
  const tenantAdminPermissions = permissions
    .filter(permission => 
      !permission.moduleKey.includes('superadmin') && 
      !permission.moduleKey.includes('system')
    )
    .map(permission => ({
      roleId: tenantAdminRole.id,
      permissionId: permission.id,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canViewAll: true
    }));

  await prisma.rolePermission.createMany({
    data: tenantAdminPermissions
  });

  // Create User role
  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      description: 'Basic user with limited permissions',
      isActive: true,
      isSystem: true,
      tenantId: null,
      priority: 10
    }
  });

  // Assign basic permissions to User
  const userPermissions = permissions
    .filter(permission => 
      ['dashboard', 'profile', 'notifications'].includes(permission.moduleKey) ||
      (permission.moduleKey === 'content' && ['read', 'view'].includes(permission.action))
    )
    .map(permission => ({
      roleId: userRole.id,
      permissionId: permission.id,
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
      canViewAll: false
    }));

  await prisma.rolePermission.createMany({
    data: userPermissions
  });

  console.log('Created default global roles: Super Admin, Tenant Admin, User');
}

// Run the migration
if (require.main === module) {
  migrateRolePermissions()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateRolePermissions };
