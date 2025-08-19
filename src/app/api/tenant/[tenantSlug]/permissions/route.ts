import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional(),
  action: z.string().min(1, 'Action is required'),
  moduleKey: z.string().min(1, 'Module key is required'),
  resource: z.string().optional(),
  isActive: z.boolean().default(true)
});

const updatePermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').optional(),
  description: z.string().optional(),
  action: z.string().min(1, 'Action is required').optional(),
  moduleKey: z.string().min(1, 'Module key is required').optional(),
  resource: z.string().optional(),
  isActive: z.boolean().optional()
});

const bulkActionSchema = z.object({
  permissionIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete'])
});

// GET /api/tenant/[tenantSlug]/permissions - Get permissions list with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'permissions.view');
    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view permissions', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const status = url.searchParams.get('status') || '';
    const moduleKey = url.searchParams.get('moduleKey') || '';
    const action = url.searchParams.get('action') || '';

    // Build where clause for modules (tenant-specific)
    const moduleWhere: any = {
      tenantModules: {
        some: {
          tenantId: tenantId,
          isEnabled: true
        }
      }
    };

    if (moduleKey) {
      moduleWhere.moduleKey = { contains: moduleKey, mode: 'insensitive' };
    }

    // Get available modules for this tenant
    const modules = await prisma.module.findMany({
      where: moduleWhere,
      select: {
        moduleKey: true,
        moduleName: true,
        description: true,
        icon: true
      }
    });

    // Build where clause for permissions
    const where: any = {
      moduleKey: {
        in: modules.map(m => m.moduleKey)
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { moduleKey: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add status filter
    if (status) {
      where.isActive = status === 'active';
    }

    // Add action filter
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch permissions with pagination and stats
    const [permissions, totalPermissions] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
                  tenantId: true
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
      }),
      prisma.permission.count({ where })
    ]);

    // Calculate statistics
    const permissionStats = {
      total: totalPermissions,
      active: permissions.filter(p => p.isActive).length,
      inactive: permissions.filter(p => !p.isActive).length,
      byModule: modules.map(module => ({
        moduleKey: module.moduleKey,
        moduleName: module.moduleName,
        count: permissions.filter(p => p.moduleKey === module.moduleKey).length
      }))
    };

    // Format response
    const formattedPermissions = permissions.map(permission => ({
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
    }));

    return createSuccessResponse({
      permissions: formattedPermissions,
      modules: modules,
      pagination: {
        page,
        limit,
        total: totalPermissions,
        totalPages: Math.ceil(totalPermissions / limit),
        hasNext: page * limit < totalPermissions,
        hasPrev: page > 1
      },
      stats: permissionStats,
      permissions: {
        canView: hasViewPermission,
        canCreate: await checkTenantPermission(req.user!, tenantId!, 'permissions.create'),
        canUpdate: await checkTenantPermission(req.user!, tenantId!, 'permissions.update'),
        canDelete: await checkTenantPermission(req.user!, tenantId!, 'permissions.delete')
      }
    }, 'Permissions retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch permissions',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/permissions - Create new permission
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasCreatePermission = await checkTenantPermission(req.user!, tenantId!, 'permissions.create');
    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create permissions', 403);
    }

    const body = await req.json();
    const validatedData = createPermissionSchema.parse(body);

    // Verify module exists and is enabled for this tenant
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

    // Check if permission already exists for this module and action
    const existingPermission = await prisma.permission.findFirst({
      where: {
        moduleKey: validatedData.moduleKey,
        action: validatedData.action,
        resource: validatedData.resource || null
      }
    });

    if (existingPermission) {
      return createErrorResponse('Permission already exists for this module and action', 409);
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        action: validatedData.action,
        moduleKey: validatedData.moduleKey,
        resource: validatedData.resource,
        isActive: validatedData.isActive
      },
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
      action: 'permission.created',
      details: `Created permission: ${permission.name} for module: ${permission.moduleKey}`,
      tenantId: tenantId
    });

    return createSuccessResponse({
      permission: {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        action: permission.action,
        moduleKey: permission.moduleKey,
        resource: permission.resource,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
        module: permission.module
      }
    }, 'Permission created successfully');

  } catch (error: any) {
    console.error('Error creating permission:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid permission data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to create permission',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/permissions - Bulk update permissions
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasUpdatePermission = await checkTenantPermission(req.user!, tenantId!, 'permissions.update');
    if (!hasUpdatePermission) {
      return createErrorResponse('Insufficient permissions to update permissions', 403);
    }

    const body = await req.json();
    const validatedData = bulkActionSchema.parse(body);

    // Get tenant modules to filter permissions
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: tenantId, isEnabled: true },
      select: { moduleKey: true }
    });

    const moduleKeys = tenantModules.map(tm => tm.moduleKey);

    // Verify all permissions belong to tenant modules
    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: validatedData.permissionIds },
        moduleKey: { in: moduleKeys }
      }
    });

    if (permissions.length !== validatedData.permissionIds.length) {
      return createErrorResponse('Some permissions not found or not accessible', 404);
    }

    let updateData: any = {};
    let auditDetails = '';

    switch (validatedData.action) {
      case 'activate':
        updateData = { isActive: true };
        auditDetails = `Activated ${permissions.length} permissions`;
        break;
      case 'deactivate':
        updateData = { isActive: false };
        auditDetails = `Deactivated ${permissions.length} permissions`;
        break;
      case 'delete':
        // Delete permissions
        await prisma.permission.deleteMany({
          where: {
            id: { in: validatedData.permissionIds }
          }
        });
        auditDetails = `Deleted ${permissions.length} permissions`;
        break;
    }

    if (validatedData.action !== 'delete') {
      await prisma.permission.updateMany({
        where: {
          id: { in: validatedData.permissionIds }
        },
        data: updateData
      });
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: `permissions.${validatedData.action}`,
      details: auditDetails,
      tenantId: tenantId
    });

    return createSuccessResponse({
      updated: permissions.length,
      action: validatedData.action
    }, `Successfully ${validatedData.action}d ${permissions.length} permissions`);

  } catch (error: any) {
    console.error('Error bulk updating permissions:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid bulk action data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to bulk update permissions',
      error.status || 500
    );
  }
});
