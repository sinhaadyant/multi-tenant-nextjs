import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

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
      return createErrorResponse('Invalid or expired reset token', 400);
    }

    if (resetTokenRecord.used) {
      return createErrorResponse('Reset token has already been used', 400);
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      return createErrorResponse('Reset token has expired', 400);
    }

    if (!resetTokenRecord.superAdmin) {
      return createErrorResponse('Associated SuperAdmin not found', 400);
    }

    if (!resetTokenRecord.superAdmin.isActive) {
      return createErrorResponse('Account is inactive', 400);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the SuperAdmin's password
    await prisma.superAdmin.update({
      where: { id: resetTokenRecord.superAdmin.id },
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

    // Invalidate all other unused tokens for this SuperAdmin
    await prisma.passwordResetToken.updateMany({
      where: {
        superAdminId: resetTokenRecord.superAdmin.id,
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
        id: resetTokenRecord.superAdmin.id, 
        email: resetTokenRecord.superAdmin.email, 
        role: 'superadmin' 
      },
      'superadmin.password_reset_completed',
      { email: resetTokenRecord.superAdmin.email }
    );

    return createSuccessResponse({
      message: 'Password has been successfully updated'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}