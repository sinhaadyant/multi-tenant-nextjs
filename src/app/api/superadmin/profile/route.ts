import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword } from '@/lib/jwt';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/profile - Get current SuperAdmin profile
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Fetching SuperAdmin profile');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: authResult.id }
    });

    if (!superAdmin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ SuperAdmin not found:', authResult.id);
      }
      return createErrorResponse(
        'SuperAdmin not found',
        404
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin profile fetched successfully');
    }

    return createSuccessResponse({
      profile: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        phone: superAdmin.contactNumber,
        avatar: superAdmin.avatar,
        isActive: superAdmin.isActive,
        createdAt: superAdmin.createdAt,
        updatedAt: superAdmin.updatedAt
      }
    }, 'SuperAdmin profile fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching SuperAdmin profile:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/profile - Update SuperAdmin profile
export const PUT = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Updating SuperAdmin profile');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, email, phone, currentPassword, newPassword } = await req.json();

  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: authResult.id }
    });

    if (!superAdmin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ SuperAdmin not found for update:', authResult.id);
      }
      return createErrorResponse(
        'SuperAdmin not found',
        404
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (phone !== undefined) {
      updateData.contactNumber = phone || null;
    }

    if (email && email !== superAdmin.email) {
      // Check if email already exists
      const existingSuperAdmin = await prisma.superAdmin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingSuperAdmin) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Email already exists:', email);
        }
        return createErrorResponse(
          'Email already exists',
          409,
          [{ field: 'email', message: 'Email already exists' }]
        );
      }

      updateData.email = email.toLowerCase();
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Current password required for password change');
        }
        return createErrorResponse(
          'Current password is required to change password',
          400,
          [{ field: 'currentPassword', message: 'Current password is required to change password' }]
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, superAdmin.password);
      if (!isCurrentPasswordValid) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Current password is incorrect');
        }
        return createErrorResponse(
          'Current password is incorrect',
          400,
          [{ field: 'currentPassword', message: 'Current password is incorrect' }]
        );
      }

      // Hash new password
      updateData.password = await hashPassword(newPassword);
    }

    // Update SuperAdmin
    const updatedSuperAdmin = await prisma.superAdmin.update({
      where: { id: authResult.id },
      data: updateData
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'superadmin.profile.update',
      {
        updatedFields: Object.keys(updateData).filter(key => key !== 'password'),
        passwordChanged: !!newPassword
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin profile updated successfully');
    }

    return createSuccessResponse({
      profile: {
        id: updatedSuperAdmin.id,
        email: updatedSuperAdmin.email,
        name: updatedSuperAdmin.name,
        phone: updatedSuperAdmin.contactNumber,
        avatar: updatedSuperAdmin.avatar,
        isActive: updatedSuperAdmin.isActive,
        createdAt: updatedSuperAdmin.createdAt,
        updatedAt: updatedSuperAdmin.updatedAt
      }
    }, 'Profile updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating SuperAdmin profile:', error);
    }
    throw error;
  }
}); 