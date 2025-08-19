import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
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
  permissions: z.array(z.object({
    permissionId: z.string(),
    canCreate: z.boolean().default(false),
    canRead: z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canViewAll: z.boolean().default(false),
  })).optional(),
  isGlobal: z.boolean().optional(),
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
                permissions: true
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
        rp.moduleKey === 'roles' && rp.canRead
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
    const roleType = searchParams.get('roleType') || 'all'; // 'global', 'tenant', 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeTemplates = searchParams.get('includeTemplates') === 'true';
    const includeSystem = searchParams.get('includeSystem') === 'true';

    // Build where clause for tenant roles
    const tenantWhere: any = {
      tenantId: tenant.id,
    };

    if (search) {
      tenantWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'active') {
      tenantWhere.isActive = true;
    } else if (status === 'inactive') {
      tenantWhere.isActive = false;
    }

    if (type === 'default') {
      tenantWhere.isDefault = true;
    } else if (type === 'template') {
      tenantWhere.isTemplate = true;
    } else if (type === 'custom') {
      tenantWhere.isTemplate = false;
      tenantWhere.isDefault = false;
    }

    if (!includeInactive) {
      tenantWhere.isActive = true;
    }

    if (!includeTemplates) {
      tenantWhere.isTemplate = false;
    }

    if (!includeSystem) {
      tenantWhere.isSystem = false;
    }

    // Build where clause for global roles (read-only for tenants)
    const globalWhere: any = {
      isGlobal: true,
      isActive: true, // Only show active global roles
    };

    if (search) {
      globalWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let roles: any[] = [];
    let totalRoles = 0;

    if (roleType === 'global' || roleType === 'all') {
      // Fetch global roles (read-only for tenants)
      const [globalRoles, globalCount] = await Promise.all([
        prisma.role.findMany({
          where: globalWhere,
          include: {
            permissions: {
              include: {
                module: true
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
          skip: roleType === 'global' ? skip : 0,
          take: roleType === 'global' ? limit : 100 // Limit global roles when fetching all
        }),
        prisma.role.count({ where: globalWhere })
      ]);

      // Mark global roles as read-only
      const globalRolesWithType = globalRoles.map(role => ({
        ...role,
        isGlobal: true,
        isReadOnly: true,
        canEdit: false
      }));

      if (roleType === 'global') {
        roles = globalRolesWithType;
        totalRoles = globalCount;
      } else {
        roles = globalRolesWithType;
        totalRoles = globalCount;
      }
    }

    if (roleType === 'tenant' || roleType === 'all') {
      // Fetch tenant roles
      const [tenantRoles, tenantCount] = await Promise.all([
        prisma.role.findMany({
          where: tenantWhere,
          include: {
            permissions: {
              include: {
                module: true
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
          skip: roleType === 'tenant' ? skip : 0,
          take: roleType === 'tenant' ? limit : 100
        }),
        prisma.role.count({ where: tenantWhere })
      ]);

      // Mark tenant roles as editable
      const tenantRolesWithType = tenantRoles.map(role => ({
        ...role,
        isGlobal: false,
        isReadOnly: false,
        canEdit: true
      }));

      if (roleType === 'tenant') {
        roles = tenantRolesWithType;
        totalRoles = tenantCount;
      } else {
        roles = [...roles, ...tenantRolesWithType];
        totalRoles += tenantCount;
      }
    }

    // Transform roles to include granular permissions
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isGlobal: role.isGlobal,
      isReadOnly: role.isReadOnly,
      canEdit: role.canEdit,
      isDefault: role.isDefault,
      isTemplate: role.isTemplate,
      isSystem: role.isSystem,
      color: role.color,
      priority: role.priority,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role.userRoles.length,
      permissions: role.permissions.map((rp: any) => ({
        moduleKey: rp.moduleKey,
        moduleName: rp.module.moduleName,
        canCreate: rp.canCreate,
        canRead: rp.canRead,
        canUpdate: rp.canUpdate,
        canDelete: rp.canDelete,
        canViewAll: rp.canViewAll,
      })),
      users: role.userRoles.map((ur: any) => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        isActive: ur.user.isActive
      }))
    }));

    // Sort combined results if fetching all
    if (roleType === 'all') {
      transformedRoles.sort((a: any, b: any) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply pagination to combined results
      const startIndex = skip;
      const endIndex = startIndex + limit;
      const paginatedRoles = transformedRoles.slice(startIndex, endIndex);

      return createSuccessResponse({
        roles: paginatedRoles,
        pagination: {
          page,
          limit,
          totalRoles,
          totalPages: Math.ceil(totalRoles / limit),
          hasNext: endIndex < totalRoles,
          hasPrev: page > 1
        }
      }, 'Roles retrieved successfully');
    }

    return createSuccessResponse({
      roles: transformedRoles,
      pagination: {
        page,
        limit,
        totalRoles,
        totalPages: Math.ceil(totalRoles / limit),
        hasNext: page * limit < totalRoles,
        hasPrev: page > 1
      }
    }, 'Roles retrieved successfully');

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
        rp.permission.moduleKey === 'roles' && rp.canCreate
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

    // Ensure tenants can only create tenant roles (not global roles)
    if (roleData.isGlobal !== undefined && roleData.isGlobal) {
      return createErrorResponse('Tenants cannot create global roles', 403);
    }

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
      tenantId: tenant.id, // Always set tenant ID for tenant roles
      color: roleData.color,
      isActive: true,
      createdBy: user.id
    };

    // Create role and permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: roleDataToCreate
      });

      // Assign permissions if provided
      if (roleData.permissions && roleData.permissions.length > 0) {
        const rolePermissions = roleData.permissions.map((permissionData: any) => ({
          roleId: role.id,
          permissionId: permissionData.permissionId || permissionData.id,
          canCreate: permissionData.canCreate || false,
          canRead: permissionData.canRead || false,
          canUpdate: permissionData.canUpdate || false,
          canDelete: permissionData.canDelete || false,
          canViewAll: permissionData.canViewAll || false,
        }));

        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }

      return role;
    });

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: result.id },
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
      }
    });

    if (!createdRole) {
      throw new Error('Failed to fetch created role');
    }

    // Transform the data
    const transformedRole = {
      id: createdRole.id,
      name: createdRole.name,
      description: createdRole.description,
      isActive: createdRole.isActive,
      isGlobal: false, // Tenant roles are never global
      isReadOnly: false,
      canEdit: true,
      isDefault: createdRole.isDefault,
      isTemplate: createdRole.isTemplate,
      isSystem: createdRole.isSystem,
      color: createdRole.color,
      priority: createdRole.priority,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
      userCount: createdRole.userRoles.length,
      permissions: createdRole.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        moduleKey: rp.permission.moduleKey,
        action: rp.permission.action,
        canCreate: rp.canCreate,
        canRead: rp.canRead,
        canUpdate: rp.canUpdate,
        canDelete: rp.canDelete,
        canViewAll: rp.canViewAll,
      })),
      users: createdRole.userRoles.map((ur: any) => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        isActive: ur.user.isActive
      }))
    };

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: user.id,
      email: user.email,
      role: 'user',
      tenantId: tenant.id
    }, 'CREATE_ROLE', `Created role "${roleData.name}" for tenant ${tenant.name}`);

    return createSuccessResponse({ role: transformedRole }, 'Role created successfully', 201);

  } catch (error) {
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
