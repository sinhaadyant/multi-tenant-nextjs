import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).max(1, 'Only one role can be assigned per user').optional(),
  isActive: z.boolean().optional(),
  isFirstLogin: z.boolean().optional()
});

// GET /api/tenant/[tenantSlug]/users/[userId] - Get specific user
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; userId: string }> }) => {
  const { tenantSlug, userId } = await params;
  
  try {
    const currentUserId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId, 'users.view');
    const hasViewAllPermission = await checkTenantPermission(req.user!, tenantId, 'users.viewAll');

    if (!hasViewPermission && !hasViewAllPermission) {
      return createErrorResponse('Insufficient permissions to view users', 403);
    }

    // If user doesn't have viewAll permission, they can only view their own profile
    if (!hasViewAllPermission && userId !== currentUserId) {
      return createErrorResponse('Insufficient permissions to view this user', 403);
    }

    // Fetch user
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true
              }
            }
          }
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            action: true,
            details: true,
            createdAt: true,
            ipAddress: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Format response
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map(ur => ur.role),
      recentActivity: user.auditLogs
    };

    return createSuccessResponse({
      user: formattedUser,
      permissions: {
        canUpdate: await checkTenantPermission(req.user!, tenantId, 'users.update'),
        canDelete: await checkTenantPermission(req.user!, tenantId, 'users.delete')
      }
    }, 'User retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch user',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/users/[userId] - Update user
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; userId: string }> }) => {
  const { tenantSlug, userId } = await params;
  
  try {
    const currentUserId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check update permission
    const hasUpdatePermission = await checkTenantPermission(req.user!, tenantId, 'users.update');
    if (!hasUpdatePermission) {
      return createErrorResponse('Insufficient permissions to update users', 403);
    }

    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId
      }
    });

    if (!existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          tenantId: tenantId,
          id: { not: userId }
        }
      });

      if (emailExists) {
        return createErrorResponse('Email already exists in this tenant', 400);
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.contactNumber !== undefined) updateData.contactNumber = validatedData.contactNumber;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.isFirstLogin !== undefined) updateData.isFirstLogin = validatedData.isFirstLogin;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // Update roles if provided
    if (validatedData.roleIds !== undefined) {
      // Delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: userId }
      });

      // Assign new roles
      if (validatedData.roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: validatedData.roleIds.map(roleId => ({
            userId: userId,
            roleId: roleId
          }))
        });
      }
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'user.updated',
      details: `Updated user: ${updatedUser.name} (${updatedUser.email})`,
      resource: 'user',
      resourceId: userId
    });

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber,
        isActive: updatedUser.isActive,
        isFirstLogin: (updatedUser as any).isFirstLogin,
        updatedAt: updatedUser.updatedAt
      }
    }, 'User updated successfully');

  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to update user',
      error.status || 500
    );
  }
});

// DELETE /api/tenant/[tenantSlug]/users/[userId] - Delete user
export const DELETE = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; userId: string }> }) => {
  const { tenantSlug, userId } = await params;
  
  try {
    const currentUserId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check delete permission
    const hasDeletePermission = await checkTenantPermission(req.user!, tenantId, 'users.delete');
    if (!hasDeletePermission) {
      return createErrorResponse('Insufficient permissions to delete users', 403);
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      return createErrorResponse('Cannot delete your own account', 400);
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // Check if user is the last admin (optional safety check)
    const adminUsers = await prisma.user.count({
      where: {
        tenantId: tenantId,
        userRoles: {
          some: {
            role: {
              name: { contains: 'Admin' }
            }
          }
        }
      }
    });

    const isAdmin = existingUser.userRoles.some(ur => 
      ur.role.name.toLowerCase().includes('admin')
    );

    if (isAdmin && adminUsers <= 1) {
      return createErrorResponse('Cannot delete the last admin user', 400);
    }

    // Delete user roles first
    await prisma.userRole.deleteMany({
      where: { userId: userId }
    });

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'user.deleted',
      details: `Deleted user: ${existingUser.name} (${existingUser.email})`,
      resource: 'user',
      resourceId: userId
    });

    return createSuccessResponse({
      message: 'User deleted successfully',
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      }
    }, 'User deleted successfully');

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return createErrorResponse(
      error.message || 'Failed to delete user',
      error.status || 500
    );
  }
});
