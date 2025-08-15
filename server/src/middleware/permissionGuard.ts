import { Request, Response, NextFunction } from 'express';
import { permissionService } from '@/services/PermissionService';
import { dataScopeService } from '@/services/DataScopeService';
import { AuthorizationError, NotFoundError } from '@/utils/errors';
import { AuthenticatedUser } from './auth';
import { logger } from '@/config/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'view_all';

export interface PermissionGuardOptions {
  moduleKey: string;
  action: PermissionAction;
  requireTenant?: boolean;
  allowSuperadmin?: boolean;
  tableName?: string;
}

export interface RecordLevelGuardOptions {
  moduleKey: string;
  action: PermissionAction;
  recordIdParam?: string;
  tableName?: string;
  model?: any;
}

export interface BulkPermissionGuardOptions {
  moduleKey: string;
  action: PermissionAction;
  recordIdsParam?: string;
  tableName?: string;
  model?: any;
}

/**
 * Enhanced permission guard middleware
 * Supports the new permission system with data scope validation
 */
export const permissionGuard = (options: PermissionGuardOptions) => {
  const {
    moduleKey,
    action,
    requireTenant = true,
    allowSuperadmin = true,
    tableName,
  } = options;

  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;

      // Check if user is authenticated
      if (!user) {
        throw new AuthorizationError('Authentication required');
      }

      // Superadmin bypass (if allowed)
      if (allowSuperadmin && user.isSuperadmin) {
        return next();
      }

      // Check if tenant is required and available
      if (requireTenant && !user.tenantId) {
        throw new AuthorizationError('Tenant context required');
      }

      // Check permission using the new permission system
      const hasPermission = await permissionService.hasPermission(
        user.id,
        moduleKey,
        action
      );

      if (!hasPermission) {
        logger.warn(
          `User ${user.id} denied ${action} permission for ${moduleKey}`
        );
        throw new AuthorizationError(
          `Insufficient permissions: ${action} permission required for ${moduleKey}`
        );
      }

      // Validate data scope if table name is provided
      if (tableName) {
        const dataScope = await permissionService.getDataScope(
          user.id,
          moduleKey
        );

        // Store data scope in request for use in route handlers
        (req as any).dataScope = dataScope;

        logger.debug(
          `User ${user.id} has ${dataScope.scope} scope for ${moduleKey}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Record-level permission guard for checking access to specific records
 */
export const recordLevelGuard = (options: RecordLevelGuardOptions) => {
  const { moduleKey, action, recordIdParam = 'id', tableName, model } = options;

  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const recordId = req.params[recordIdParam];

      if (!user) {
        throw new AuthorizationError('Authentication required');
      }

      if (!recordId) {
        throw new AuthorizationError('Record ID required');
      }

      // Superadmin bypass
      if (user.isSuperadmin) {
        return next();
      }

      // Check permission first
      const hasPermission = await permissionService.hasPermission(
        user.id,
        moduleKey,
        action
      );

      if (!hasPermission) {
        logger.warn(
          `User ${user.id} denied ${action} permission for ${moduleKey}`
        );
        throw new AuthorizationError(
          `Insufficient permissions: ${action} permission required for ${moduleKey}`
        );
      }

      // Get the record
      let record;
      if (model) {
        record = await model.findUnique({ where: { id: recordId } });
      } else {
        // Try to find record in common models
        record = await findRecordInCommonModels(recordId, tableName);
      }

      if (!record) {
        throw new NotFoundError('Record not found');
      }

      // Validate data access
      const canAccess = await dataScopeService.validateDataAccess(
        user.id,
        record,
        moduleKey,
        tableName
      );

      if (!canAccess) {
        logger.warn(
          `User ${user.id} denied access to record ${recordId} in ${moduleKey}`
        );
        throw new AuthorizationError('Access denied to this record');
      }

      // Store record in request for use in route handlers
      (req as any).targetRecord = record;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Bulk permission guard for bulk operations
 */
export const bulkPermissionGuard = (options: BulkPermissionGuardOptions) => {
  const {
    moduleKey,
    action,
    recordIdsParam = 'ids',
    tableName,
    model,
  } = options;

  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const recordIds = req.body[recordIdsParam] || req.query[recordIdsParam];

      if (!user) {
        throw new AuthorizationError('Authentication required');
      }

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        throw new AuthorizationError('Record IDs array required');
      }

      // Superadmin bypass
      if (user.isSuperadmin) {
        return next();
      }

      // Check permission first
      const hasPermission = await permissionService.hasPermission(
        user.id,
        moduleKey,
        action
      );

      if (!hasPermission) {
        logger.warn(
          `User ${user.id} denied ${action} permission for ${moduleKey}`
        );
        throw new AuthorizationError(
          `Insufficient permissions: ${action} permission required for ${moduleKey}`
        );
      }

      // Get the records
      let records;
      if (model) {
        records = await model.findMany({ where: { id: { in: recordIds } } });
      } else {
        records = await findRecordsInCommonModels(recordIds, tableName);
      }

      if (records.length === 0) {
        throw new NotFoundError('No records found');
      }

      // Validate bulk data access
      const { validRecords, invalidRecords } =
        await dataScopeService.validateBulkDataAccess(
          user.id,
          records,
          moduleKey,
          tableName
        );

      if (invalidRecords.length > 0) {
        logger.warn(
          `User ${user.id} denied access to ${invalidRecords.length} records in ${moduleKey}`
        );
        throw new AuthorizationError(
          `Access denied to ${invalidRecords.length} records`,
          {
            invalidRecordIds: invalidRecords.map(r => r.id),
            validRecordIds: validRecords.map(r => r.id),
          }
        );
      }

      // Store records in request for use in route handlers
      (req as any).targetRecords = validRecords;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check permissions without throwing (for conditional UI logic)
 */
export const checkPermissionSilently = async (
  userId: string,
  moduleKey: string,
  action: PermissionAction
): Promise<boolean> => {
  try {
    return await permissionService.hasPermission(userId, moduleKey, action);
  } catch (error) {
    logger.debug(
      `Silent permission check failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
};

/**
 * Check data scope without throwing
 */
export const checkDataScopeSilently = async (
  userId: string,
  moduleKey: string
): Promise<{ scope: string; hasAccess: boolean }> => {
  try {
    const dataScope = await permissionService.getDataScope(userId, moduleKey);
    return {
      scope: dataScope.scope,
      hasAccess: true,
    };
  } catch (error) {
    logger.debug(
      `Silent data scope check failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      scope: 'own',
      hasAccess: false,
    };
  }
};

/**
 * Validate record ownership for conditional permissions
 */
export const validateRecordOwnership = async (
  userId: string,
  record: any,
  moduleKey: string,
  tableName?: string
): Promise<boolean> => {
  try {
    return await dataScopeService.validateDataAccess(
      userId,
      record,
      moduleKey,
      tableName
    );
  } catch (error) {
    logger.debug(
      `Record ownership validation failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
};

/**
 * Get detailed permission information for debugging
 */
export const getPermissionDetails = async (
  userId: string,
  moduleKey: string
): Promise<{
  permissions: any;
  dataScope: any;
  accessibleModules: any[];
}> => {
  try {
    const [permissions, dataScope, accessibleModules] = await Promise.all([
      permissionService.getUserPermissions(userId),
      permissionService.getDataScope(userId, moduleKey),
      permissionService.getAccessibleModules(userId),
    ]);

    return {
      permissions,
      dataScope,
      accessibleModules,
    };
  } catch (error) {
    logger.error(
      `Failed to get permission details for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
};

// Helper function to find record in common models
const findRecordInCommonModels = async (
  recordId: string,
  tableName?: string
) => {
  const models: { [key: string]: any } = {
    users: prisma.user,
    roles: prisma.role,
    support_tickets: prisma.supportTicket,
    support_replies: prisma.supportReply,
    audit_logs: prisma.auditLog,
  };

  if (tableName && models[tableName]) {
    return await models[tableName].findUnique({
      where: { id: recordId },
    });
  }

  // Try all models if table name not specified
  for (const [, model] of Object.entries(models)) {
    try {
      const record = await model.findUnique({ where: { id: recordId } });
      if (record) {
        return record;
      }
    } catch (error) {
      // Continue to next model
    }
  }

  return null;
};

// Helper function to find records in common models
const findRecordsInCommonModels = async (
  recordIds: string[],
  tableName?: string
) => {
  const models: { [key: string]: any } = {
    users: prisma.user,
    roles: prisma.role,
    support_tickets: prisma.supportTicket,
    support_replies: prisma.supportReply,
    audit_logs: prisma.auditLog,
  };

  if (tableName && models[tableName]) {
    return await models[tableName].findMany({
      where: { id: { in: recordIds } },
    });
  }

  // Try all models if table name not specified
  for (const [, model] of Object.entries(models)) {
    try {
      const records = await model.findMany({
        where: { id: { in: recordIds } },
      });
      if (records.length > 0) {
        return records;
      }
    } catch (error) {
      // Continue to next model
    }
  }

  return [];
};

// Convenience middleware for common permission patterns
export const requireCreate = (
  moduleKey: string,
  options?: Partial<PermissionGuardOptions>
) => permissionGuard({ moduleKey, action: 'create', ...options });

export const requireRead = (
  moduleKey: string,
  options?: Partial<PermissionGuardOptions>
) => permissionGuard({ moduleKey, action: 'read', ...options });

export const requireUpdate = (
  moduleKey: string,
  options?: Partial<PermissionGuardOptions>
) => permissionGuard({ moduleKey, action: 'update', ...options });

export const requireDelete = (
  moduleKey: string,
  options?: Partial<PermissionGuardOptions>
) => permissionGuard({ moduleKey, action: 'delete', ...options });

export const requireViewAll = (
  moduleKey: string,
  options?: Partial<PermissionGuardOptions>
) => permissionGuard({ moduleKey, action: 'view_all', ...options });

// Record-level convenience middleware
export const requireRecordCreate = (
  moduleKey: string,
  options?: Partial<RecordLevelGuardOptions>
) => recordLevelGuard({ moduleKey, action: 'create', ...options });

export const requireRecordRead = (
  moduleKey: string,
  options?: Partial<RecordLevelGuardOptions>
) => recordLevelGuard({ moduleKey, action: 'read', ...options });

export const requireRecordUpdate = (
  moduleKey: string,
  options?: Partial<RecordLevelGuardOptions>
) => recordLevelGuard({ moduleKey, action: 'update', ...options });

export const requireRecordDelete = (
  moduleKey: string,
  options?: Partial<RecordLevelGuardOptions>
) => recordLevelGuard({ moduleKey, action: 'delete', ...options });

// Bulk operation convenience middleware
export const requireBulkCreate = (
  moduleKey: string,
  options?: Partial<BulkPermissionGuardOptions>
) => bulkPermissionGuard({ moduleKey, action: 'create', ...options });

export const requireBulkRead = (
  moduleKey: string,
  options?: Partial<BulkPermissionGuardOptions>
) => bulkPermissionGuard({ moduleKey, action: 'read', ...options });

export const requireBulkUpdate = (
  moduleKey: string,
  options?: Partial<BulkPermissionGuardOptions>
) => bulkPermissionGuard({ moduleKey, action: 'update', ...options });

export const requireBulkDelete = (
  moduleKey: string,
  options?: Partial<BulkPermissionGuardOptions>
) => bulkPermissionGuard({ moduleKey, action: 'delete', ...options });

// Middleware for superadmin-only endpoints
export const superadminOnly = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthorizationError('Authentication required');
  }

  if (!req.user.isSuperadmin) {
    throw new AuthorizationError('Superadmin access required');
  }

  next();
};

// Middleware for tenant-only endpoints (no superadmin)
export const tenantOnly = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthorizationError('Authentication required');
  }

  if (req.user.isSuperadmin) {
    throw new AuthorizationError('Tenant user access required');
  }

  if (!req.user.tenantId) {
    throw new AuthorizationError('Tenant context required');
  }

  next();
};
