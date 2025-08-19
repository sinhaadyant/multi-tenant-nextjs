import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { hashPassword } from '@/lib/jwt';
import crypto from 'crypto';

// POST /api/superadmin/users/[id]/reset-password - Reset user password
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Resetting password for user:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });

    if (!existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found:', id);
      }
      return createErrorResponse('User not found', 404);
    }

    // Generate a new temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await hashPassword(tempPassword);

    // Update user password
    const user = await prisma.user.update({
      where: { id: id },
      data: { password: hashedPassword },
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        userRoles: {
          include: {
            role: {
              select: { name: true, description: true }
            }
          }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.password_reset',
      {
        userId: user.id,
        userEmail: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Password reset successfully for:', user.email);
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        tenant: user.tenant ? {
          id: user.tenantId,
          name: user.tenant.name,
          slug: user.tenant.slug
        } : null,
        role: user.userRoles[0]?.role ? {
          id: user.userRoles[0].role.id,
          name: user.userRoles[0].role.name,
          description: user.userRoles[0].role.description
        } : null
      },
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
    }, 'Password reset successfully. The user will need to change their password on next login.');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error resetting password:', error);
    }
    throw error;
  }
}); 