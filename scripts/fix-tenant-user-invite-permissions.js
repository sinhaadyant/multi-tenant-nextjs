// Script to fix tenant user invite permissions
// This script ensures that users have the proper permissions to invite other users

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTenantUserInvitePermissions() {
  console.log('🔧 Fixing Tenant User Invite Permissions...');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: true
                  }
                }
              }
            }
          }
        },
        roles: {
          include: {
            permissions: true
          }
        }
      }
    });

    console.log(`Found ${tenants.length} active tenants`);

    for (const tenant of tenants) {
      console.log(`\n📋 Processing tenant: ${tenant.name} (${tenant.slug})`);
      
      // Check if tenant has any roles
      if (tenant.roles.length === 0) {
        console.log('❌ No roles found for tenant - creating default roles');
        await createDefaultRolesForTenant(tenant.id);
        continue;
      }

      // Check if any role has user creation permissions
      const rolesWithUserCreatePermission = tenant.roles.filter(role => 
        role.permissions.some(permission => 
          (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
          permission.canCreate
        )
      );

      if (rolesWithUserCreatePermission.length === 0) {
        console.log('❌ No roles have user creation permissions - adding permissions');
        await addUserCreatePermissionsToRoles(tenant.roles);
      } else {
        console.log(`✅ Found ${rolesWithUserCreatePermission.length} roles with user creation permissions`);
      }

      // Check if users have roles with user creation permissions
      const usersWithoutCreatePermission = tenant.users.filter(user => {
        const hasCreatePermission = user.userRoles.some(userRole => 
          userRole.role.permissions.some(permission => 
            (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
            permission.canCreate
          )
        );
        return !hasCreatePermission;
      });

      if (usersWithoutCreatePermission.length > 0) {
        console.log(`❌ Found ${usersWithoutCreatePermission.length} users without user creation permissions`);
        await assignUserCreatePermissionToUsers(usersWithoutCreatePermission, tenant.roles);
      } else {
        console.log('✅ All users have user creation permissions');
      }
    }

    console.log('\n✅ Tenant user invite permissions fix completed!');

  } catch (error) {
    console.error('❌ Error fixing tenant user invite permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultRolesForTenant(tenantId: string) {
  console.log('Creating default roles for tenant...');

  // Create Admin role
  const adminRole = await prisma.role.create({
    data: {
      name: 'Tenant Administrator',
      description: 'Full access to all tenant features and user management',
      tenantId: tenantId,
      isActive: true,
      isDefault: false,
      isSystem: false,
      priority: 1
    }
  });

  // Create User Manager role
  const userManagerRole = await prisma.role.create({
    data: {
      name: 'User Manager',
      description: 'Can manage users within the tenant',
      tenantId: tenantId,
      isActive: true,
      isDefault: false,
      isSystem: false,
      priority: 2
    }
  });

  // Create basic user role
  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      description: 'Basic user with limited permissions',
      tenantId: tenantId,
      isActive: true,
      isDefault: true,
      isSystem: false,
      priority: 3
    }
  });

  // Add permissions to Admin role
  await addPermissionsToRole(adminRole.id, [
    { moduleKey: 'users', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'roles', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'audit', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: true },
    { moduleKey: 'reports', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'analytics', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'notifications', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'content', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'support', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
    { moduleKey: 'dashboard', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: true }
  ]);

  // Add permissions to User Manager role
  await addPermissionsToRole(userManagerRole.id, [
    { moduleKey: 'users', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: true },
    { moduleKey: 'roles', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: true },
    { moduleKey: 'audit', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'reports', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'analytics', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'notifications', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'content', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
    { moduleKey: 'support', canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'dashboard', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
  ]);

  // Add permissions to User role
  await addPermissionsToRole(userRole.id, [
    { moduleKey: 'users', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'roles', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'audit', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'reports', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'analytics', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'notifications', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'content', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
    { moduleKey: 'support', canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
    { moduleKey: 'dashboard', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
  ]);

  console.log('✅ Default roles created with proper permissions');
}

async function addUserCreatePermissionsToRoles(roles: any[]) {
  console.log('Adding user creation permissions to roles...');

  for (const role of roles) {
    // Check if role already has user creation permission
    const hasUserCreatePermission = role.permissions.some((permission: any) => 
      (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
      permission.canCreate
    );

    if (!hasUserCreatePermission) {
      // Add user creation permission
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          moduleKey: 'users',
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false
        }
      });

      console.log(`✅ Added user creation permission to role: ${role.name}`);
    }
  }
}

async function assignUserCreatePermissionToUsers(users: any[], roles: any[]) {
  console.log('Assigning user creation permissions to users...');

  // Find a role with user creation permission
  const roleWithCreatePermission = roles.find(role => 
    role.permissions.some((permission: any) => 
      (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
      permission.canCreate
    )
  );

  if (!roleWithCreatePermission) {
    console.log('❌ No role found with user creation permission');
    return;
  }

  for (const user of users) {
    // Check if user already has this role
    const hasRole = user.userRoles.some((userRole: any) => 
      userRole.roleId === roleWithCreatePermission.id
    );

    if (!hasRole) {
      // Assign the role to the user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleWithCreatePermission.id
        }
      });

      console.log(`✅ Assigned role "${roleWithCreatePermission.name}" to user: ${user.name} (${user.email})`);
    }
  }
}

async function addPermissionsToRole(roleId: string, permissions: any[]) {
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: roleId,
        moduleKey: permission.moduleKey,
        canCreate: permission.canCreate,
        canRead: permission.canRead,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
        canViewAll: permission.canViewAll
      }
    });
  }
}

// Run the fix
fixTenantUserInvitePermissions();
