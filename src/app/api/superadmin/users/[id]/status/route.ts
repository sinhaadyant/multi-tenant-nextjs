import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/users/[id]/status - Toggle user status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Toggling user status:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { isActive } = await req.json();

  if (typeof isActive !== 'boolean') {
    return createErrorResponse('isActive must be a boolean', 400);
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

    // Update user status
    const user = await prisma.user.update({
      where: { id: id },
      data: { isActive },
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
      'user.status_toggle',
      {
        userId: user.id,
        userEmail: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        newStatus: isActive ? 'active' : 'inactive',
        previousStatus: existingUser.isActive ? 'active' : 'inactive'
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User status updated successfully:', user.email, 'Status:', isActive);
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
      }
    }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating user status:', error);
    }
    throw error;
  }
}); 