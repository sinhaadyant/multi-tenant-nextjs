import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/jwt';
import { z } from 'zod';

// Validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// POST /api/tenant/[tenantSlug]/users/[userId]/reset-password - Reset user password
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string; userId: string }> }) => {
  const { tenantSlug, userId } = await params;
  
  try {
    const currentUserId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check if user has permission to reset passwords
    // For now, allow any authenticated user to reset passwords within their tenant
    // In a real application, you might want to restrict this to admins only

    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId
      }
    });

    if (!existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(validatedData.password);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'user.password_reset',
      details: `Password reset for user: ${existingUser.name} (${existingUser.email})`,
      resource: 'user',
      resourceId: userId
    });

    return createSuccessResponse({
      message: 'Password reset successfully',
      userId: userId
    }, 'Password reset successfully');

  } catch (error: any) {
    console.error('Error resetting password:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to reset password',
      error.status || 500
    );
  }
});
