import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Only allow superadmin or tenant admin to fix permissions
    const isSuperAdmin = req.user!.userRoles?.some(ur => 
      ur.role.isGlobal && ur.role.name.toLowerCase().includes('admin')
    );

    const isTenantAdmin = req.user!.userRoles?.some(ur => 
      ur.role.name.toLowerCase().includes('admin') || 
      ur.role.name.toLowerCase().includes('administrator')
    );

    if (!isSuperAdmin && !isTenantAdmin) {
      return createErrorResponse('Only administrators can fix permissions', 403);
    }

    console.log(`🔧 Fixing permissions for tenant: ${tenantSlug}`);

    // Get tenant with all users and roles
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
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

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    const results = {
      rolesCreated: 0,
      permissionsAdded: 0,
      usersUpdated: 0,
      errors: []
    };

    // Check if tenant has any roles
    if (tenant.roles.length === 0) {
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
      const adminPermissions = [
        { moduleKey: 'users', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'roles', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'audit', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: true },
        { moduleKey: 'reports', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'analytics', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'notifications', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'content', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'support', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
        { moduleKey: 'dashboard', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: true }
      ];

      for (const permission of adminPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            ...permission
          }
        });
      }

      // Add permissions to User Manager role
      const userManagerPermissions = [
        { moduleKey: 'users', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: true },
        { moduleKey: 'roles', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: true },
        { moduleKey: 'audit', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'reports', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'analytics', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'notifications', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'content', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
        { moduleKey: 'support', canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'dashboard', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
      ];

      for (const permission of userManagerPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: userManagerRole.id,
            ...permission
          }
        });
      }

      // Add basic permissions to User role
      const userPermissions = [
        { moduleKey: 'users', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'roles', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'audit', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'reports', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'analytics', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'notifications', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'content', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
        { moduleKey: 'support', canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
        { moduleKey: 'dashboard', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
      ];

      for (const permission of userPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: userRole.id,
            ...permission
          }
        });
      }

      results.rolesCreated = 3;
      results.permissionsAdded = adminPermissions.length + userManagerPermissions.length + userPermissions.length;

      // Assign admin role to the current user if they don't have any role
      const currentUser = tenant.users.find(u => u.id === userId);
      if (currentUser && currentUser.userRoles.length === 0) {
        await prisma.userRole.create({
          data: {
            userId: userId,
            roleId: adminRole.id
          }
        });
        results.usersUpdated = 1;
      }

      console.log('✅ Default roles and permissions created');
    } else {
      // Check if any role has user creation permissions
      const rolesWithUserCreatePermission = tenant.roles.filter(role => 
        role.permissions.some(permission => 
          (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
          permission.canCreate
        )
      );

      if (rolesWithUserCreatePermission.length === 0) {
        console.log('Adding user creation permissions to existing roles...');
        
        for (const role of tenant.roles) {
          // Add user creation permission if it doesn't exist
          const hasUserCreatePermission = role.permissions.some(permission => 
            (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
            permission.canCreate
          );

          if (!hasUserCreatePermission) {
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
            results.permissionsAdded++;
          }
        }
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
        console.log(`Assigning user creation permissions to ${usersWithoutCreatePermission.length} users...`);
        
        // Find a role with user creation permission
        const roleWithCreatePermission = tenant.roles.find(role => 
          role.permissions.some(permission => 
            (permission.moduleKey === 'users' || permission.moduleKey === 'user-management') && 
            permission.canCreate
          )
        );

        if (roleWithCreatePermission) {
          for (const user of usersWithoutCreatePermission) {
            // Check if user already has this role
            const hasRole = user.userRoles.some(userRole => 
              userRole.roleId === roleWithCreatePermission.id
            );

            if (!hasRole) {
              await prisma.userRole.create({
                data: {
                  userId: user.id,
                  roleId: roleWithCreatePermission.id
                }
              });
              results.usersUpdated++;
            }
          }
        }
      }
    }

    console.log('✅ Permissions fix completed');

    return createSuccessResponse({
      message: 'Permissions fixed successfully',
      results
    }, 'Permissions fixed successfully');

  } catch (error: any) {
    console.error('Error fixing permissions:', error);
    return createErrorResponse(
      error.message || 'Failed to fix permissions',
      error.status || 500
    );
  }
});
