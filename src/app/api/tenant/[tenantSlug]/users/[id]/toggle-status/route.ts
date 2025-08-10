import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// PATCH /api/tenant/[tenantSlug]/users/[id]/toggle-status - Toggle user active status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Verify user belongs to the tenant and has admin permissions
    const currentUser = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true,
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

    if (!currentUser || !currentUser.tenant || currentUser.tenant.slug !== tenantSlug || !currentUser.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Check if user has permission to update users
    const canUpdateUsers = currentUser.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'users' && 
        (rp.permission.action === 'update' || rp.permission.action === 'manage')
      )
    );

    if (!canUpdateUsers) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    // Prevent self-deactivation
    if (id === currentUser.id) {
      return createErrorResponse('Cannot deactivate your own account', 400);
    }

    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return createErrorResponse('isActive must be a boolean value', 400);
    }

    // Check if user exists
    const userToUpdate = await prisma.user.findFirst({
      where: {
        id,
        tenantId: currentUser.tenant.id
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!userToUpdate) {
      return createErrorResponse('User not found', 404);
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'users.toggle-status', {
      tenantId: currentUser.tenant.id,
      userId: id,
      userEmail: updatedUser.email,
      newStatus: isActive
    });

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        roles: updatedUser.userRoles.map(ur => ur.role)
      }
    }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);

  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return createErrorResponse('Failed to toggle user status', 500);
  }
}); 