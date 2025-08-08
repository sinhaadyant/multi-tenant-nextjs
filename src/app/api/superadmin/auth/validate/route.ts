import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('No authorization token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify the access token
    let userPayload;
    try {
      userPayload = verifyAccessToken(token);
    } catch (error) {
      return createErrorResponse('Invalid or expired token', 401);
    }

    // Verify user still exists and is active
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: userPayload.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        avatar: true,
      }
    });

    if (!superAdmin) {
      return createErrorResponse('User not found', 401);
    }

    if (!superAdmin.isActive) {
      return createErrorResponse('Account is inactive', 401);
    }

    // Check if user has any active refresh tokens (session exists)
    const hasActiveSession = await prisma.refreshToken.findFirst({
      where: {
        superAdminId: userPayload.id,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!hasActiveSession) {
      return createErrorResponse('No active session found', 401);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token validation successful for:', superAdmin.email);
    }

    return createSuccessResponse({
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: 'superadmin',
        avatar: superAdmin.avatar,
      },
      tokenValid: true,
      hasActiveSession: true,
    }, 'Token is valid');

  } catch (error) {
    console.error('Token validation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}