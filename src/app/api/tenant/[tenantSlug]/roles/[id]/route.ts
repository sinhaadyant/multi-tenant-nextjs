import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { z } from 'zod';

// Validation schemas
const updateRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isDefault: z.boolean().optional(),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional()
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

    // Get role with details
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

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'VIEW_ROLE',
      details: `Viewed role "${role.name}"`,
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
        permissions: role.permissions.map(rp => rp.permission),
        assignedUsers: role.userRoles.map(ur => ur.user)
      }
    });

  } catch (error) {
    console.error('Error fetching role:', error);
    return createErrorResponse('Failed to fetch role', 500);
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
    const validatedData = updateRoleSchema.parse(body);

    // Check if role name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          name: validatedData.name,
          tenantId: tenant.id,
          id: { not: id }
        }
      });

      if (duplicateRole) {
        return createErrorResponse('Role name already exists in this tenant', 409);
      }
    }

    // If this is being set as default, unset other default roles
    if (validatedData.isDefault) {
      await prisma.role.updateMany({
        where: {
          tenantId: tenant.id,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      });
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: validatedData,
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
      action: 'UPDATE_ROLE',
      details: `Updated role "${updatedRole.name}"`,
      tenantId: tenant.id,
      userId: user.id
    });

    return createSuccessResponse({
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isDefault: updatedRole.isDefault,
        isTemplate: updatedRole.isTemplate,
        isSystem: updatedRole.isSystem,
        isActive: updatedRole.isActive,
        color: updatedRole.color,
        priority: updatedRole.priority,
        createdAt: updatedRole.createdAt,
        updatedAt: updatedRole.updatedAt,
        userCount: updatedRole._count.userRoles,
        permissions: updatedRole.permissions.map(rp => rp.permission)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Error updating role:', error);
    return createErrorResponse('Failed to update role', 500);
  }
}

export async function DELETE(
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

    // Check if user has permission to delete roles
    const hasDeletePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.moduleKey === 'roles' && rp.permission.action === 'delete'
      )
    );

    if (!hasDeletePermission) {
      return createErrorResponse('Insufficient permissions to delete roles', 403);
    }

    // Get existing role with user assignments
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        tenantId: tenant.id
      },
      include: {
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

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Prevent deleting system roles
    if (existingRole.isSystem) {
      return createErrorResponse('System roles cannot be deleted', 403);
    }

    // Check if role has assigned users
    if (existingRole._count.userRoles > 0) {
      return createErrorResponse(
        `Cannot delete role "${existingRole.name}" because it has ${existingRole._count.userRoles} assigned users. Please reassign users before deleting this role.`,
        409
      );
    }

    // Delete role (permissions will be cascaded due to foreign key constraints)
    await prisma.role.delete({
      where: { id }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'DELETE_ROLE',
      details: `Deleted role "${existingRole.name}"`,
      tenantId: tenant.id,
      userId: user.id
    });

    return createSuccessResponse({
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return createErrorResponse('Failed to delete role', 500);
  }
}
