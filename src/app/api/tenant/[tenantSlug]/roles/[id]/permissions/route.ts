import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for permission management
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  action: z.enum(['assign', 'remove', 'replace']).default('replace')
});

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const { tenantSlug, id } = params;

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Check if user has permission to view roles
    const hasViewPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.moduleKey === 'roles' && rp.permission.action === 'read'
      )
    );

    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view roles', 403);
    }

    // Get role with current permissions
    const role = await prisma.role.findFirst({
      where: {
        id,
        tenantId: tenant.id
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Get all available permissions for this tenant
    const availablePermissions = await prisma.permission.findMany({
      where: {
        isActive: true
      },
      include: {
        module: true
      },
      orderBy: [
        { module: { orderIndex: 'asc' } },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group permissions by module
    const permissionsByModule = availablePermissions.reduce((acc, permission) => {
      const moduleKey = permission.moduleKey;
      if (!acc[moduleKey]) {
        acc[moduleKey] = {
          moduleKey,
          moduleName: permission.module.moduleName,
          description: permission.module.description,
          icon: permission.module.icon,
          permissions: []
        };
      }
      acc[moduleKey].permissions.push(permission);
      return acc;
    }, {} as Record<string, any>);

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        currentPermissions: role.permissions.map(rp => rp.permission)
      },
      availablePermissions: Object.values(permissionsByModule)
    });

  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return createErrorResponse('Failed to fetch role permissions', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const { tenantSlug, id } = params;

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Check if user has permission to update roles
    const hasUpdatePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.moduleKey === 'roles' && rp.permission.action === 'update'
      )
    );

    if (!hasUpdatePermission) {
      return createErrorResponse('Insufficient permissions to update roles', 403);
    }

    // Get existing role
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        tenantId: tenant.id
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Prevent editing system roles
    if (existingRole.isSystem) {
      return createErrorResponse('System roles cannot be modified', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updatePermissionsSchema.parse(body);

    // Validate that all permissions exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: validatedData.permissions },
        isActive: true
      }
    });

    if (permissions.length !== validatedData.permissions.length) {
      return createErrorResponse('One or more permissions not found', 400);
    }

    // Update permissions based on action
    let updatedPermissions: any[] = [];

    if (validatedData.action === 'replace') {
      // Replace all permissions
      await prisma.$transaction(async (tx) => {
        // Remove all existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        });

        // Add new permissions
        if (validatedData.permissions.length > 0) {
          const permissionAssignments = validatedData.permissions.map(permissionId => ({
            roleId: id,
            permissionId
          }));

          await tx.rolePermission.createMany({
            data: permissionAssignments,
            skipDuplicates: true
          });
        }
      });

      updatedPermissions = permissions;
    } else if (validatedData.action === 'assign') {
      // Add permissions (don't remove existing ones)
      const permissionAssignments = validatedData.permissions.map(permissionId => ({
        roleId: id,
        permissionId
      }));

      await prisma.rolePermission.createMany({
        data: permissionAssignments,
        skipDuplicates: true
      });

      // Get updated permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      updatedPermissions = updatedRole!.permissions.map(rp => rp.permission);
    } else if (validatedData.action === 'remove') {
      // Remove specific permissions
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: id,
          permissionId: { in: validatedData.permissions }
        }
      });

      // Get updated permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      updatedPermissions = updatedRole!.permissions.map(rp => rp.permission);
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'UPDATE_ROLE_PERMISSIONS',
      details: `${validatedData.action === 'replace' ? 'Replaced' : validatedData.action === 'assign' ? 'Added' : 'Removed'} ${validatedData.permissions.length} permissions for role "${existingRole.name}"`,
      tenantId: tenant.id,
      userId: user.id
    });

    return createSuccessResponse({
      role: {
        id: existingRole.id,
        name: existingRole.name,
        permissions: updatedPermissions
      },
      message: `Permissions ${validatedData.action === 'replace' ? 'replaced' : validatedData.action === 'assign' ? 'added' : 'removed'} successfully`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Error updating role permissions:', error);
    return createErrorResponse('Failed to update role permissions', 500);
  }
} 