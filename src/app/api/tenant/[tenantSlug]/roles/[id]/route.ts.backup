import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/tenant/[tenantSlug]/roles/[id] - Get a single role
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
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
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to view roles
    const hasRolePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'roles' && 
        (rp.permission.action === 'read' || rp.permission.action === 'manage')
      )
    );

    if (!hasRolePermission) {
      return createErrorResponse('Insufficient permissions to view roles', 403);
    }

    // Fetch the specific role
    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [
          { tenantId: user.tenant.id }, // Tenant-specific roles
          { isTemplate: true } // Global template roles from SuperAdmin
        ]
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Transform the data
    const transformedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      isTemplate: role.isTemplate,
      isActive: role.isActive,
      isDefault: role.isDefault,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role._count.userRoles,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action
      }))
    };

    return createSuccessResponse({ role: transformedRole }, 'Role retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching role:', error);
    return createErrorResponse('Failed to fetch role', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/roles/[id] - Update a role
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
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
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to update roles
    const hasUpdatePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'roles' && 
        rp.permission.action === 'update'
      )
    );

    if (!hasUpdatePermission) {
      return createErrorResponse('Insufficient permissions to update roles', 403);
    }

    const { name, description, permissions } = await req.json();

    // Check if role exists and belongs to this tenant or is a template
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        OR: [
          { tenantId: user.tenant.id }, // Tenant-specific roles
          { isTemplate: true } // Global template roles from SuperAdmin
        ]
      }
    });

    if (!existingRole) {
      return createErrorResponse('Role not found', 404);
    }

    // Only allow updating tenant-specific roles (not template roles)
    if (existingRole.isTemplate) {
      return createErrorResponse('Cannot modify template roles', 403);
    }

    // Check if new name conflicts with existing role
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: { 
          name: name.trim(),
          tenantId: user.tenant.id,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return createErrorResponse('Role name already exists in this tenant', 409, [
          { field: 'name', message: 'Role name already exists in this tenant' }
        ]);
      }
    }

    // Update role with permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update role
      const updatedRole = await tx.role.update({
        where: { id },
        data: {
          name: name || existingRole.name,
          description: description !== undefined ? description : existingRole.description,
          isActive: existingRole.isActive
        }
      });

      // Update permissions if provided
      if (permissions !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        });

        // Add new permissions
        if (permissions && permissions.length > 0) {
          const rolePermissions = permissions.map((permissionId: string) => ({
            roleId: id,
            permissionId
          }));

          await tx.rolePermission.createMany({
            data: rolePermissions
          });
        }
      }

      return updatedRole;
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'role.update', {
      roleId: result.id,
      roleName: result.name,
      tenantId: user.tenant!.id
    });

    return createSuccessResponse({
      role: {
        id: result.id,
        name: result.name,
        description: result.description,
        isActive: result.isActive,
        updatedAt: result.updatedAt
      }
    }, 'Role updated successfully');
  } catch (error: any) {
    console.error('Error updating role:', error);
    return createErrorResponse('Failed to update role', 500);
  }
});

// DELETE /api/tenant/[tenantSlug]/roles/[id] - Delete a role
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
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
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to delete roles
    const hasDeletePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'roles' && 
        rp.permission.action === 'delete'
      )
    );

    if (!hasDeletePermission) {
      return createErrorResponse('Insufficient permissions to delete roles', 403);
    }

    // Check if role exists and belongs to this tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        tenantId: user.tenant.id // Only tenant-specific roles can be deleted
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

    // Check if role is assigned to any users
    if (existingRole._count.userRoles > 0) {
      return createErrorResponse(
        `Cannot delete role that is assigned to ${existingRole._count.userRoles} user(s). Please reassign or remove users from this role first.`,
        409
      );
    }

    // Delete role (permissions will be cascaded due to foreign key constraints)
    await prisma.role.delete({
      where: { id }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'role.delete', {
      roleId: existingRole.id,
      roleName: existingRole.name,
      tenantId: user.tenant!.id
    });

    return createSuccessResponse({}, 'Role deleted successfully');
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return createErrorResponse('Failed to delete role', 500);
  }
}); 