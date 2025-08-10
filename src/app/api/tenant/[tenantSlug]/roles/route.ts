import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { z } from 'zod';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isDefault: z.boolean().default(false),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0),
  permissions: z.array(z.string()).optional()
});

const updateRoleSchema = createRoleSchema.partial();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

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

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type'); // 'all', 'custom', 'system', 'template'

    // Build where clause
    const where: any = {
      tenantId: tenant.id
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Filter by type
    if (type === 'custom') {
      where.isSystem = false;
      where.isTemplate = false;
    } else if (type === 'system') {
      where.isSystem = true;
    } else if (type === 'template') {
      where.isTemplate = true;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch roles with pagination
    const [roles, totalRoles] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  moduleKey: true,
                  moduleName: true,
                  action: true,
                  resource: true,
                  category: true
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
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.role.count({ where })
    ]);

    // Transform data for response
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      isTemplate: role.isTemplate,
      isSystem: role.isSystem,
      isActive: role.isActive,
      color: role.color,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
      permissions: role.permissions.map(rp => rp.permission),
      assignedUsers: role.userRoles.map(ur => ur.user)
    }));

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'VIEW_ROLES',
      details: `Viewed roles for tenant ${tenant.name}`,
      tenantId: tenant.id,
      userId: user.id
    });

    return createSuccessResponse({
      roles: transformedRoles,
      pagination: {
        page,
        limit,
        total: totalRoles,
        totalPages: Math.ceil(totalRoles / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return createErrorResponse('Failed to fetch roles', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

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

    // Check if user has permission to create roles
    const hasCreatePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.moduleKey === 'roles' && rp.permission.action === 'create'
      )
    );

    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create roles', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createRoleSchema.parse(body);

    // Check if role name already exists in this tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        name: validatedData.name,
        tenantId: tenant.id
      }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists in this tenant', 409);
    }

    // If this is being set as default, unset other default roles
    if (validatedData.isDefault) {
      await prisma.role.updateMany({
        where: {
          tenantId: tenant.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isDefault: validatedData.isDefault,
        color: validatedData.color,
        priority: validatedData.priority,
        tenantId: tenant.id,
        createdBy: user.id
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    // Assign permissions if provided
    if (validatedData.permissions && validatedData.permissions.length > 0) {
      const permissionAssignments = validatedData.permissions.map(permissionId => ({
        roleId: role.id,
        permissionId
      }));

      await prisma.rolePermission.createMany({
        data: permissionAssignments,
        skipDuplicates: true
      });

      // Refresh role data with permissions
      const roleWithPermissions = await prisma.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: {
              userRoles: true
            }
          }
        }
      });

      // Create audit log
      await createAuditLogFromRequest(req, {
        action: 'CREATE_ROLE',
        details: `Created role "${role.name}" with ${validatedData.permissions.length} permissions`,
        tenantId: tenant.id,
        userId: user.id
      });

      return createSuccessResponse({
        role: {
          id: roleWithPermissions!.id,
          name: roleWithPermissions!.name,
          description: roleWithPermissions!.description,
          isDefault: roleWithPermissions!.isDefault,
          isTemplate: roleWithPermissions!.isTemplate,
          isSystem: roleWithPermissions!.isSystem,
          isActive: roleWithPermissions!.isActive,
          color: roleWithPermissions!.color,
          priority: roleWithPermissions!.priority,
          createdAt: roleWithPermissions!.createdAt,
          updatedAt: roleWithPermissions!.updatedAt,
          userCount: roleWithPermissions!._count.userRoles,
          permissions: roleWithPermissions!.permissions.map(rp => rp.permission)
        }
      });
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'CREATE_ROLE',
      details: `Created role "${role.name}"`,
      tenantId: tenant.id,
      userId: user.id
    });

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isDefault: role.isDefault,
        isTemplate: role.isTemplate,
        isSystem: role.isSystem,
        isActive: role.isActive,
        color: role.color,
        priority: role.priority,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.userRoles,
        permissions: role.permissions.map(rp => rp.permission)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Error creating role:', error);
    return createErrorResponse('Failed to create role', 500);
  }
}
