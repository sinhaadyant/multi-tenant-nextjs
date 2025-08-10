import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET /api/auth/verify - Verify current user's token and return user info
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    if (!req.user) {
      return createErrorResponse('User not found', 404);
    }

    // Fetch user data based on role
    let userData;
    
    if (req.user.role === 'superadmin') {
      userData = await prisma.superAdmin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lastLogin: true,
          createdAt: true
        }
      });
    } else {
      userData = await prisma.user.findFirst({
        where: { 
          id: req.user.id,
          tenantId: req.user.tenantId,
          isActive: true
        },
        include: {
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
    }

    if (!userData) {
      return createErrorResponse('User not found', 404);
    }

    // Check if user is active
    if (!userData.isActive) {
      return createErrorResponse('User account is disabled', 403);
    }

    // For tenant users, check if tenant is active
    if (req.user.role !== 'superadmin' && userData.tenant && !userData.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Format user data
    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: req.user.role,
      tenantId: req.user.tenantId,
      tenantSlug: req.user.tenantSlug,
      isActive: userData.isActive,
      lastLogin: userData.lastLogin,
      createdAt: userData.createdAt,
      tenant: req.user.role !== 'superadmin' ? userData.tenant : undefined
    };

    return createSuccessResponse({
      user,
      isAuthenticated: true
    }, 'Token verified successfully');

  } catch (error: any) {
    console.error('Error verifying token:', error);
    return createErrorResponse('Failed to verify token', 500);
  }
}, { requireAuth: true }); 