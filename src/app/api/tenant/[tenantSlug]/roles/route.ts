import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { z } from 'zod';

// Enhanced validation schemas
const createRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isDefault: z.boolean().default(false),
  isTemplate: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional().or(z.literal('')),
  priority: z.number().int().min(0).max(100).default(0),
  permissions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const updateRoleSchema = createRoleSchema.partial();

const bulkOperationSchema = z.object({
  roleIds: z.array(z.string()).min(1, 'At least one role ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete', 'clone', 'export'])
});

const roleTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  category: z.string().optional()
});

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
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeTemplates = searchParams.get('includeTemplates') === 'true';
    const includeSystem = searchParams.get('includeSystem') === 'true';

    // Build where clause
    const where: any = {
      tenantId: tenant.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (type === 'default') {
      where.isDefault = true;
    } else if (type === 'template') {
      where.isTemplate = true;
    } else if (type === 'custom') {
      where.isTemplate = false;
      where.isDefault = false;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    if (!includeTemplates) {
      where.isTemplate = false;
    }

    if (!includeSystem) {
      where.isSystem = false;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get roles with enhanced data
    const [roles, totalRoles] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: {
                include: {
                  module: true
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
                  email: true,
                  isActive: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc'
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
      isSystem: role.isSystem || false,
      isActive: role.isActive,
      color: role.color || null,
      priority: role.priority || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role.userRoles.length,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        moduleKey: rp.permission.moduleKey,
        moduleName: rp.permission.module.moduleName,
        action: rp.permission.action,
        resource: rp.permission.resource || null,
        category: rp.permission.category || null
      })),
      assignedUsers: role.userRoles.map(ur => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        isActive: ur.user.isActive,
        assignedAt: ur.assignedAt
      }))
    }));

    // Get role statistics
    const roleStats = await prisma.role.groupBy({
      by: ['isActive', 'isTemplate', 'isDefault'],
      where: { tenantId: tenant.id },
      _count: true
    });

    const stats = {
      total: totalRoles,
      active: roleStats.find(s => s.isActive && !s.isTemplate)?._count || 0,
      inactive: roleStats.find(s => !s.isActive && !s.isTemplate)?._count || 0,
      templates: roleStats.find(s => s.isTemplate)?._count || 0,
      default: roleStats.find(s => s.isDefault)?._count || 0
    };

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: user.id,
      email: user.email,
      role: 'user',
      tenantId: tenant.id
    }, 'VIEW_ROLES', `Viewed roles for tenant ${tenant.name}`);

    return createSuccessResponse({
      roles: transformedRoles,
      pagination: {
        page,
        limit,
        total: totalRoles,
        totalPages: Math.ceil(totalRoles / limit)
      },
      stats,
      filters: {
        search,
        status,
        type,
        sortBy,
        sortOrder
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

    const body = await req.json();

    // Handle different POST operations
    const operation = searchParams.get('operation');
    
    if (operation === 'bulk') {
      const bulkData = bulkOperationSchema.parse(body);
      return await handleBulkOperation(bulkData, tenant, user, req);
    }

    if (operation === 'template') {
      const templateData = roleTemplateSchema.parse(body);
      return await handleCreateTemplate(templateData, tenant, user, req);
    }

    // Default: Create role
    const roleData = createRoleSchema.parse(body);

    // Check if role name already exists for this tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        name: roleData.name,
        tenantId: tenant.id
      }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists for this tenant', 409);
    }

    // If setting as default, unset other default roles
    if (roleData.isDefault) {
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

    // Create role with permissions
    const roleDataToCreate: any = {
      name: roleData.name,
      description: roleData.description,
      isDefault: roleData.isDefault,
      isTemplate: roleData.isTemplate,
      priority: roleData.priority,
      tenantId: tenant.id,
      createdBy: user.id
    };

    if (roleData.color) {
      roleDataToCreate.color = roleData.color;
    }

    const role = await prisma.role.create({
      data: roleDataToCreate
    });

    // Assign permissions if provided
    if (roleData.permissions && roleData.permissions.length > 0) {
      const permissionIds = await prisma.permission.findMany({
        where: {
          id: { in: roleData.permissions },
          isActive: true
        },
        select: { id: true }
      });

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(p => ({
            roleId: role.id,
            permissionId: p.id
          }))
        });
      }
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: user.id,
      email: user.email,
      role: 'user',
      tenantId: tenant.id
    }, 'CREATE_ROLE', `Created role "${roleData.name}" for tenant ${tenant.name}`);

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
        userCount: 0,
        permissions: [],
        assignedUsers: []
      }
    }, 'Role created successfully');

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    console.error('Error creating role:', error);
    return createErrorResponse('Failed to create role', 500);
  }
}

