import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';
import { AuthenticatedUser } from '../types/auth';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/utils/errors';
import { DataScopeService } from '@/services/DataScopeService';
import { PermissionService } from '@/services/PermissionService';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { env } from '@/config/env';

const prisma = new PrismaClient();
const dataScopeService = DataScopeService.getInstance();
const permissionService = PermissionService.getInstance();

export class FileController {
  /**
   * Upload files with validation and security checks
   */
  static uploadFile = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      if (!req.file) {
        throw new BadRequestError('No file provided');
      }

      const { originalname, mimetype, size, path: filePath } = req.file;
      const { description, tags, isPublic } = req.body;

      // Validate file size
      if (size > env.MAX_FILE_SIZE) {
        await fs.unlink(filePath);
        throw new BadRequestError('File size exceeds limit');
      }

      // Validate file type
      const allowedTypes = env?.ALLOWED_FILE_TYPES?.split(',');
      const fileExtension = path
        .extname(originalname)
        .toLowerCase()
        .substring(1);
      if (!allowedTypes.includes(fileExtension)) {
        await fs.unlink(filePath);
        throw new BadRequestError('File type not allowed');
      }

      // Generate unique filename
      const fileHash = crypto
        .createHash('sha256')
        .update(originalname + Date.now())
        .digest('hex');
      const newFileName = `${fileHash}${path.extname(originalname)}`;
      const uploadDir = path.join(env.UPLOAD_PATH, user?.tenantId || 'global');
      const newFilePath = path.join(uploadDir, newFileName);

      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Move file to final location
      await fs.rename(filePath, newFilePath);

      // Create file record in database
      const fileRecord = await (prisma as any).fileUpload.create({
        data: {
          originalName: originalname,
          fileName: newFileName,
          filePath: newFilePath,
          mimeType: mimetype,
          fileSize: size,
          description: description || '',
          tags: tags ? JSON.parse(tags) : [],
          isPublic: isPublic === 'true',
          uploadedBy: user?.id,
          tenantId: user?.tenantId,
          fileHash: crypto
            .createHash('sha256')
            .update(await fs.readFile(newFilePath))
            .digest('hex'),
        },
      });

      logger.info(`File uploaded: ${originalname} by user ${user?.id}`);

