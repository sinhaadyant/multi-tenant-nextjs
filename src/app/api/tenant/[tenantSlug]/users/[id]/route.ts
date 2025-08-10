import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

// GET /api/tenant/[tenantSlug]/users/[id] - Get specific user
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.view', {
      userId: user.id,
      email: user.email
    });

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      contactNumber: user.contactNumber,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          module: p.module.name,
          action: p.action
        }))
      })),
      rolesCount: user.userRoles.length
    };

    return createSuccessResponse({ user: userData }, 'User retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return createErrorResponse('Failed to fetch user', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/users/[id] - Update user
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const body = await req.json();

    // Validate request body
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 400, validationResult.error.errors);
    }

    const { name, email, contactNumber, roleIds, isActive } = validationResult.data;

    // Find the user
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId
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

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          tenantId,
          id: { not: id }
        }
      });

      if (emailExists) {
        return createErrorResponse('Email already exists in this tenant', 400);
      }
    }

    // Prevent deactivating the last admin user
    if (isActive === false) {
      const isAdmin = existingUser.userRoles.some(ur => 
        ur.role.name.toLowerCase().includes('admin')
      );

      if (isAdmin) {
        const adminCount = await prisma.user.count({
          where: {
            tenantId,
            isActive: true,
            userRoles: {
              some: {
                role: {
                  name: { contains: 'Admin', mode: 'insensitive' }
                }
              }
            }
          }
        });

        if (adminCount <= 1) {
          return createErrorResponse('Cannot deactivate the last admin user', 400);
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        contactNumber,
        isActive
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

    // Update roles if provided
    if (roleIds !== undefined) {
      // Remove existing role assignments
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Assign new roles
      if (roleIds.length > 0) {
        const roleAssignments = roleIds.map((roleId: string) => ({
          userId: id,
          roleId
        }));

        await prisma.userRole.createMany({
          data: roleAssignments
        });
      }
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.update', {
      userId: updatedUser.id,
      email: updatedUser.email,
      changes: validationResult.data
    });

    return createSuccessResponse({ user: updatedUser }, 'User updated successfully');
  } catch (error: any) {
    console.error('Error updating user:', error);
    return createErrorResponse('Failed to update user', 500);
  }
});

// DELETE /api/tenant/[tenantSlug]/users/[id] - Delete user
export const DELETE = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; id: string }> }) => {
  const { tenantSlug, id } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Prevent deleting admin users
    const isAdmin = user.userRoles.some(ur => 
      ur.role.name.toLowerCase().includes('admin')
    );

    if (isAdmin) {
      return createErrorResponse('Cannot delete admin users', 400);
    }

    // Check if user has any associated data that needs to be handled
    const hasAuditLogs = await prisma.auditLog.findFirst({
      where: { userId: id }
    });

    const hasNotifications = await prisma.notification.findFirst({
      where: { userId: id }
    });

    // For now, we'll allow deletion but log a warning if there's associated data
    if (hasAuditLogs || hasNotifications) {
      console.warn(`Deleting user ${id} with associated data`);
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.delete', {
      userId: user.id,
      email: user.email
    });

    return createSuccessResponse({ message: 'User deleted successfully' }, 'User deleted successfully');
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Failed to delete user', 500);
  }
});
