import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLog } from '@/lib/audit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return createErrorResponse('Email is required', 400);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if SuperAdmin exists
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { 
        email: normalizedEmail
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with this email exists, password reset instructions have been sent.';

    if (!superAdmin) {
      // Create audit log for failed attempt
      await createAuditLog({
        action: 'superadmin.password_reset_request_failed',
        details: { email: normalizedEmail, reason: 'Email not found' },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });

      return createSuccessResponse({ message: successMessage });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Invalidate any existing tokens for this SuperAdmin
    await prisma.passwordResetToken.updateMany({
      where: {
        superAdminId: superAdmin.id,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        used: true
      }
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email: normalizedEmail,
        expiresAt,
        superAdminId: superAdmin.id,
      }
    });

    // Create audit log for successful request
    await createAuditLog({
      action: 'superadmin.password_reset_requested',
      details: { email: normalizedEmail },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      superAdminId: superAdmin.id,
    });

    // TODO: Send email with reset link
    // For now, we'll return the token in the response for testing
    // In production, this should be sent via email only
    console.log(`Password reset token for ${normalizedEmail}: ${resetToken}`);

    return createSuccessResponse({
      message: successMessage,
      // Remove this in production - token should only be sent via email
      token: resetToken // For testing purposes only
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}