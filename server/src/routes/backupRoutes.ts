import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';

import {
  createBackup,
  listBackups,
  restoreBackup,
  exportData,
  scheduleBackup,
  getBackupStatus,
} from '@/controllers/backupController';

const router = Router();

/**
 * @swagger
 * /api/backup/create:
 *   post:
 *     summary: Create a new backup
 *     description: Create a new backup with specified type and options
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, incremental, selective]
 *                 default: full
 *                 description: Type of backup to create
 *               entities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific entities to backup (for selective backup)
 *               includeFiles:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to include file backups
 *               compression:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to compress the backup
 *               description:
 *                 type: string
 *                 description: Optional description for the backup
 *     responses:
 *       200:
 *         description: Backup started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     estimatedTime:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/create', authMiddleware, createBackup);

/**
 * @swagger
 * /api/backup/list:
 *   get:
 *     summary: List available backups
 *     description: Retrieve list of all available backups with filtering and pagination
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of backups per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed]
 *         description: Filter by backup status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, incremental, selective]
 *         description: Filter by backup type
 *     responses:
 *       200:
 *         description: Backups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     backups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           entities:
 *                             type: array
 *                             items:
 *                               type: string
 *                           size:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                           error:
 *                             type: string
 *                           checksum:
 *                             type: string
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/list', authMiddleware, listBackups);

/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     summary: Restore from backup
 *     description: Restore data from a specific backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupId
 *             properties:
 *               backupId:
 *                 type: string
 *                 description: ID of the backup to restore from
 *               entities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific entities to restore (optional)
 *               validateOnly:
 *                 type: boolean
 *                 default: false
 *                 description: Only validate backup without restoring
 *     responses:
 *       200:
 *         description: Restore operation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     estimatedTime:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Backup not found
 */
router.post('/restore', authMiddleware, restoreBackup);

/**
 * @swagger
 * /api/backup/export:
 *   post:
 *     summary: Export data
 *     description: Export data in various formats with filtering
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entities
 *             properties:
 *               entities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Entities to export
 *               format:
 *                 type: string
 *                 enum: [json, csv, sql, excel]
 *                 default: json
 *                 description: Export format
 *               filters:
 *                 type: object
 *                 description: Filters to apply to the export
 *               includeMetadata:
 *                 type: boolean
 *                 default: true
 *                 description: Include metadata in export
 *               compression:
 *                 type: boolean
 *                 default: true
 *                 description: Compress the export file
 *     responses:
 *       200:
 *         description: Export started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     exportId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     estimatedTime:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/export', authMiddleware, exportData);

/**
 * @swagger
 * /api/backup/schedule:
 *   post:
 *     summary: Schedule backup
 *     description: Create a scheduled backup configuration
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - frequency
 *               - time
 *             properties:
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *                 description: How often to run the backup
 *               time:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Time to run the backup (HH:mm format)
 *               type:
 *                 type: string
 *                 enum: [full, incremental]
 *                 default: full
 *                 description: Type of backup to run
 *               retention:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 365
 *                 default: 30
 *                 description: Number of days to retain backups
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the schedule is enabled
 *     responses:
 *       200:
 *         description: Backup schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     time:
 *                       type: string
 *                     type:
 *                       type: string
 *                     retention:
 *                       type: number
 *                     enabled:
 *                       type: boolean
 *                     nextRun:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/schedule', authMiddleware, scheduleBackup);

/**
 * @swagger
 * /api/backup/status/{backupId}:
 *   get:
 *     summary: Get backup status
 *     description: Get the current status of a specific backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the backup to check
 *     responses:
 *       200:
 *         description: Backup status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     entities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     size:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                     error:
 *                       type: string
 *                     checksum:
 *                       type: string
 *                     metadata:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Backup not found
 */
router.get('/status/:backupId', authMiddleware, getBackupStatus);

export default router;
