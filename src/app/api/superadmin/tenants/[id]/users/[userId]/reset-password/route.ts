import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { hashPassword } from '@/lib/jwt';

// POST /api/superadmin/tenants/[id]/users/[userId]/reset-password - Reset user password
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { id: string; userId: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Resetting password for user:', params.userId, 'in tenant:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });

    if (!tenant) {
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Check if user exists and belongs to this tenant
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: params.userId,
        tenantId: params.id
      }
    });

    if (!existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found or does not belong to tenant:', params.userId);
      }
      return createErrorResponse(
        'User not found or does not belong to this tenant',
        404
      );
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { password: hashedPassword }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.password_reset',
      {
        tenantId: params.id,
        tenantName: tenant.name,
        userId: params.userId,
        userName: existingUser.name,
        userEmail: existingUser.email
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Password reset successfully for user: ${existingUser.name}`);
    }

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      },
      newPassword
    }, 'Password reset successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error resetting password:', error);
    }
    throw error;
  }
}); 