      return res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          fileName: fileRecord.fileName,
          mimeType: fileRecord.mimeType,
          fileSize: fileRecord.fileSize,
          uploadedAt: fileRecord.createdAt,
        },
      });
    } catch (error) {
      logger.error('File upload error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Download file with permission checks
   */
  static downloadFile = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      // Get file record with permission check
      const fileRecord = await (prisma as any).fileUpload?.findUnique({
        where: { id },
      });

      if (!fileRecord) {
        throw new NotFoundError('File not found');
      }

      // Check permissions
      const hasPermission = await permissionService.hasPermission(
        user?.id,
        'file-management',
        'read'
      );

      if (!hasPermission && !user?.isSuperadmin) {
        throw new ForbiddenError(
          'Insufficient permissions to access this file'
        );
      }

      // Check if file exists on disk
      try {
        await fs.access(fileRecord.filePath);
      } catch {
        throw new NotFoundError('File not found on disk');
      }

      // Set headers for download
      res.setHeader('Content-Type', fileRecord.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileRecord.originalName}"`
      );
      res.setHeader('Content-Length', fileRecord?.fileSize?.toString());

      // Stream file to response
      const fileStream = createReadStream(fileRecord.filePath);
      await pipeline(fileStream, res);

      // Log download
      logger.info(
        `File downloaded: ${fileRecord.originalName} by user ${user?.id}`
      );
    } catch (error) {
      logger.error('File download error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * List files with filtering and pagination
   */
  static listFiles = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const {
        page = 1,
        limit = 20,
        search,
        mimeType,
        uploadedBy,
        isPublic,
      } = req.query;

      // Build query with data scope
      const query: any = {
        where: {},
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      };

      // Apply data scope filtering
      const scopedQuery = await dataScopeService.applyDataScopeFilter(
        query,
        user?.id,
        'file-management',
        'fileUpload'
      );

      // Add search filters
      if (search) {
        if ((scopedQuery as any).where) {
          (scopedQuery as any).where.OR = [
            {
              originalName: { contains: search as string, mode: 'insensitive' },
            },
            {
              description: { contains: search as string, mode: 'insensitive' },
            },
            { tags: { array_contains: [search as string] } },
          ];
        }
      }

      if (mimeType) {
        if ((scopedQuery as any).where) {
          (scopedQuery as any).where.mimeType = {
            contains: mimeType as string,
            mode: 'insensitive',
          };
        }
      }

      if (uploadedBy) {
        if ((scopedQuery as any).where) {
          (scopedQuery as any).where.uploadedBy = uploadedBy as string;
        }
      }

      if (isPublic !== undefined) {
        if ((scopedQuery as any).where) {
          (scopedQuery as any).where.isPublic = isPublic === 'true';
        }
      }

      // Execute query
      const [files, total] = await Promise.all([
        ((prisma as any).fileUpload as any).findMany(scopedQuery),
        (prisma as any).fileUpload?.count({
          where: (scopedQuery as any).where,
        }),
      ]);

      return res.json({
        success: true,
        message: 'Files retrieved successfully',
        data: files,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('List files error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Delete file with cleanup
   */
  static deleteFile = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      // Get file record
      const fileRecord = await (prisma as any).fileUpload.findUnique({
        where: { id },
      });

      if (!fileRecord) {
        throw new NotFoundError('File not found');
      }

      // Check permissions
      const hasPermission = await permissionService.hasPermission(
        user?.id,
        'file-management',
        'delete',
        fileRecord.tenantId
      );

      if (!hasPermission && !user?.isSuperadmin) {
        throw new ForbiddenError(
          'Insufficient permissions to delete this file'
        );
      }

      // Delete file from disk
      try {
        await fs.unlink(fileRecord.filePath);
      } catch (error) {
        logger.warn(
          `Failed to delete file from disk: ${fileRecord.filePath}`,
          error
        );
      }

      // Delete database record
      await (prisma as any).fileUpload?.delete({
        where: { id },
      });

      logger.info(
        `File deleted: ${fileRecord.originalName} by user ${user?.id}`
      );

      return res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      logger.error('Delete file error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get file metadata and usage information
   */
  static getFileInfo = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      // Get file record with usage data
      const fileRecord = await (prisma as any).fileUpload?.findUnique({
        where: { id },
        include: {
          uploadedByUser: {
            select: { id: true, name: true, email: true },
          },
          auditLogs: {
            where: { action: 'FILE_DOWNLOAD' },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!fileRecord) {
        throw new NotFoundError('File not found');
      }

      // Check permissions
      const hasPermission = await permissionService.hasPermission(
        user?.id,
        'file-management',
        'read',
        fileRecord.tenantId
      );

      if (!hasPermission && !user?.isSuperadmin) {
        throw new ForbiddenError(
          'Insufficient permissions to access this file'
        );
      }

      // Get file stats from disk
      let fileStats = null;
      try {
        const stats = await fs.stat(fileRecord.filePath);
        fileStats = {
          exists: true,
          size: stats.size,
          lastModified: stats.mtime,
        };
      } catch {
        fileStats = { exists: false };
      }

      return res.json({
        success: true,
        message: 'File information retrieved successfully',
        data: {
          ...fileRecord,
          fileStats,
          downloadCount: fileRecord?.auditLogs?.length,
          lastDownloaded: null,
        },
      });
    } catch (error) {
      logger.error('Get file info error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Bulk upload multiple files
   */
  static bulkUpload = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      if (!req.files || !Array.isArray(req.files)) {
        throw new BadRequestError('No files provided');
      }

      const uploadedFiles = [];

      for (const file of req.files as Express.Multer.File[]) {
        const { originalname, mimetype, size, path: filePath } = file;

        // Validate file size
        if (size > env.MAX_FILE_SIZE) {
          await fs.unlink(filePath);
          continue;
        }

        // Validate file type
        const allowedTypes = env?.ALLOWED_FILE_TYPES?.split(',');
        const fileExtension = path
          .extname(originalname)
          .toLowerCase()
          .substring(1);
        if (!allowedTypes.includes(fileExtension)) {
          await fs.unlink(filePath);
          continue;
        }

        // Generate unique filename
        const fileHash = crypto
          .createHash('sha256')
          .update(originalname + Date.now())
          .digest('hex');
        const newFileName = `${fileHash}${path.extname(originalname)}`;
        const uploadDir = path.join(
          env.UPLOAD_PATH,
          user?.tenantId || 'global'
        );
        const newFilePath = path.join(uploadDir, newFileName);

        // Ensure upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Move file to final location
        await fs.rename(filePath, newFilePath);

        // Create file record
        const fileRecord = await (prisma as any).fileUpload?.create({
          data: {
            originalName: originalname,
            fileName: newFileName,
            filePath: newFilePath,
            mimeType: mimetype,
            fileSize: size,
            uploadedBy: user?.id,
            tenantId: user?.tenantId,
            fileHash: crypto
              .createHash('sha256')
              .update(await fs.readFile(newFilePath))
              .digest('hex'),
          },
        });

        uploadedFiles.push({
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          fileName: fileRecord.fileName,
          mimeType: fileRecord.mimeType,
          fileSize: fileRecord.fileSize,
        });
      }

      logger.info(
        `Bulk upload completed: ${uploadedFiles.length} files by user ${user?.id}`
      );

      return res.json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        data: uploadedFiles,
      });
    } catch (error) {
      logger.error('Bulk upload error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Clean up orphaned files
   */
  static cleanupOrphanedFiles = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      // Only superadmin can run cleanup
      if (!user?.isSuperadmin) {
        throw new ForbiddenError('Only superadmin can run file cleanup');
      }

      // Get all file records
      const fileRecords = await ((prisma as any).fileUpload as any).findMany({
        select: { id: true, filePath: true, originalName: true },
      });

      const orphanedFiles = [];
      const cleanedFiles = [];

      for (const fileRecord of fileRecords) {
        try {
          await fs.access(fileRecord.filePath);
        } catch {
          // File doesn't exist on disk, mark as orphaned
          orphanedFiles.push(fileRecord);

          // Delete from database
          await (prisma as any).fileUpload?.delete({
            where: { id: fileRecord.id },
          });

          cleanedFiles.push(fileRecord.originalName);
        }
      }

      logger.info(
        `File cleanup completed: ${cleanedFiles.length} orphaned files removed`
      );

      return res.json({
        success: true,
        message: `Cleanup completed. Removed ${cleanedFiles.length} orphaned files`,
        data: {
          cleanedFiles,
          totalOrphaned: orphanedFiles.length,
        },
      });
    } catch (error) {
      logger.error('File cleanup error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };
}

// Export individual functions for routes
export const uploadFile = FileController.uploadFile;
export const downloadFile = FileController.downloadFile;
export const listFiles = FileController.listFiles;
export const deleteFile = FileController.deleteFile;
export const getFileInfo = FileController.getFileInfo;
export const bulkUpload = FileController.bulkUpload;
export const cleanupOrphanedFiles = FileController.cleanupOrphanedFiles;
