import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for cloning
const cloneRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional()
});

export async function POST(
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

    // Check if user has permission to create roles
    const hasCreatePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.moduleKey === 'roles' && rp.permission.action === 'create'
      )
    );

    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create roles', 403);
    }

    // Get the role to clone
    const sourceRole = await prisma.role.findFirst({
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

    if (!sourceRole) {
      return createErrorResponse('Source role not found', 404);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = cloneRoleSchema.parse(body);

    // Check if new role name already exists in this tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        name: validatedData.name,
        tenantId: tenant.id
      }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists in this tenant', 409);
    }

    // Clone the role with permissions in a transaction
    const clonedRole = await prisma.$transaction(async (tx) => {
      // Create the new role
      const newRole = await tx.role.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || `Copy of ${sourceRole.name}`,
          isDefault: false, // Cloned roles are never default
          isTemplate: false, // Cloned roles are never templates
          isSystem: false, // Cloned roles are never system roles
          isActive: sourceRole.isActive,
          color: validatedData.color || sourceRole.color,
          priority: validatedData.priority || sourceRole.priority,
          tenantId: tenant.id,
          createdBy: user.id
        }
      });

      // Clone all permissions from the source role
      if (sourceRole.permissions.length > 0) {
        const permissionAssignments = sourceRole.permissions.map(rp => ({
          roleId: newRole.id,
          permissionId: rp.permission.id
        }));

        await tx.rolePermission.createMany({
          data: permissionAssignments,
          skipDuplicates: true
        });
      }

      return newRole;
    });

    // Fetch the cloned role with permissions
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: clonedRole.id },
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
      action: 'CLONE_ROLE',
      details: `Cloned role "${sourceRole.name}" to "${validatedData.name}" with ${sourceRole.permissions.length} permissions`,
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
      },
      message: `Role "${sourceRole.name}" cloned successfully as "${validatedData.name}"`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Error cloning role:', error);
    return createErrorResponse('Failed to clone role', 500);
  }
} 