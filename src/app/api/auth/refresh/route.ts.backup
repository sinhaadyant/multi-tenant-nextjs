import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';

// POST /api/auth/refresh - Refresh access token using refresh token
export const POST = asyncHandler(async (req: NextRequest) => {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return createErrorResponse('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return createErrorResponse('Invalid refresh token', 401);
    }

    // Check if user exists and is active
    let user;
    if (decoded.role === 'superadmin') {
      user = await prisma.superAdmin.findUnique({
        where: { 
          id: decoded.id,
          isActive: true
        }
      });
    } else {
      user = await prisma.user.findFirst({
        where: { 
          id: decoded.id,
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

    if (!user) {
      return createErrorResponse('User not found or inactive', 401);
    }

    // For tenant users, check if tenant is active
    if (decoded.role !== 'superadmin' && user.tenant && !user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Generate new token pair
    const tokenPair = generateTokenPair({
      id: user.id,
      email: user.email,
      role: decoded.role as 'superadmin' | 'user',
      tenantId: decoded.role !== 'superadmin' ? user.tenantId : undefined,
      tenantSlug: decoded.role !== 'superadmin' ? user.tenant?.slug : undefined
    });

    return createSuccessResponse({
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresAt: tokenPair.expiresAt,
      refreshExpiresAt: tokenPair.refreshExpiresAt
    }, 'Token refreshed successfully');

  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return createErrorResponse('Failed to refresh token', 500);
  }
}); 