// Helper functions for bulk operations
async function handleBulkOperation(
  data: z.infer<typeof bulkOperationSchema>,
  tenant: any,
  user: any,
  req: NextRequest
) {
  const { roleIds, action } = data;

  // Verify all roles belong to this tenant
  const roles = await prisma.role.findMany({
    where: {
      id: { in: roleIds },
      tenantId: tenant.id
    }
  });

  if (roles.length !== roleIds.length) {
    return createErrorResponse('Some roles not found or not accessible', 404);
  }

  let result;
  let auditAction = '';

  switch (action) {
    case 'activate':
      result = await prisma.role.updateMany({
        where: { id: { in: roleIds } },
        data: { isActive: true }
      });
      auditAction = 'BULK_ACTIVATE_ROLES';
      break;

    case 'deactivate':
      result = await prisma.role.updateMany({
        where: { id: { in: roleIds } },
        data: { isActive: false }
      });
      auditAction = 'BULK_DEACTIVATE_ROLES';
      break;

    case 'delete':
      // Check if roles are assigned to users
      const assignedRoles = await prisma.userRole.findMany({
        where: { roleId: { in: roleIds } }
      });

      if (assignedRoles.length > 0) {
        return createErrorResponse('Cannot delete roles that are assigned to users', 400);
      }

      result = await prisma.role.deleteMany({
        where: { id: { in: roleIds } }
      });
      auditAction = 'BULK_DELETE_ROLES';
      break;

    case 'clone':
      const clonedRoles = [];
      for (const roleId of roleIds) {
        const role = await prisma.role.findUnique({
          where: { id: roleId },
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        });

        if (role) {
          const clonedRole = await prisma.role.create({
            data: {
              name: `${role.name} (Copy)`,
              description: role.description,
              color: role.color,
              priority: role.priority,
              tenantId: tenant.id,
              createdBy: user.id,
              isTemplate: false,
              isDefault: false
            }
          });

          // Clone permissions
          if (role.permissions.length > 0) {
            await prisma.rolePermission.createMany({
              data: role.permissions.map(rp => ({
                roleId: clonedRole.id,
                permissionId: rp.permissionId
              }))
            });
          }

          clonedRoles.push(clonedRole);
        }
      }
      result = { count: clonedRoles.length };
      auditAction = 'BULK_CLONE_ROLES';
      break;

    default:
      return createErrorResponse('Invalid bulk operation', 400);
  }

  // Create audit log
  await createAuditLogFromRequest(req, {
    action: auditAction,
    details: `Bulk ${action} operation on ${roleIds.length} roles for tenant ${tenant.name}`,
    tenantId: tenant.id,
    userId: user.id,
    resourceType: 'ROLE',
    newValues: JSON.stringify({ roleIds, action }),
    status: 'success'
  });

  return createSuccessResponse({
    message: `Bulk ${action} operation completed successfully`,
    affectedCount: result.count || result
  });
}

async function handleCreateTemplate(
  data: z.infer<typeof roleTemplateSchema>,
  tenant: any,
  user: any,
  req: NextRequest
) {
  // Create template role
  const template = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      isTemplate: true,
      isDefault: false,
      tenantId: tenant.id,
      createdBy: user.id,
      metadata: JSON.stringify({ category: data.category })
    }
  });

  // Assign permissions
  if (data.permissions.length > 0) {
    const permissionIds = await prisma.permission.findMany({
      where: {
        id: { in: data.permissions },
        isActive: true
      },
      select: { id: true }
    });

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(p => ({
          roleId: template.id,
          permissionId: p.id
        }))
      });
    }
  }

  // Create audit log
  await createAuditLogFromRequest(req, {
    action: 'CREATE_ROLE_TEMPLATE',
    details: `Created role template "${data.name}" for tenant ${tenant.name}`,
    tenantId: tenant.id,
    userId: user.id,
    resourceId: template.id,
    resourceType: 'ROLE_TEMPLATE',
    newValues: JSON.stringify(data),
    status: 'success'
  });

  return createSuccessResponse({
    template: {
      id: template.id,
      name: template.name,
      description: template.description,
      isTemplate: true,
      category: data.category
    }
  }, 'Role template created successfully');
}
