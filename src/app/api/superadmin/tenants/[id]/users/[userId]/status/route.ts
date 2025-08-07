import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/tenants/[id]/users/[userId]/status - Toggle user status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string; userId: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Toggling user status:', params.userId, 'in tenant:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { isActive } = await req.json();

  if (typeof isActive !== 'boolean') {
    return createErrorResponse(
      'isActive must be a boolean value',
      400
    );
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

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { isActive }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.status_update',
      {
        tenantId: params.id,
        tenantName: tenant.name,
        userId: params.userId,
        userName: existingUser.name,
        previousStatus: existingUser.isActive,
        newStatus: isActive
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ User status updated successfully: ${existingUser.name} is now ${isActive ? 'active' : 'inactive'}`);
    }

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isActive: updatedUser.isActive
      }
    }, `User ${isActive ? 'activated' : 'suspended'} successfully`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating user status:', error);
    }
    throw error;
  }
}); 