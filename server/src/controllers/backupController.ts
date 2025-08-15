import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/config/logger';
import { AuthenticatedUser } from '@/middleware/auth';
import { superadminOnly } from '@/middleware/permissionGuard';
import * as fs from 'fs';
import * as path from 'path';
// import { exec } from 'child_process';
// import { promisify } from 'util';
import archiver from 'archiver';

const prisma = new PrismaClient();
// const execAsync = promisify(exec);

// Backup schemas
const createBackupSchema = z.object({
  type: z.enum(['full', 'incremental', 'selective']).default('full'),
  entities: z.array(z.string()).optional(),
  includeFiles: z.boolean().default(true),
  compression: z.boolean().default(true),
  description: z.string().optional(),
});

const restoreBackupSchema = z.object({
  backupId: z.string(),
  entities: z.array(z.string()).optional(),
  validateOnly: z.boolean().default(false),
});

const exportDataSchema = z.object({
  entities: z.array(z.string()),
  format: z.enum(['json', 'csv', 'sql', 'excel']).default('json'),
  filters: z.record(z.string(), z.any()).optional(),
  includeMetadata: z.boolean().default(true),
  compression: z.boolean().default(true),
});

const scheduleBackupSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string(), // HH:mm format
  type: z.enum(['full', 'incremental']).default('full'),
  retention: z.number().min(1).max(365).default(30), // days
  enabled: z.boolean().default(true),
});

export interface BackupInfo {
  id: string;
  type: 'full' | 'incremental' | 'selective';
  entities: string[];
  size: number;
  createdAt: Date;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  checksum?: string;
  metadata: any;
}

export interface BackupSchedule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  type: 'full' | 'incremental';
  retention: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}

export class BackupController {
  private static backupPath = './backups';
  private static schedules: Map<string, BackupSchedule> = new Map();

  /**
   * Create a new backup
   */
  static createBackup = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = createBackupSchema.parse(req.body);

      const { type, entities, includeFiles, compression, description } =
        validatedData;
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create backup directory
      const backupDir = path.join(BackupController.backupPath, backupId);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Start backup process asynchronously
      BackupController.performBackup(
        backupId,
        type,
        entities,
        includeFiles,
        compression,
        description,
        user
      ).catch(error => {
        logger.error(`Backup ${backupId} failed:`, error);
      });

