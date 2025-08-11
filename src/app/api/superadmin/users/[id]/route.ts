import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { updateUserSchema } from '@/lib/validations/superadmin';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/users/[id] - Get user details
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Fetching user details for ID:', params.id);
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
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse({ user }, 'User details retrieved successfully');

  } catch (error: any) {
    console.error('❌ Error fetching user:', error);
    return createErrorResponse('Failed to fetch user', 500);
  }
});

// PUT /api/superadmin/users/[id] - Update user
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Updating user ID:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await req.json();

  try {
    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
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
        changes: validatedData
      }
    );

    return createSuccessResponse({ user }, 'User updated successfully');

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error', 400, error.errors);
    }
    console.error('❌ Error updating user:', error);
    return createErrorResponse('Failed to update user', 500);
  }
});

// DELETE /api/superadmin/users/[id] - Delete user
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Deleting user ID:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
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
        tenantId: existingUser.tenantId
      }
    );

    return createSuccessResponse({}, 'User deleted successfully');

  } catch (error: any) {
    console.error('❌ Error deleting user:', error);
    return createErrorResponse('Failed to delete user', 500);
  }
});
