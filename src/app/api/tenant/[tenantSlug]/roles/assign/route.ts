import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { z } from 'zod';

const assignRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required')
});

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

    // Check if user has permission to assign roles
    const hasAssignPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.moduleKey === 'roles' && rp.permission.action === 'assign'
      )
    );

    if (!hasAssignPermission) {
      return createErrorResponse('Insufficient permissions to assign roles', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = assignRoleSchema.parse(body);

    // Verify target user belongs to this tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!targetUser) {
      return createErrorResponse('Target user not found or not authorized for this tenant', 404);
    }

    // Verify role belongs to this tenant
    const role = await prisma.role.findFirst({
      where: {
        id: validatedData.roleId,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!role) {
      return createErrorResponse('Role not found', 404);
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userRole.findFirst({
      where: {
        userId: validatedData.userId,
        roleId: validatedData.roleId
      }
    });

    if (existingAssignment) {
      return createErrorResponse('User already has this role', 409);
    }

    // Assign role to user
    const userRole = await prisma.userRole.create({
      data: {
        userId: validatedData.userId,
        roleId: validatedData.roleId,
        assignedBy: user.id
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
            name: true,
            description: true
          }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: user.id,
      email: user.email,
      role: 'user',
      tenantId: tenant.id
    }, 'ASSIGN_ROLE', {
      roleName: role.name,
      targetUserName: targetUser.name,
      targetUserId: targetUser.id
    });

    return createSuccessResponse({
      assignment: userRole,
      message: `Role "${role.name}" assigned to user "${targetUser.name}" successfully`
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.errors.map((e: any) => e.message).join(', '), 400);
    }
    console.error('Error assigning role:', error);
    return createErrorResponse('Failed to assign role', 500);
  }
}
