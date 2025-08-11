import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';
import { hashPassword } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const { id: tenantId, userId } = params;

      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return createErrorResponse('Tenant not found', 404);
      }

      // Validate user exists and belongs to the tenant
      const existingUser = await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId: tenantId
        }
      });

      if (!existingUser) {
        return createErrorResponse('User not found', 404);
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4) + '1!';
      const hashedPassword = await hashPassword(tempPassword);

      // Update user password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true
        }
      });

      // TODO: Send email notification to user with temporary password
      // For now, we'll return the temporary password in the response
      // In production, this should be sent via email

      return createSuccessResponse({
        user: updatedUser,
        temporaryPassword: tempPassword,
        message: 'Password reset successfully. Temporary password generated.'
      }, 'Password reset successfully');

    } catch (error: any) {
      console.error('Error resetting user password:', error);
      return createErrorResponse('Failed to reset password', 500);
    }
  })(req);
}
