import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';

export const POST = asyncHandler(async (req: NextRequest) => {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return createErrorResponse('Refresh token is required', 400);
    }

    // Verify refresh token
    let refreshPayload;
    try {
      refreshPayload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return createErrorResponse('Invalid or expired refresh token', 401);
    }

    // Find the user associated with this refresh token
    const user = await prisma.user.findUnique({
      where: {
        id: refreshPayload.id
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

    if (!user) {
      return createErrorResponse('User not found', 401);
    }

    if (!user.isActive) {
      return createErrorResponse('User account is inactive', 401);
    }

    if (!user.tenant || !user.tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 401);
    }

    // Generate new token pair
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: 'user',
      tenantId: user.tenant.id,
      tenantSlug: user.tenant.slug
    };

    const tokenPair = generateTokenPair(tokenPayload, false); // Default to session storage for refresh

    // Get request info for device tracking
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const remoteAddress = req.headers.get('x-real-ip') || req.ip;
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : remoteAddress;

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { 
        id: user.id, 
        email: user.email, 
        role: 'user' 
      },
      'user.token_refreshed',
      { 
        previousTokenId: refreshPayload.tokenId,
        newTokenId: (verifyRefreshToken(tokenPair.refreshToken) as any).tokenId,
        deviceInfo: userAgent,
        ipAddress: ipAddress || 'Unknown',
        tenantId: user.tenant.id,
        tenantSlug: user.tenant.slug
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token refresh successful for tenant user:', user.email, 'in tenant:', user.tenant.slug);
    }

    return createSuccessResponse({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresAt: tokenPair.expiresAt,
      refreshExpiresAt: tokenPair.refreshExpiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'user',
        tenantId: user.tenant.id,
        tenantSlug: user.tenant.slug
      }
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
