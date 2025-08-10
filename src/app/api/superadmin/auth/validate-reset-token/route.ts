import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return createErrorResponse('Token is required', 400);
    }

    // Find and validate the reset token
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
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

    if (!resetTokenRecord) {
      return createErrorResponse('Invalid reset token', 404);
    }

    if (resetTokenRecord.used) {
      return createErrorResponse('Reset token has already been used', 400);
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      return createErrorResponse('Reset token has expired', 400);
    }

    if (!resetTokenRecord.superAdmin) {
      return createErrorResponse('Associated SuperAdmin not found', 404);
    }

    if (!resetTokenRecord.superAdmin.isActive) {
      return createErrorResponse('Account is inactive', 400);
    }

    return createSuccessResponse({
      isValid: true,
      email: resetTokenRecord.superAdmin.email,
      expiresAt: resetTokenRecord.expiresAt
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 