      res.json({
        success: true,
        message: 'Backup started successfully',
        data: {
          backupId,
          status: 'pending',
          estimatedTime: type === 'full' ? '5-10 minutes' : '2-5 minutes',
        },
      });
    } catch (error) {
      logger.error('Create backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create backup',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Perform the actual backup operation
   */
  private static async performBackup(
    backupId: string,
    type: string,
    entities: string[] | undefined,
    includeFiles: boolean,
    compression: boolean,
    description: string | undefined,
    user: AuthenticatedUser
  ): Promise<void> {
    const backupDir = path.join(BackupController.backupPath, backupId);
    const backupInfo: BackupInfo = {
      id: backupId,
      type: type as any,
      entities: entities || [],
      size: 0,
      createdAt: new Date(),
      description,
      status: 'in_progress',
      metadata: {
        createdBy: user?.id,
        tenantId: user?.tenantId,
        includeFiles,
        compression,
      },
    };

    try {
      // Save backup info
      const infoPath = path.join(backupDir, 'backup-info.json');
      fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));

      // Database backup
      await BackupController.backupDatabase(backupDir, type, entities);

      // File backup
      if (includeFiles) {
        await BackupController.backupFiles(backupDir, user);
      }

      // Generate checksum
      const checksum = await BackupController.generateChecksum(backupDir);
      backupInfo.checksum = checksum;
      backupInfo.status = 'completed';
      backupInfo.size = BackupController.getDirectorySize(backupDir);

      // Update backup info
      fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));

      // Compress if requested
      if (compression) {
        await BackupController.compressBackup(backupDir);
      }

      logger.info(`Backup ${backupId} completed successfully`);
    } catch (error) {
      backupInfo.status = 'failed';
      backupInfo.error =
        error instanceof Error ? error.message : 'Unknown error';
      fs.writeFileSync(
        path.join(backupDir, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );
      throw error;
    }
  }

  /**
   * Backup database
   */
  private static async backupDatabase(
    backupDir: string,
    type: string,
    entities: string[] | undefined
  ): Promise<void> {
    const dbDir = path.join(backupDir, 'database');
    fs.mkdirSync(dbDir, { recursive: true });

    if (type === 'full') {
      // Full database backup
      // const dbBackupPath = path.join(dbDir, 'full-backup.sql');

      // Export all data as JSON for easier restoration
      const tables = (await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `) as any[];

      const dbData: any = {};

      for (const table of tables) {
        const tableName = table.table_name;
        if (entities && entities.length > 0 && !entities.includes(tableName)) {
          continue;
        }

        const data = await prisma.$queryRawUnsafe(
          `SELECT * FROM "${tableName}"`
        );
        dbData[tableName] = data;
      }

      fs.writeFileSync(
        path.join(dbDir, 'data.json'),
        JSON.stringify(dbData, null, 2)
      );
    } else if (type === 'incremental') {
      // Incremental backup - only changed data since last backup
      const lastBackup = await BackupController.getLastBackupTime();
      const incrementalData: any = {};

      // Get changed records since last backup
      const tables = ['users', 'audit_logs', 'support_tickets'];
      for (const table of tables) {
        if (entities && entities.length > 0 && !entities.includes(table)) {
          continue;
        }

        const data = await prisma.$queryRawUnsafe(
          `
          SELECT * FROM "${table}" 
          WHERE "updatedAt" > $1
        `,
          lastBackup
        );

        incrementalData[table] = data;
      }

      fs.writeFileSync(
        path.join(dbDir, 'incremental.json'),
        JSON.stringify(incrementalData, null, 2)
      );
    }
  }

  /**
   * Backup files
   */
  private static async backupFiles(
    backupDir: string,
    _user: AuthenticatedUser
  ): Promise<void> {
    const filesDir = path.join(backupDir, 'files');
    fs.mkdirSync(filesDir, { recursive: true });

    // Get file metadata from database
    // const files = await prisma.fileUploadMetadata.findMany({
    //   where: user?.isSuperadmin ? {} : { tenantId: user?.tenantId },
    // });

    // const fileMetadata = files.map((file: any) => ({
    //   id: file.id,
    //   filename: file.fileName,
    //   originalName: file.originalName,
    //   mimeType: file.mimeType,
    //   size: file.fileSize,
    //   path: file.filePath,
    //   tenantId: file.tenantId,
    //   uploadedBy: file.uploadedBy,
    //   createdAt: file.createdAt,
    // }));
    const fileMetadata: any[] = [];

    fs.writeFileSync(
      path.join(filesDir, 'metadata.json'),
      JSON.stringify(fileMetadata, null, 2)
    );

    // Copy actual files (in production, this would copy from storage)
    logger.info(`Backed up ${fileMetadata.length} file metadata records`);
  }

  /**
   * List available backups
   */
  static listBackups = async (req: Request, res: Response) => {
    try {
      // const user = req.user as AuthenticatedUser;
      const { page = 1, limit = 20, status, type } = req.query;

      const backups: BackupInfo[] = [];
      const backupDirs = fs.readdirSync(BackupController.backupPath);

      for (const dir of backupDirs) {
        const infoPath = path.join(
          BackupController.backupPath,
          dir,
          'backup-info.json'
        );
        if (fs.existsSync(infoPath)) {
          const backupInfo: BackupInfo = JSON.parse(
            fs.readFileSync(infoPath, 'utf8')
          );

          // Apply filters
          if (status && backupInfo.status !== status) continue;
          if (type && backupInfo.type !== type) continue;

          backups.push(backupInfo);
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b?.createdAt?.getTime() - a?.createdAt?.getTime());

      // Pagination
      const offset = (Number(page) - 1) * Number(limit);
      const paginatedBackups = backups.slice(offset, offset + Number(limit));

      res.json({
        success: true,
        message: 'Backups retrieved successfully',
        data: {
          backups: paginatedBackups,
          total: backups.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(backups.length / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('List backups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list backups',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Restore from backup
   */
  static restoreBackup = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = restoreBackupSchema.parse(req.body);

      const { backupId, entities, validateOnly } = validatedData;
      const backupDir = path.join(BackupController.backupPath, backupId);

      if (!fs.existsSync(backupDir)) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const infoPath = path.join(backupDir, 'backup-info.json');
      const backupInfo: BackupInfo = JSON.parse(
        fs.readFileSync(infoPath, 'utf8')
      );

      if (backupInfo.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Backup not ready for restoration',
          errors: ['The backup is not in a completed state'],
        });
        return;
      }

      if (validateOnly) {
        // Validate backup integrity
        const isValid = await BackupController.validateBackup(
          backupDir,
          backupInfo
        );

        res.json({
          success: true,
          message: 'Backup validation completed',
          data: {
            isValid,
            backupInfo,
          },
        });
      } else {
        // Start restoration process
        BackupController.performRestore(backupId, entities, user).catch(
          error => {
            logger.error(`Restore ${backupId} failed:`, error);
          }
        );

        res.json({
          success: true,
          message: 'Restoration started successfully',
          data: {
            backupId,
            status: 'in_progress',
            estimatedTime: '10-30 minutes',
          },
        });
      }
    } catch (error) {
      logger.error('Restore backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Perform the actual restoration
   */
  private static async performRestore(
    backupId: string,
    entities: string[] | undefined,
    _user: AuthenticatedUser
  ): Promise<void> {
    const backupDir = path.join(BackupController.backupPath, backupId);
    const dbDir = path.join(backupDir, 'database');

    try {
      // Validate backup first
      const infoPath = path.join(backupDir, 'backup-info.json');
      const backupInfo: BackupInfo = JSON.parse(
        fs.readFileSync(infoPath, 'utf8')
      );

      const isValid = await BackupController.validateBackup(
        backupDir,
        backupInfo
      );
      if (!isValid) {
        throw new Error('Backup validation failed');
      }

      // Restore database
      if (fs.existsSync(path.join(dbDir, 'data.json'))) {
        const data = JSON.parse(
          fs.readFileSync(path.join(dbDir, 'data.json'), 'utf8')
        );

        for (const [tableName, records] of Object.entries(data)) {
          if (
            entities &&
            entities.length > 0 &&
            !entities.includes(tableName)
          ) {
            continue;
          }

          // Clear existing data for selected entities
          await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);

          // Insert backup data
          if (Array.isArray(records) && records.length > 0) {
            await prisma.$executeRawUnsafe(
              `
              INSERT INTO "${tableName}" SELECT * FROM json_populate_recordset(null::"${tableName}", $1)
            `,
              JSON.stringify(records)
            );
          }
        }
      }

      logger.info(`Restore ${backupId} completed successfully`);
    } catch (error) {
      logger.error(`Restore ${backupId} failed:`, error);
      throw error;
    }
  }

  /**
   * Export data
   */
  static exportData = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = exportDataSchema.parse(req.body);

      const { entities, format, filters, includeMetadata, compression } =
        validatedData;
      const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create export directory
      const exportDir = path.join(
        BackupController.backupPath,
        'exports',
        exportId
      );
      fs.mkdirSync(exportDir, { recursive: true });

      // Start export process
      BackupController.performExport(
        exportId,
        entities,
        format,
        filters,
        includeMetadata,
        compression,
        user
      ).catch(error => {
        logger.error(`Export ${exportId} failed:`, error);
      });

      res.json({
        success: true,
        message: 'Data export started successfully',
        data: {
          exportId,
          status: 'pending',
          estimatedTime: '2-5 minutes',
        },
      });
    } catch (error) {
      logger.error('Export data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Perform the actual export
   */
  private static async performExport(
    exportId: string,
    entities: string[],
    format: string,
    filters: any,
    includeMetadata: boolean,
    compression: boolean,
    user: AuthenticatedUser
  ): Promise<void> {
    const exportDir = path.join(
      BackupController.backupPath,
      'exports',
      exportId
    );

    try {
      const exportData: any = {};

      for (const entity of entities) {
        const data = await BackupController.exportEntity(entity, filters, user);
        exportData[entity] = data;
      }

      // Add metadata if requested
      if (includeMetadata) {
        exportData.metadata = {
          exportedAt: new Date(),
          exportedBy: user?.id,
          tenantId: user?.tenantId,
          entities,
          format,
          filters,
        };
      }

      // Write export file
      const exportPath = path.join(exportDir, `export.${format}`);

      if (format === 'json') {
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      } else if (format === 'csv') {
        await BackupController.writeCSV(exportPath, exportData);
      } else if (format === 'sql') {
        await BackupController.writeSQL(exportPath, exportData);
      }

      // Compress if requested
      if (compression) {
        await BackupController.compressFile(exportPath);
      }

      logger.info(`Export ${exportId} completed successfully`);
    } catch (error) {
      logger.error(`Export ${exportId} failed:`, error);
      throw error;
    }
  }

  /**
   * Export specific entity
   */
  private static async exportEntity(
    entity: string,
    filters: any,
    user: AuthenticatedUser
  ): Promise<any[]> {
    const whereClause: any = {};

    // Apply data scope
    if (!user?.isSuperadmin) {
      whereClause.tenantId = user?.tenantId;
    }

    // Apply custom filters
    if (filters && filters[entity]) {
      Object.assign(whereClause, filters[entity]);
    }

    switch (entity) {
      case 'users':
        return await prisma?.user?.findMany({ where: whereClause });
      case 'roles':
        return await prisma?.role?.findMany({ where: whereClause });
      case 'support_tickets':
        return await prisma?.supportTicket?.findMany({ where: whereClause });
      case 'audit_logs':
        return await prisma?.auditLog?.findMany({ where: whereClause });
      default:
        throw new Error(`Unknown entity: ${entity}`);
    }
  }

  /**
   * Schedule backup
   */
  static scheduleBackup = async (req: Request, res: Response) => {
    try {
      // const user = req.user as AuthenticatedUser;
      const validatedData = scheduleBackupSchema.parse(req.body);

      const { frequency, time, type, retention, enabled } = validatedData;
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const schedule: BackupSchedule = {
        id: scheduleId,
        frequency,
        time,
        type,
        retention,
        enabled,
        createdAt: new Date(),
        nextRun: BackupController.calculateNextRun(frequency, time),
      };

      // Save schedule
      BackupController?.schedules?.set(scheduleId, schedule);

      // Save to file for persistence
      const schedulesPath = path.join(
        BackupController.backupPath,
        'schedules.json'
      );
      const schedules = Array.from(BackupController?.schedules?.values());
      fs.writeFileSync(schedulesPath, JSON.stringify(schedules, null, 2));

      res.json({
        success: true,
        message: 'Backup schedule created successfully',
        data: schedule,
      });
    } catch (error) {
      logger.error('Schedule backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule backup',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get backup status
   */
  static getBackupStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { backupId } = req.params;

      if (!backupId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const backupDir = path.join(BackupController.backupPath, backupId);

      if (!fs.existsSync(backupDir)) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const infoPath = path.join(backupDir, 'backup-info.json');
      const backupInfo: BackupInfo = JSON.parse(
        fs.readFileSync(infoPath, 'utf8')
      );

      res.json({
        success: true,
        message: 'Backup status retrieved successfully',
        data: backupInfo,
      });
    } catch (error) {
      logger.error('Get backup status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get backup status',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Utility methods
  private static async generateChecksum(dir: string): Promise<string> {
    // Simple checksum implementation
    const files = fs.readdirSync(dir);
    let checksum = '';

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      checksum += `${file}_${stats.size}_${stats?.mtime?.getTime()}`;
    }

    return require('crypto').createHash('md5').update(checksum).digest('hex');
  }

  private static getDirectorySize(dir: string): number {
    let size = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      size += stats.size;
    }

    return size;
  }

  private static async compressBackup(dir: string): Promise<void> {
    const output = fs.createWriteStream(`${dir}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(dir, false);
    await archive.finalize();
  }

  private static async compressFile(filePath: string): Promise<void> {
    const output = fs.createWriteStream(`${filePath}.gz`);
    const gzip = require('zlib').createGzip();

    fs.createReadStream(filePath).pipe(gzip).pipe(output);
  }

  private static async validateBackup(
    backupDir: string,
    backupInfo: BackupInfo
  ): Promise<boolean> {
    try {
      // Check if all required files exist
      const requiredFiles = ['backup-info.json', 'database'];
      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(backupDir, file))) {
          return false;
        }
      }

      // Validate checksum if available
      if (backupInfo.checksum) {
        const currentChecksum =
          await BackupController.generateChecksum(backupDir);
        return currentChecksum === backupInfo.checksum;
      }

      return true;
    } catch (error) {
      logger.error('Backup validation error:', error);
      return false;
    }
  }

  private static async getLastBackupTime(): Promise<Date> {
    // Get the timestamp of the last successful backup
    const backupDirs = fs.readdirSync(BackupController.backupPath);
    let lastBackupTime = new Date(0);

    for (const dir of backupDirs) {
      const infoPath = path.join(
        BackupController.backupPath,
        dir,
        'backup-info.json'
      );
      if (fs.existsSync(infoPath)) {
        const backupInfo: BackupInfo = JSON.parse(
          fs.readFileSync(infoPath, 'utf8')
        );
        if (
          backupInfo.status === 'completed' &&
          backupInfo.createdAt > lastBackupTime
        ) {
          lastBackupTime = backupInfo.createdAt;
        }
      }
    }

    return lastBackupTime;
  }

  private static calculateNextRun(frequency: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date(now);

    if (hours !== undefined && minutes !== undefined) {
      nextRun.setHours(hours, minutes, 0, 0);
    }

    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun;
  }

  private static async writeCSV(_filePath: string, _data: any): Promise<void> {
    // Implementation for CSV export
    logger.info('CSV export not fully implemented');
  }

  private static async writeSQL(_filePath: string, _data: any): Promise<void> {
    // Implementation for SQL export
    logger.info('SQL export not fully implemented');
  }
}

// Export middleware-wrapped methods
export const createBackup = [superadminOnly, BackupController.createBackup];

export const listBackups = [superadminOnly, BackupController.listBackups];

export const restoreBackup = [superadminOnly, BackupController.restoreBackup];

export const exportData = [superadminOnly, BackupController.exportData];

export const scheduleBackup = [superadminOnly, BackupController.scheduleBackup];

export const getBackupStatus = [
  superadminOnly,
  BackupController.getBackupStatus,
];
