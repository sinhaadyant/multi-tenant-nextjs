import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middleware/auth';
import {
  requireRead,
  requireCreate,
  
  requireRecordRead,
  requireRecordDelete,
} from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  uploadFile,
  downloadFile,
  listFiles,
  deleteFile,
  getFileInfo,
  bulkUpload,
  cleanupOrphanedFiles,
} from '@/controllers/fileController';
import { env } from '@/config/env';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_PATH);
  },
  filename: (_req, _file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, _file.fieldname + '-' + uniqueSuffix + '-' + _file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter: (_req, _file, cb) => {
    const allowedTypes = env.ALLOWED_FILE_TYPES.split(',');
    const fileExtension = _file.originalname.split('.').pop()?.toLowerCase();

    if (fileExtension && allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// All file routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: List files with filtering and pagination
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 */
router.get('/', requireRead('file-management'), asyncHandler(listFiles));

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a single file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 */
router.post(
  '/upload',
  requireCreate('file-management'),
  upload.single('file'),
  asyncHandler(uploadFile)
);

/**
 * @swagger
 * /api/files/bulk-upload:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
router.post(
  '/bulk-upload',
  requireCreate('file-management'),
  upload.array('files', 10), // Max 10 files
  asyncHandler(bulkUpload)
);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Download file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/:id',
  requireRecordRead('file-management'),
  asyncHandler(downloadFile)
);

/**
 * @swagger
 * /api/files/{id}/info:
 *   get:
 *     summary: Get file metadata and usage information
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/:id/info',
  requireRecordRead('file-management'),
  asyncHandler(getFileInfo)
);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  '/:id',
  requireRecordDelete('file-management'),
  asyncHandler(deleteFile)
);

/**
 * @swagger
 * /api/files/cleanup:
 *   post:
 *     summary: Clean up orphaned files (superadmin only)
 *     tags: [Files]
 */
router.post('/cleanup', asyncHandler(cleanupOrphanedFiles));

export default router;
