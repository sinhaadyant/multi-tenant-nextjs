import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const updateRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid color is required').optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.object({
    moduleKey: z.string(),
    canCreate: z.boolean().default(false),
    canRead: z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canViewAll: z.boolean().default(false)
  })).optional()
});

// GET /api/tenant/[tenantSlug]/roles/[roleId] - Get specific role
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; roleId: string }> }) => {
  const { tenantSlug, roleId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'roles.view');
    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view roles', 403);
    }

    // Fetch role with permissions and user roles
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: tenantId,
        isGlobal: false
      },
      include: {
        permissions: {
          include: {
            module: {
              select: {
                moduleKey: true,
                moduleName: true
              }
            }
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Format response
    const formattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      isActive: role.isActive,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map(p => ({
        moduleKey: p.moduleKey,
        moduleName: p.module?.moduleName,
        canCreate: p.canCreate,
        canRead: p.canRead,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
        canViewAll: p.canViewAll
      })),
      users: role.userRoles.map(ur => ur.user),
      userCount: role._count.userRoles
    };

    return createSuccessResponse({
      role: formattedRole
    }, 'Role retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching role:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch role',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/roles/[roleId] - Update role
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; roleId: string }> }) => {
  const { tenantSlug, roleId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check update permission
    const hasUpdatePermission = await checkTenantPermission(req.user!, tenantId!, 'roles.update');
    if (!hasUpdatePermission) {
      return createErrorResponse('Insufficient permissions to update roles', 403);
    }

    const body = await req.json();
    const validatedData = updateRoleSchema.parse(body);

    // Check if role exists and belongs to tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: tenantId,
        isGlobal: false
      }
    });

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Prevent modification of system roles
    if (existingRole.isSystem) {
      return createErrorResponse('Cannot modify system roles', 400);
    }

    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.role.findFirst({
        where: {
          name: validatedData.name,
          tenantId: tenantId,
          isGlobal: false,
          id: { not: roleId }
        }
      });

      if (nameExists) {
        return createErrorResponse('Role with this name already exists in this tenant', 400, [
          { field: 'name', message: 'Role name already exists in this tenant' }
        ]);
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        isActive: validatedData.isActive
      }
    });

    // Update permissions if provided
    if (validatedData.permissions) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleId }
      });

      // Create new permissions
      if (validatedData.permissions.length > 0) {
        const permissionsData = validatedData.permissions.map(permission => ({
          roleId: roleId,
          moduleKey: permission.moduleKey,
          canCreate: permission.canCreate,
          canRead: permission.canRead,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
          canViewAll: permission.canViewAll
        }));

        await prisma.rolePermission.createMany({
          data: permissionsData
        });
      }
    }

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'role.updated', {
      details: `Updated role: ${updatedRole.name}`,
      resource: 'role',
      resourceId: updatedRole.id
    });

    return createSuccessResponse({
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        color: updatedRole.color,
        isActive: updatedRole.isActive,
        updatedAt: updatedRole.updatedAt
      }
    }, 'Role updated successfully');

  } catch (error: any) {
    console.error('Error updating role:', error);
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return createErrorResponse('Validation failed', 400, validationErrors);
    }
    return createErrorResponse(
      error.message || 'Failed to update role',
      error.status || 500
    );
  }
});

// DELETE /api/tenant/[tenantSlug]/roles/[roleId] - Delete role
export const DELETE = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; roleId: string }> }) => {
  const { tenantSlug, roleId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check delete permission
    const hasDeletePermission = await checkTenantPermission(req.user!, tenantId!, 'roles.delete');
    if (!hasDeletePermission) {
      return createErrorResponse('Insufficient permissions to delete roles', 403);
    }

    // Check if role exists and belongs to tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: tenantId,
        isGlobal: false
      },
      include: {
        _count: {
          select: { userRoles: true }
        }
      }
    });

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Prevent deletion of system roles
    if (existingRole.isSystem) {
      return createErrorResponse('Cannot delete system roles', 400);
    }

    // Prevent deletion of default role
    if (existingRole.isDefault) {
      return createErrorResponse('Cannot delete default role', 400);
    }

    // Check if role is assigned to users
    if (existingRole._count.userRoles > 0) {
      return createErrorResponse('Cannot delete role that is assigned to users', 400);
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: roleId }
    });

    // Delete role
    await prisma.role.delete({
      where: { id: roleId }
    });

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'role.deleted', {
      details: `Deleted role: ${existingRole.name}`,
      resource: 'role',
      resourceId: existingRole.id
    });

    return createSuccessResponse({
      roleId: roleId
    }, 'Role deleted successfully');

  } catch (error: any) {
    console.error('Error deleting role:', error);
    return createErrorResponse(
      error.message || 'Failed to delete role',
      error.status || 500
    );
  }
});
