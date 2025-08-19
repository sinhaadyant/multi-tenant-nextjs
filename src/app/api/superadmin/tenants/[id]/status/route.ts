import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/tenants/[id]/status - Toggle tenant status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Toggling tenant status:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for tenant status API:', authResult.error);
    }
    return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
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
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });

    if (!existingTenant) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Tenant not found:', params.id);
      }
      return createErrorResponse(
        'Tenant not found',
        404
      );
    }

    // Update tenant status
    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { isActive }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult.user,
      'tenant.status_update',
      {
        tenantId: params.id,
        tenantName: existingTenant.name,
        previousStatus: existingTenant.isActive,
        newStatus: isActive
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Tenant status updated successfully: ${existingTenant.name} is now ${isActive ? 'active' : 'inactive'}`);
    }

    return createSuccessResponse({
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        isActive: updatedTenant.isActive
      }
    }, `Tenant ${isActive ? 'activated' : 'suspended'} successfully`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating tenant status:', error);
    }
    throw error;
  }
}); 