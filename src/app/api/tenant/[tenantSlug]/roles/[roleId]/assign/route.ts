import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const assignRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

// POST /api/tenant/[tenantSlug]/roles/[roleId]/assign - Assign role to user
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; roleId: string }> }) => {
  const { tenantSlug, roleId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check assign permission
    const hasAssignPermission = await checkTenantPermission(req.user!, tenantId!, 'roles.assign');
    if (!hasAssignPermission) {
      return createErrorResponse('Insufficient permissions to assign roles', 403);
    }

    const body = await req.json();
    const validatedData = assignRoleSchema.parse(body);

    // Check if role exists and belongs to tenant
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: tenantId,
        isGlobal: false
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Check if user exists and belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        tenantId: tenantId
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Check if role is already assigned to user
    const existingAssignment = await prisma.userRole.findFirst({
      where: {
        userId: validatedData.userId,
        roleId: roleId
      }
    });

    if (existingAssignment) {
      return createErrorResponse('Role is already assigned to this user', 400);
    }

    // Assign role to user
    const userRole = await prisma.userRole.create({
      data: {
        userId: validatedData.userId,
        roleId: roleId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'role.assigned', {
      details: `Assigned role "${role.name}" to user "${user.name}"`,
      resource: 'userRole',
      resourceId: userRole.id,
      metadata: {
        userId: validatedData.userId,
        roleId: roleId
      }
    });

    return createSuccessResponse({
      assignment: {
        id: userRole.id,
        userId: userRole.user.id,
        userName: userRole.user.name,
        userEmail: userRole.user.email,
        roleId: userRole.role.id,
        roleName: userRole.role.name,
        assignedAt: userRole.createdAt
      }
    }, 'Role assigned successfully');

  } catch (error: any) {
    console.error('Error assigning role:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to assign role',
      error.status || 500
    );
  }
});

// DELETE /api/tenant/[tenantSlug]/roles/[roleId]/assign - Remove role from user
export const DELETE = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; roleId: string }> }) => {
  const { tenantSlug, roleId } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check remove permission
    const hasRemovePermission = await checkTenantPermission(req.user!, tenantId!, 'roles.remove');
    if (!hasRemovePermission) {
      return createErrorResponse('Insufficient permissions to remove roles', 403);
    }

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Check if role assignment exists
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: targetUserId,
        roleId: roleId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!userRole) {
      return createErrorResponse('Role assignment not found', 404);
    }

    // Verify user belongs to tenant
    if (userRole.user.id !== targetUserId) {
      return createErrorResponse('User not found in this tenant', 404);
    }

    // Prevent removing the last admin role
    if (userRole.role.name.toLowerCase() === 'admin') {
      const adminUsers = await prisma.userRole.count({
        where: {
          role: {
            name: { contains: 'admin', mode: 'insensitive' },
            tenantId: tenantId
          }
        }
      });

      if (adminUsers <= 1) {
        return createErrorResponse('Cannot remove the last admin user', 400);
      }
    }

    // Remove role assignment
    await prisma.userRole.delete({
      where: {
        id: userRole.id
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'role.removed', {
      details: `Removed role "${userRole.role.name}" from user "${userRole.user.name}"`,
      resource: 'userRole',
      resourceId: userRole.id,
      metadata: {
        userId: targetUserId,
        roleId: roleId
      }
    });

    return createSuccessResponse({
      removed: {
        userId: userRole.user.id,
        userName: userRole.user.name,
        roleId: userRole.role.id,
        roleName: userRole.role.name
      }
    }, 'Role removed successfully');

  } catch (error: any) {
    console.error('Error removing role:', error);
    return createErrorResponse(
      error.message || 'Failed to remove role',
      error.status || 500
    );
  }
});
