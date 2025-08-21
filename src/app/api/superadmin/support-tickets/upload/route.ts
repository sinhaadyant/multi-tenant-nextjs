import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireSuperAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed'
];

export const POST = asyncHandler(async (req: NextRequest) => {
  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return createErrorResponse('No files provided', 400);
    }

    if (files.length > 10) {
      return createErrorResponse('Maximum 10 files allowed per upload', 400);
    }

    const uploadResults = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400);
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return createErrorResponse(`File type ${file.type} is not allowed`, 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const filename = `superadmin_${timestamp}_${randomString}.${fileExtension}`;

      // Create upload directory
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'superadmin', 'support');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const filePath = join(uploadDir, filename);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create file record in database
      // Note: SupportTicketAttachment requires ticketId, but for standalone uploads,
      // we'll create a temporary placeholder or modify the schema to support standalone uploads
      // For now, we'll return file info without database storage for standalone uploads
      const fileInfo = {
        id: `temp_${timestamp}_${randomString}`,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/superadmin/support/${filename}`
      };

      uploadResults.push({
        id: fileInfo.id,
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        path: fileInfo.path
      });

      // Create audit log
      await createAuditLogFromRequest(req, {
        action: 'support.file.upload',
        details: `SuperAdmin uploaded file: ${file.name}`,
        userId: user.id,
        userType: 'superadmin'
      });
    }

    return createSuccessResponse({
      files: uploadResults,
      totalFiles: uploadResults.length
    }, 'Files uploaded successfully');

  } catch (error) {
    console.error('Error uploading files:', error);
    return createErrorResponse('Failed to upload files', 500);
  }
});
