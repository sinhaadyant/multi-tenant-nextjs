import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/superadmin/profile/avatar - Upload SuperAdmin avatar
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Uploading SuperAdmin avatar');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No avatar file provided');
      }
      return createErrorResponse(
        'Avatar file is required',
        400
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Invalid file type:', file.type);
      }
      return createErrorResponse(
        'Only JPEG and PNG files are allowed',
        400
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ File too large:', file.size);
      }
      return createErrorResponse(
        'File size must be less than 2MB',
        400
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `superadmin-${authResult.id}-${timestamp}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Update SuperAdmin profile with avatar URL
    const updatedSuperAdmin = await prisma.superAdmin.update({
      where: { id: authResult.id },
      data: { avatar: avatarUrl }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'superadmin.profile.avatar.update',
      {
        avatarUrl: avatarUrl,
        fileSize: file.size,
        fileType: file.type
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin avatar uploaded successfully');
    }

    return createSuccessResponse({
      avatarUrl: avatarUrl,
      profile: {
        id: updatedSuperAdmin.id,
        email: updatedSuperAdmin.email,
        name: updatedSuperAdmin.name,
        avatar: updatedSuperAdmin.avatar,
        isActive: updatedSuperAdmin.isActive,
        createdAt: updatedSuperAdmin.createdAt,
        updatedAt: updatedSuperAdmin.updatedAt
      }
    }, 'Avatar uploaded successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error uploading SuperAdmin avatar:', error);
    }
    throw error;
  }
}); 