import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const updatePermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').optional(),
  description: z.string().optional(),
  action: z.string().min(1, 'Action is required').optional(),
  moduleKey: z.string().min(1, 'Module key is required').optional(),
  resource: z.string().optional(),
  isActive: z.boolean().optional()
});

// GET /api/tenant/[tenantSlug]/permissions/[permissionId] - Get specific permission
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; permissionId: string }> }) => {
  const { tenantSlug, permissionId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'permissions.view');
    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view permissions', 403);
    }

    // Get tenant modules to filter permissions
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: tenantId, isEnabled: true },
      select: { moduleKey: true }
    });

    const moduleKeys = tenantModules.map(tm => tm.moduleKey);

    // Fetch permission with related data
    const permission = await prisma.permission.findFirst({
      where: {
        id: permissionId,
        moduleKey: { in: moduleKeys }
      },
      include: {
        module: {
          select: {
            moduleKey: true,
            moduleName: true,
            description: true,
            icon: true
          }
        },
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                tenantId: true,
                isActive: true
              }
            }
          }
        },
        _count: {
          select: {
            rolePermissions: true
          }
        }
      }
    });

    if (!permission) {
      return createErrorResponse('Permission not found', 404);
    }

    // Format response
    const formattedPermission = {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      action: permission.action,
      moduleKey: permission.moduleKey,
      resource: permission.resource,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      module: permission.module,
      roles: permission.rolePermissions.map(rp => rp.role),
      roleCount: permission._count.rolePermissions
    };

    return createSuccessResponse({
      permission: formattedPermission
    }, 'Permission retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching permission:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch permission',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/permissions/[permissionId] - Update permission
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; permissionId: string }> }) => {
  const { tenantSlug, permissionId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasUpdatePermission = await checkTenantPermission(req.user!, tenantId!, 'permissions.update');
    if (!hasUpdatePermission) {
      return createErrorResponse('Insufficient permissions to update permissions', 403);
    }

    const body = await req.json();
    const validatedData = updatePermissionSchema.parse(body);

    // Get tenant modules to filter permissions
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: tenantId, isEnabled: true },
      select: { moduleKey: true }
    });

    const moduleKeys = tenantModules.map(tm => tm.moduleKey);

    // Check if permission exists and belongs to tenant
    const existingPermission = await prisma.permission.findFirst({
      where: {
        id: permissionId,
        moduleKey: { in: moduleKeys }
      }
    });

    if (!existingPermission) {
      return createErrorResponse('Permission not found', 404);
    }

    // If moduleKey is being updated, verify the new module is enabled for tenant
    if (validatedData.moduleKey && validatedData.moduleKey !== existingPermission.moduleKey) {
      const module = await prisma.module.findFirst({
        where: {
          moduleKey: validatedData.moduleKey,
          tenantModules: {
            some: {
              tenantId: tenantId,
              isEnabled: true
            }
          }
        }
      });

      if (!module) {
        return createErrorResponse('Module not found or not enabled for this tenant', 404);
      }

      // Check if permission already exists for the new module and action
      const duplicatePermission = await prisma.permission.findFirst({
        where: {
          moduleKey: validatedData.moduleKey,
          action: validatedData.action || existingPermission.action,
          resource: validatedData.resource || existingPermission.resource,
          id: { not: permissionId }
        }
      });

      if (duplicatePermission) {
        return createErrorResponse('Permission already exists for this module and action', 409);
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: validatedData,
      include: {
        module: {
          select: {
            moduleKey: true,
            moduleName: true,
            description: true,
            icon: true
          }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'permission.updated',
      details: `Updated permission: ${updatedPermission.name} (${permissionId})`,
      tenantId: tenantId
    });

    return createSuccessResponse({
      permission: {
        id: updatedPermission.id,
        name: updatedPermission.name,
        description: updatedPermission.description,
        action: updatedPermission.action,
        moduleKey: updatedPermission.moduleKey,
        resource: updatedPermission.resource,
        isActive: updatedPermission.isActive,
        createdAt: updatedPermission.createdAt,
        updatedAt: updatedPermission.updatedAt,
        module: updatedPermission.module
      }
    }, 'Permission updated successfully');

  } catch (error: any) {
    console.error('Error updating permission:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid permission data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to update permission',
      error.status || 500
    );
  }
});

// DELETE /api/tenant/[tenantSlug]/permissions/[permissionId] - Delete permission
export const DELETE = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; permissionId: string }> }) => {
  const { tenantSlug, permissionId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasDeletePermission = await checkTenantPermission(req.user!, tenantId!, 'permissions.delete');
    if (!hasDeletePermission) {
      return createErrorResponse('Insufficient permissions to delete permissions', 403);
    }

    // Get tenant modules to filter permissions
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: tenantId, isEnabled: true },
      select: { moduleKey: true }
    });

    const moduleKeys = tenantModules.map(tm => tm.moduleKey);

    // Check if permission exists and belongs to tenant
    const permission = await prisma.permission.findFirst({
      where: {
        id: permissionId,
        moduleKey: { in: moduleKeys }
      },
      include: {
        rolePermissions: {
          select: { id: true }
        }
      }
    });

    if (!permission) {
      return createErrorResponse('Permission not found', 404);
    }

    // Check if permission is assigned to any roles
    if (permission.rolePermissions.length > 0) {
      return createErrorResponse('Cannot delete permission that is assigned to roles', 409);
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'permission.deleted',
      details: `Deleted permission: ${permission.name} (${permissionId})`,
      tenantId: tenantId
    });

    return createSuccessResponse({
      deleted: true,
      permissionId: permissionId
    }, 'Permission deleted successfully');

  } catch (error: any) {
    console.error('Error deleting permission:', error);
    return createErrorResponse(
      error.message || 'Failed to delete permission',
      error.status || 500
    );
  }
});
