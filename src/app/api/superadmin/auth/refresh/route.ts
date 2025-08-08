import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyRefreshToken, generateTokenPair, hashPassword } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
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

    // Hash the refresh token to find it in database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Find the refresh token in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenId: refreshPayload.tokenId,
        superAdminId: refreshPayload.id,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        superAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          }
        }
      }
    });

    if (!storedToken) {
      return createErrorResponse('Refresh token not found or expired', 401);
    }

    if (!storedToken.superAdmin) {
      return createErrorResponse('Associated SuperAdmin not found', 401);
    }

    if (!storedToken.superAdmin.isActive) {
      return createErrorResponse('Account is inactive', 401);
    }

    // Generate new token pair
    const tokenPair = generateTokenPair({
      id: storedToken.superAdmin.id,
      email: storedToken.superAdmin.email,
      role: 'superadmin',
    });

    // Get request info for device tracking
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const remoteAddress = req.headers.get('x-real-ip') || req.ip;
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : remoteAddress;

    // Revoke the old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { 
        isRevoked: true,
        lastUsedAt: new Date()
      }
    });

    // Store the new refresh token
    const newHashedRefreshToken = await bcrypt.hash(tokenPair.refreshToken, 10);
    await prisma.refreshToken.create({
      data: {
        tokenId: (verifyRefreshToken(tokenPair.refreshToken) as any).tokenId,
        hashedToken: newHashedRefreshToken,
        superAdminId: storedToken.superAdmin.id,
        expiresAt: new Date(tokenPair.refreshExpiresAt),
        deviceInfo: userAgent,
        ipAddress: ipAddress || 'Unknown',
      }
    });

    // Update last used timestamp
    await prisma.refreshToken.updateMany({
      where: {
        superAdminId: storedToken.superAdmin.id,
        isRevoked: false,
      },
      data: {
        lastUsedAt: new Date()
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { 
        id: storedToken.superAdmin.id, 
        email: storedToken.superAdmin.email, 
        role: 'superadmin' 
      },
      'superadmin.token_refreshed',
      { 
        previousTokenId: refreshPayload.tokenId,
        newTokenId: (verifyRefreshToken(tokenPair.refreshToken) as any).tokenId,
        deviceInfo: userAgent,
        ipAddress: ipAddress || 'Unknown'
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token refresh successful for:', storedToken.superAdmin.email);
    }

    return createSuccessResponse({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresAt: tokenPair.expiresAt,
      user: {
        id: storedToken.superAdmin.id,
        email: storedToken.superAdmin.email,
        name: storedToken.superAdmin.name,
        role: 'superadmin'
      }
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}