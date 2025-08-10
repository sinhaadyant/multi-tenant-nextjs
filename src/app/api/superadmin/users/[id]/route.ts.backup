import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/users/[id] - Get single user
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Fetching user details:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        role: {
          select: { name: true, description: true }
        }
      }
    });

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found:', params.id);
      }
      return createErrorResponse('User not found', 404);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User fetched successfully:', user.email);
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        tenant: user.tenant ? {
          id: user.tenantId,
          name: user.tenant.name,
          slug: user.tenant.slug
        } : null,
        role: user.role ? {
          id: user.roleId,
          name: user.role.name,
          description: user.role.description
        } : null
      }
    }, 'User fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching user:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/users/[id] - Update user
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Updating user:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, isActive, roleId } = await req.json();

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found:', params.id);
      }
      return createErrorResponse('User not found', 404);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        roleId: roleId || null
      },
      include: {
        tenant: {
          select: { name: true, slug: true }
        },
        role: {
          select: { name: true, description: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.update',
      {
        userId: user.id,
        userEmail: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        changes: { name, isActive, roleId }
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User updated successfully:', user.email);
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
        role: user.role ? {
          id: user.roleId,
          name: user.role.name,
          description: user.role.description
        } : null
      }
    }, 'User updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating user:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/users/[id] - Delete user
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Deleting user:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });

    if (!existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found:', params.id);
      }
      return createErrorResponse('User not found', 404);
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'user.delete',
      {
        userId: existingUser.id,
        userEmail: existingUser.email,
        tenantId: existingUser.tenantId,
        tenantName: existingUser.tenant?.name
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User deleted successfully:', existingUser.email);
    }

    return createSuccessResponse({}, 'User deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting user:', error);
    }
    throw error;
  }
}); 