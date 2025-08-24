import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireTenantAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 10;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar', '.7z'
];

export const POST = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  
  if (!tenantSlug) {
    return createErrorResponse('Tenant slug is required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, isActive: true }
  });

  if (!tenant) {
    return createErrorResponse('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    return createErrorResponse('Tenant is inactive', 403);
  }

  // Verify user belongs to this tenant
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  // Check if user has permission to upload files (any support permission)
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            where: { moduleKey: 'support' }
          }
        }
      }
    }
  });

  const hasSupportPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => 
      permission.canCreate || permission.canUpdate || permission.canRead
    )
  );

  if (!hasSupportPermission) {
    return createErrorResponse('You do not have permission to upload files', 403);
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return createErrorResponse('No files provided', 400);
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      return createErrorResponse(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`, 400);
    }

    const uploadResults = [];
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'support', tenant.slug);
    
    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse(`File ${file.name} is too large. Maximum size is 10MB`, 400);
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return createErrorResponse(`File type ${file.type} is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`, 400);
      }

      // Additional validation for file extension
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return createErrorResponse(`File extension ${fileExtension} is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`, 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filepath = join(uploadDir, filename);

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      uploadResults.push({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/support/${tenant.slug}/${filename}`
      });
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'support.file.upload',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        fileCount: uploadResults.length
      }
    );

    return createSuccessResponse({
      files: uploadResults
    }, 'Files uploaded successfully', 201);

  } catch (error: any) {
    console.error('File upload error:', error);
    return createErrorResponse('File upload failed', 500);
  }
});
