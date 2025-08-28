import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid color is required').optional(),
  permissions: z.array(z.object({
    moduleKey: z.string(),
    canCreate: z.boolean().default(false),
    canRead: z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canViewAll: z.boolean().default(false)
  })).min(1, 'At least one permission is required')
});

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
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

const bulkActionSchema = z.object({
  roleIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete'])
});

// GET /api/tenant/[tenantSlug]/roles - Get roles list with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const status = url.searchParams.get('status') || '';
    const isSystem = url.searchParams.get('isSystem') || '';

    // Build where clause - only show roles from this tenant
    const where: any = {
      tenantId: tenantId,
      isGlobal: false // Only tenant-specific roles
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Add status filter
    if (status) {
      where.isActive = status === 'active';
    }

    // Add system role filter
    if (isSystem !== '') {
      where.isSystem = isSystem === 'true';
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch roles with pagination and stats
    const [roles, totalRoles] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      }),
      prisma.role.count({ where })
    ]);

    // Calculate statistics
    const roleStats = {
      total: totalRoles,
      active: roles.filter(r => r.isActive).length,
      inactive: roles.filter(r => !r.isActive).length
    };

    // Format response
    const formattedRoles = roles.map(role => ({
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
    }));

    return createSuccessResponse({
      roles: formattedRoles,
      pagination: {
        page,
        limit,
        total: totalRoles,
        totalPages: Math.ceil(totalRoles / limit),
        hasNext: page * limit < totalRoles,
        hasPrev: page > 1
      },
      stats: roleStats,
      permissions: {
        canView: true, // All authenticated users can view roles in their tenant
        canCreate: true, // Simplified for now
        canUpdate: true,
        canDelete: true
      }
    }, 'Roles retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch roles',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/roles - Create new role
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const body = await req.json();
    const validatedData = createRoleSchema.parse(body);

    // Check if role name already exists within this specific tenant only
    const existingRole = await prisma.role.findFirst({
      where: {
        name: validatedData.name,
        tenantId: tenantId, // Check only within this tenant
        isGlobal: false
      }
    });

    if (existingRole) {
      return createErrorResponse(`Role with name "${validatedData.name}" already exists in this tenant. Please choose a different name.`, 400, [
        { field: 'name', message: 'Role name already exists in this tenant' }
      ]);
    }

    // Create role
    const newRole = await prisma.role.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        tenantId: tenantId,
        isActive: true,
        isGlobal: false,
        isSystem: false,
        isDefault: false,
        priority: 0
      }
    });

    // Create permissions if provided
    if (validatedData.permissions && validatedData.permissions.length > 0) {
      // Verify that all module keys exist
      const moduleKeys = validatedData.permissions.map(p => p.moduleKey);
      const existingModules = await prisma.module.findMany({
        where: { moduleKey: { in: moduleKeys } },
        select: { moduleKey: true }
      });
      
      const existingModuleKeys = existingModules.map(m => m.moduleKey);
      const validPermissions = validatedData.permissions.filter(p => 
        existingModuleKeys.includes(p.moduleKey)
      );

      if (validPermissions.length > 0) {
        const permissionsData = validPermissions.map(permission => ({
          roleId: newRole.id,
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

    return createSuccessResponse({
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        color: newRole.color,
        isActive: newRole.isActive,
        createdAt: newRole.createdAt
      }
    }, 'Role created successfully');

  } catch (error: any) {
    console.error('Error creating role:', error);
    
    // Handle specific database constraint errors
    if (error.code === 'P2002' && error.meta?.target?.includes('roles_name_isGlobal_key')) {
      return createErrorResponse(`Role with name "${validatedData.name}" already exists in this tenant. Please choose a different name.`, 400, [
        { field: 'name', message: 'Role name already exists in this tenant' }
      ]);
    }
    
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return createErrorResponse('Validation failed', 400, validationErrors);
    }
    
    return createErrorResponse(
      error.message || 'Failed to create role',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/roles - Bulk actions
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const body = await req.json();
    const validatedData = bulkActionSchema.parse(body);

    // Verify all roles belong to the tenant and are not system roles
    const roles = await prisma.role.findMany({
      where: {
        id: { in: validatedData.roleIds },
        tenantId: tenantId,
        isGlobal: false
      }
    });

    if (roles.length !== validatedData.roleIds.length) {
      return createErrorResponse('Some roles not found or do not belong to this tenant', 400);
    }

    // Check for system roles that shouldn't be modified
    const systemRoles = roles.filter(role => role.isSystem);
    if (systemRoles.length > 0) {
      return createErrorResponse('Cannot modify system roles', 400);
    }

    let result;
    switch (validatedData.action) {
      case 'activate':
        result = await prisma.role.updateMany({
          where: { 
            id: { in: validatedData.roleIds }, 
            tenantId,
            isGlobal: false,
            isSystem: false
          },
          data: { isActive: true }
        });
        break;
      case 'deactivate':
        result = await prisma.role.updateMany({
          where: { 
            id: { in: validatedData.roleIds }, 
            tenantId,
            isGlobal: false,
            isSystem: false
          },
          data: { isActive: false }
        });
        break;
      case 'delete':
        // Check if roles are assigned to users
        const rolesWithUsers = await prisma.role.findMany({
          where: {
            id: { in: validatedData.roleIds },
            tenantId,
            isGlobal: false,
            isSystem: false
          },
          include: {
            _count: {
              select: { userRoles: true }
            }
          }
        });

        const rolesWithAssignedUsers = rolesWithUsers.filter(role => role._count.userRoles > 0);
        if (rolesWithAssignedUsers.length > 0) {
          return createErrorResponse(
            `Cannot delete roles that are assigned to users: ${rolesWithAssignedUsers.map(r => r.name).join(', ')}`,
            400
          );
        }

        // Delete role permissions first
        await prisma.rolePermission.deleteMany({
          where: { roleId: { in: validatedData.roleIds } }
        });

        result = await prisma.role.deleteMany({
          where: { 
            id: { in: validatedData.roleIds }, 
            tenantId,
            isGlobal: false,
            isSystem: false
          }
        });
        break;
    }

    return createSuccessResponse({
      action: validatedData.action,
      affectedRoles: result.count,
      roleIds: validatedData.roleIds
    }, `Bulk action '${validatedData.action}' completed successfully`);

  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to perform bulk action',
      error.status || 500
    );
  }
});
