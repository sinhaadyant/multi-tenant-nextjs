import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/tenant/[tenantSlug]/profile - Get current user profile
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
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

    // Get user profile with tenant and roles
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenant: {
          slug: tenantSlug,
          isActive: true
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
            description: true,
            isActive: true,
            plan: true,
            region: true,
            features: true
          }
        },
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

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    // Transform user data (exclude sensitive information)
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant: user.tenant,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
          submodule: rp.permission.submodule
        }))
      }))
    };

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'profile.view', {
      tenantId: user.tenant.id
    });

    return createSuccessResponse({
      user: userProfile
    }, 'Profile retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return createErrorResponse('Failed to fetch profile', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/profile - Update current user profile
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
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

    // Get user
    const user = await prisma.user.findFirst({
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

    if (!user || !user.tenant || user.tenant.slug !== tenantSlug || !user.tenant.isActive) {
      return createErrorResponse('Access denied - Invalid tenant or user not found', 403);
    }

    const { name, contactNumber, currentPassword, newPassword } = await req.json();

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return createErrorResponse('Name is required', 400);
    }

    // If changing password, validate current password
    if (newPassword) {
      if (!currentPassword) {
        return createErrorResponse('Current password is required to change password', 400);
      }

      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return createErrorResponse('Current password is incorrect', 400);
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return createErrorResponse('New password must be at least 8 characters long', 400);
      }
    }

    // Update user profile
    const updateData: any = {
      name: name.trim()
    };

    if (contactNumber !== undefined) {
      updateData.contactNumber = contactNumber;
    }

    if (newPassword) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        isActive: true,
        lastLogin: true,
        updatedAt: true
      }
    });

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'profile.update', {
      tenantId: user.tenant.id,
      passwordChanged: !!newPassword
    });

    return createSuccessResponse({
      user: updatedUser
    }, 'Profile updated successfully');

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return createErrorResponse('Failed to update profile', 500);
  }
}); 