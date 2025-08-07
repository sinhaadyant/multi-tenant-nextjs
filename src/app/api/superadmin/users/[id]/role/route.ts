import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// PUT /api/superadmin/users/[id]/role - Assign/remove role from user
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Assigning role to user:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { roleId } = await req.json();

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        role: true,
        tenant: true
      }
    });

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found:', params.id);
      }
      return createErrorResponse('User not found', 404);
    }

    // Check if role exists (if roleId is provided)
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Role not found:', roleId);
        }
        return createErrorResponse('Role not found', 404);
      }

      // Check if role is active
      if (!role.isActive) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Role is inactive:', roleId);
        }
        return createErrorResponse('Cannot assign inactive role to user', 400);
      }
    }

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        roleId: roleId || null
      },
      include: {
        role: true,
        tenant: true
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.role.assign',
      {
        userId: updatedUser.id,
        userEmail: updatedUser.email,
        previousRoleId: user.roleId,
        newRoleId: roleId,
        tenantId: updatedUser.tenantId,
        tenantName: updatedUser.tenant?.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Role assigned successfully to user:', updatedUser.email);
    }

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        roleName: updatedUser.role?.name,
        tenantId: updatedUser.tenantId,
        tenantName: updatedUser.tenant?.name,
        isActive: updatedUser.isActive
      }
    }, roleId ? 'Role assigned successfully' : 'Role removed successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error assigning role to user:', error);
    }
    throw error;
  }
}); 