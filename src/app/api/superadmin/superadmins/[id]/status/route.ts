import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/lib/errorHandler';
import { createAuditLogFromRequest } from '@/lib/audit';

// PATCH /api/superadmin/superadmins/[id]/status - Toggle superadmin status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Toggling superadmin status:', id);
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Authentication failed:', authResult.error);
      }
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return createErrorResponse('isActive must be a boolean value', 400);
    }

    // Check if superadmin exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { id }
    });

    if (!existingSuperAdmin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Superadmin not found:', id);
      }
      return createErrorResponse('Superadmin not found', 404);
    }

    // Prevent deactivating the current user
    if (existingSuperAdmin.id === authResult.user.id && !isActive) {
      return createErrorResponse('You cannot deactivate your own account', 400);
    }

    // Update superadmin status
    const updatedSuperAdmin = await prisma.superAdmin.update({
      where: { id },
      data: { isActive }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult.user,
      'superadmin.status_updated',
      {
        superadminId: id,
        superadminEmail: existingSuperAdmin.email,
        previousStatus: existingSuperAdmin.isActive,
        newStatus: isActive
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Superadmin status updated successfully:', updatedSuperAdmin.email);
    }

    return createSuccessResponse({
      superadmin: {
        id: updatedSuperAdmin.id,
        name: updatedSuperAdmin.name,
        email: updatedSuperAdmin.email,
        isActive: updatedSuperAdmin.isActive,
        updatedAt: updatedSuperAdmin.updatedAt
      }
    }, `Superadmin ${isActive ? 'activated' : 'deactivated'} successfully`);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating superadmin status:', error);
    }
    throw error;
  }
});
