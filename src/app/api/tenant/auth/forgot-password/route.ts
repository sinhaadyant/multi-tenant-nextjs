import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLog } from '@/lib/audit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, tenantSlug } = await req.json();

    if (!email || !tenantSlug) {
      return createErrorResponse('Email and tenant slug are required', 400);
    }

    // Normalize email and tenant slug
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedTenantSlug = tenantSlug.toLowerCase().trim();

    // Check if tenant exists and is active
    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: normalizedTenantSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });

    if (!tenant) {
      // Create audit log for failed attempt
      await createAuditLog({
        action: 'tenant.password_reset_request_failed',
        details: { 
          email: normalizedEmail, 
          tenantSlug: normalizedTenantSlug,
          reason: 'Tenant not found or inactive' 
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });

      return createErrorResponse(
        'Invalid tenant or tenant is inactive',
        404,
        [{ field: 'tenantSlug', message: 'Invalid tenant or tenant is inactive' }]
      );
    }

    // Check if user exists in the tenant
    const user = await prisma.user.findFirst({
      where: { 
        email: normalizedEmail,
        tenantId: tenant.id,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      // Create audit log for failed attempt
      await createAuditLog({
        action: 'tenant.password_reset_request_failed',
        details: { 
          email: normalizedEmail, 
          tenantSlug: normalizedTenantSlug,
          tenantId: tenant.id,
          reason: 'User not found' 
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        tenantId: tenant.id,
      });

      // Return error for user not found (matching superadmin behavior)
      return createErrorResponse(
        'User not found. Please check your email address.',
        404,
        [{ field: 'email', message: 'User not found. Please check your email address.' }]
      );
    }

    const successMessage = 'Password reset instructions have been sent to your email.';

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        email: normalizedEmail,
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
        type: 'tenant',
      }
    });

    // Create audit log for successful request
    await createAuditLog({
      action: 'tenant.password_reset_requested',
      details: { 
        email: normalizedEmail,
        tenantSlug: normalizedTenantSlug,
        tenantId: tenant.id
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      tenantId: tenant.id,
      userId: user.id,
    });

    // TODO: Send email with reset link
    // For now, we'll return the token in the response for testing
    // In production, this should be sent via email only
    console.log(`Password reset token for ${normalizedEmail} in tenant ${normalizedTenantSlug}: ${resetToken}`);

    return createSuccessResponse({
      message: successMessage,
      // Remove this in production - token should only be sent via email
      token: resetToken // For testing purposes only
    });

  } catch (error) {
    console.error('Tenant forgot password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 