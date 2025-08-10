import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PATCH /api/superadmin/roles/[id]/status - Toggle role status
export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️ Toggling role status:', params.id);
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
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });

    if (!existingRole) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Role not found:', params.id);
      }
      return createErrorResponse('Role not found', 404);
    }

    // Update role status
    const role = await prisma.role.update({
      where: { id: params.id },
      data: { isActive },
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'role.status_toggle',
      {
        roleId: role.id,
        roleName: role.name,
        tenantId: role.tenantId,
        tenantName: role.tenant?.name,
        newStatus: isActive ? 'active' : 'inactive',
        previousStatus: existingRole.isActive ? 'active' : 'inactive'
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Role status updated successfully:', role.name, 'Status:', isActive);
    }

    return createSuccessResponse({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        isDefault: role.isDefault,
        isTemplate: role.isTemplate,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        tenant: role.tenant ? {
          id: role.tenantId,
          name: role.tenant.name,
          slug: role.tenant.slug
        } : null,
        permissions: role.permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
          module: rp.permission.module,
          action: rp.permission.action
        })),
        userCount: role._count.userRoles
      }
    }, `Role ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating role status:', error);
    }
    throw error;
  }
}); 