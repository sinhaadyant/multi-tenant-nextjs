import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
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

    // Get user details from database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { 
        id: userPayload.id,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      }
    });

    if (!superAdmin) {
      return createErrorResponse('User not found', 401);
    }

    return createSuccessResponse({
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        avatar: superAdmin.avatar,
        role: 'superadmin'
      },
      token: {
        valid: true,
        expiresAt: userPayload.exp ? userPayload.exp * 1000 : null
      }
    }, 'Token is valid');

  } catch (error: any) {
    console.error('Token validation error:', error);
    return createErrorResponse('Token validation failed', 500);
  }
}