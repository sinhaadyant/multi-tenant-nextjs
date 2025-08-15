import { z } from 'zod';

// File upload schema
export const fileUploadSchema = z.object({
  description: z.string().optional(),
  tags: z.string().optional(), // JSON string of tags
  isPublic: z.string().optional(), // 'true' or 'false'
});

// File list query schema
export const fileListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => Number(val) || 1),
  limit: z
    .string()
    .optional()
    .transform(val => Number(val) || 20),
  search: z.string().optional(),
  mimeType: z.string().optional(),
  uploadedBy: z.string().optional(),
  isPublic: z
    .string()
    .optional()
    .transform(val => val === 'true'),
});

// File ID parameter schema
export const fileIdParamSchema = z.object({
  id: z.string().cuid(),
});

// File update schema
export const fileUpdateSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

// Bulk file upload schema
export const bulkFileUploadSchema = z.object({
  files: z.array(z.any()).min(1).max(10), // Multer files
  description: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.string().optional(),
});

// File search schema
export const fileSearchSchema = z.object({
  query: z.string().min(1),
  filters: z
    .object({
      mimeType: z.array(z.string()).optional(),
      uploadedBy: z.array(z.string()).optional(),
      dateRange: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
      fileSize: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      isPublic: z.boolean().optional(),
    })
    .optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// File metadata schema
export const fileMetadataSchema = z.object({
  originalName: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});

// File download schema
export const fileDownloadSchema = z.object({
  id: z.string().cuid(),
  inline: z.boolean().optional(), // For inline display vs download
});

// File cleanup schema
export const fileCleanupSchema = z.object({
  dryRun: z.boolean().optional(), // Preview what would be cleaned up
  olderThan: z.number().optional(), // Days old files to clean up
  orphanedOnly: z.boolean().optional(), // Only clean orphaned files
});

// File statistics schema
export const fileStatsSchema = z.object({
  dateRange: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
  groupBy: z
    .enum(['day', 'week', 'month', 'mimeType', 'uploadedBy'])
    .optional(),
});

// File export schema
export const fileExportSchema = z.object({
  format: z.enum(['csv', 'json', 'excel']).default('csv'),
  filters: z
    .object({
      mimeType: z.array(z.string()).optional(),
      uploadedBy: z.array(z.string()).optional(),
      dateRange: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
      isPublic: z.boolean().optional(),
    })
    .optional(),
  fields: z.array(z.string()).optional(), // Which fields to include
});

// File import schema
export const fileImportSchema = z.object({
  files: z.array(
    z.object({
      originalName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      filePath: z.string(), // Path to uploaded file
    })
  ),
  overwrite: z.boolean().optional(), // Overwrite existing files
  validateOnly: z.boolean().optional(), // Only validate, don't import
});

// File permission schema
export const filePermissionSchema = z.object({
  fileId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  roleId: z.string().cuid().optional(),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'share'])),
  expiresAt: z.string().datetime().optional(),
});

// File sharing schema
export const fileSharingSchema = z.object({
  fileId: z.string().cuid(),
  shareWith: z.array(z.string().email()).optional(), // Email addresses
  shareWithRoles: z.array(z.string().cuid()).optional(), // Role IDs
  permissions: z.array(z.enum(['read', 'write', 'delete'])).default(['read']),
  expiresAt: z.string().datetime().optional(),
  message: z.string().optional(),
});

// File version schema
export const fileVersionSchema = z.object({
  fileId: z.string().cuid(),
  version: z.string().optional(), // Auto-generated if not provided
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// File comment schema
export const fileCommentSchema = z.object({
  fileId: z.string().cuid(),
  comment: z.string().min(1).max(1000),
  parentId: z.string().cuid().optional(), // For threaded comments
});

// File audit schema
export const fileAuditSchema = z.object({
  fileId: z.string().cuid(),
  action: z.enum(['view', 'download', 'edit', 'delete', 'share', 'comment']),
  details: z.record(z.string(), z.any()).optional(),
});

// Export types
export type FileUploadRequest = z.infer<typeof fileUploadSchema>;
export type FileListQuery = z.infer<typeof fileListQuerySchema>;
export type FileIdParam = z.infer<typeof fileIdParamSchema>;
export type FileUpdateRequest = z.infer<typeof fileUpdateSchema>;
export type BulkFileUploadRequest = z.infer<typeof bulkFileUploadSchema>;
export type FileSearchRequest = z.infer<typeof fileSearchSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type FileDownloadRequest = z.infer<typeof fileDownloadSchema>;
export type FileCleanupRequest = z.infer<typeof fileCleanupSchema>;
export type FileStatsRequest = z.infer<typeof fileStatsSchema>;
export type FileExportRequest = z.infer<typeof fileExportSchema>;
export type FileImportRequest = z.infer<typeof fileImportSchema>;
export type FilePermissionRequest = z.infer<typeof filePermissionSchema>;
export type FileSharingRequest = z.infer<typeof fileSharingSchema>;
export type FileVersionRequest = z.infer<typeof fileVersionSchema>;
export type FileCommentRequest = z.infer<typeof fileCommentSchema>;
export type FileAuditRequest = z.infer<typeof fileAuditSchema>;

// Response schemas
export const fileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      id: z.string(),
      originalName: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean(),
      uploadedBy: z.string(),
      tenantId: z.string().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      uploadedByUser: z
        .object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          email: z.string(),
        })
        .optional(),
    })
    .optional(),
  errors: z.any().optional(),
  meta: z
    .object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      totalPages: z.number().optional(),
    })
    .optional(),
});

export const fileListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(
    z.object({
      id: z.string(),
      originalName: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean(),
      uploadedBy: z.string(),
      tenantId: z.string().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      uploadedByUser: z
        .object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          email: z.string(),
        })
        .optional(),
    })
  ),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const fileInfoResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.string(),
    originalName: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean(),
    uploadedBy: z.string(),
    tenantId: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    fileStats: z
      .object({
        exists: z.boolean(),
        size: z.number().optional(),
        lastModified: z.string().datetime().optional(),
      })
      .optional(),
    downloadCount: z.number(),
    lastDownloaded: z.string().datetime().optional(),
    uploadedByUser: z
      .object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
      })
      .optional(),
  }),
});

export const fileCleanupResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    cleanedFiles: z.array(z.string()),
    totalOrphaned: z.number(),
  }),
});

export type FileResponse = z.infer<typeof fileResponseSchema>;
export type FileListResponse = z.infer<typeof fileListResponseSchema>;
export type FileInfoResponse = z.infer<typeof fileInfoResponseSchema>;
export type FileCleanupResponse = z.infer<typeof fileCleanupResponseSchema>;
