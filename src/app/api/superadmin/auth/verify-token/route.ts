import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Verifying invite token');
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ No token provided');
    }
    return createErrorResponse(
      'Token is required',
      400,
      [{ field: 'token', message: 'Token is required' }]
    );
  }

  try {
    // Find the invite token
    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token, isUsed: false }
    });

    if (!inviteToken) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invalid or used invite token');
      }
      return createSuccessResponse({
        isValid: false,
        message: 'Invalid or used invite token'
      }, 'Token verification completed');
    }

    // Check if token is expired
    if (inviteToken.expiresAt < new Date()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invite token has expired');
      }
      return createSuccessResponse({
        isValid: false,
        message: 'Invite token has expired'
      }, 'Token verification completed');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Invite token is valid');
    }

    return createSuccessResponse({
      isValid: true,
      email: inviteToken.email
    }, 'Token verification completed');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error verifying token:', error);
    }
    throw error;
  }
}); 