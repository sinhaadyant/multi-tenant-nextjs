import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const { id: tenantId, userId } = params;
      const body = await req.json();
      const { isActive } = body;

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

      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          updatedAt: true
        }
      });

      return createSuccessResponse({
        user: updatedUser,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      }, 'User status updated successfully');

    } catch (error: any) {
      console.error('Error updating user status:', error);
      return createErrorResponse('Failed to update user status', 500);
    }
  })(req);
}
