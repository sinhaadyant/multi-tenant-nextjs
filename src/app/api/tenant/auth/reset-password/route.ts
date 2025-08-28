import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { hashPassword } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword, confirmPassword } = await req.json();

    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return createErrorResponse('All fields are required', 400);
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return createErrorResponse('Passwords do not match', 400);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return createErrorResponse('Password must be at least 8 characters long', 400);
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpperCase || !hasNumber) {
      return createErrorResponse(
        'Password must contain at least one uppercase letter and one number',
        400
      );
    }

    // Find and validate the reset token
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetTokenRecord) {
      return createErrorResponse('Invalid or expired reset token', 400);
    }

    if (resetTokenRecord.used) {
      return createErrorResponse('Reset token has already been used', 400);
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      return createErrorResponse('Reset token has expired', 400);
    }

    // Check if this is a tenant user token
    if (resetTokenRecord.type !== 'tenant') {
      return createErrorResponse('Invalid token type', 400);
    }

    // Find the user in the tenant
    const user = await prisma.user.findFirst({
      where: {
        email: resetTokenRecord.email,
        isActive: true
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
      return createErrorResponse('User not found', 400);
    }

    if (!user.tenant || !user.tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 400);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Mark the token as used
    await prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { used: true }
    });

    // Invalidate all other unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        email: resetTokenRecord.email,
        used: false,
        id: {
          not: resetTokenRecord.id
        }
      },
      data: { used: true }
    });

    // Create audit log for successful password reset
    await createAuditLogFromRequest(
      req,
      { 
        id: user.id, 
        email: user.email, 
        role: 'user' 
      },
      'tenant.password_reset_completed',
      { 
        email: user.email,
        tenantId: user.tenant.id,
        tenantSlug: user.tenant.slug
      }
    );

    return createSuccessResponse({
      message: 'Password has been successfully updated'
    });

  } catch (error) {
    console.error('Tenant reset password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 