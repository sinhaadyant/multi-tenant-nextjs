import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/users/[id] - Get specific user details
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
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

    // Verify user belongs to the tenant
    const currentUser = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: true
      }
    });

    if (!currentUser || !currentUser.tenant || currentUser.tenant.slug !== tenantSlug || !currentUser.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Fetch the requested user
    const user = await prisma.user.findFirst({
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

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'users.view', {
      tenantId: currentUser.tenant.id,
      userId: user.id,
      userEmail: user.email
    });

    return createSuccessResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles.map(ur => ur.role)
      }
    }, 'User details retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return createErrorResponse('Failed to fetch user details', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/users/[id] - Update user
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
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

    const body = await req.json();
    const { name, email, isActive, roleIds } = body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
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
                name: true
              }
            }
          }
        }
      }
    });

    if (!existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          tenantId: currentUser.tenant.id,
          id: { not: id }
        }
      });

      if (emailExists) {
        return createErrorResponse('User with this email already exists', 409);
      }
    }

    // Update user
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    // Update roles if provided
    if (roleIds !== undefined) {
      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Add new roles
      if (roleIds.length > 0) {
        const userRoles = roleIds.map((roleId: string) => ({
          userId: id,
          roleId
        }));

        await prisma.userRole.createMany({
          data: userRoles
        });

        // Fetch updated user with new roles
        const userWithRoles = await prisma.user.findUnique({
          where: { id },
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

        await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'users.update', {
          tenantId: currentUser.tenant.id,
          userId: id,
          userEmail: updatedUser.email,
          changes: { name, email, isActive, roleIds }
        });

        return createSuccessResponse({
          user: {
            id: userWithRoles!.id,
            name: userWithRoles!.name,
            email: userWithRoles!.email,
            isActive: userWithRoles!.isActive,
            lastLogin: userWithRoles!.lastLogin,
            createdAt: userWithRoles!.createdAt,
            updatedAt: userWithRoles!.updatedAt,
            roles: userWithRoles!.userRoles.map(ur => ur.role)
          }
        }, 'User updated successfully');
      }
    }

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'users.update', {
      tenantId: currentUser.tenant.id,
      userId: id,
      userEmail: updatedUser.email,
      changes: { name, email, isActive }
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
    }, 'User updated successfully');

  } catch (error: any) {
    console.error('Error updating user:', error);
    return createErrorResponse('Failed to update user', 500);
  }
});

// DELETE /api/tenant/[tenantSlug]/users/[id] - Delete user
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
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

    // Check if user has permission to delete users
    const canDeleteUsers = currentUser.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'users' && 
        (rp.permission.action === 'delete' || rp.permission.action === 'manage')
      )
    );

    if (!canDeleteUsers) {
      return createErrorResponse('Access denied - Insufficient permissions', 403);
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      return createErrorResponse('Cannot delete your own account', 400);
    }

    // Check if user exists
    const userToDelete = await prisma.user.findFirst({
      where: {
        id,
        tenantId: currentUser.tenant.id
      }
    });

    if (!userToDelete) {
      return createErrorResponse('User not found', 404);
    }

    // Delete user roles first
    await prisma.userRole.deleteMany({
      where: { userId: id }
    });

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    await createAuditLogFromRequest(req, { id: currentUser.id, email: currentUser.email, role: 'user' }, 'users.delete', {
      tenantId: currentUser.tenant.id,
      userId: id,
      userEmail: userToDelete.email
    });

    return createSuccessResponse({}, 'User deleted successfully');

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Failed to delete user', 500);
  }
}); 