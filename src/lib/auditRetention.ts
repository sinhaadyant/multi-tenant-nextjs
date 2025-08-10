import { prisma } from '@/lib/prisma';
import { createAuditLog } from './audit';

export interface RetentionPolicy {
  tenantId: string;
  retentionDays: number;
  autoArchive: boolean;
  archiveAfterDays: number;
  purgeAfterDays: number;
}

export interface AuditLogStats {
  total: number;
  archived: number;
  expired: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  oldestLog: Date | null;
  newestLog: Date | null;
}

/**
 * Archive old audit logs based on retention policy
 */
export const archiveOldAuditLogs = async (tenantId?: string): Promise<number> => {
  try {
    const whereClause: any = {
      isArchived: false,
      archivedAt: null,
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Archive logs older than 90 days by default
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - 90);

    const result = await prisma.auditLog.updateMany({
      where: {
        ...whereClause,
        createdAt: {
          lt: archiveDate
        }
      },
      data: {
        isArchived: true,
        archivedAt: new Date()
      }
    });

    console.log(`📦 Archived ${result.count} audit logs`);
    return result.count;
  } catch (error) {
    console.error('❌ Failed to archive audit logs:', error);
    return 0;
  }
};

/**
 * Purge expired audit logs based on retention policy
 */
export const purgeExpiredAuditLogs = async (tenantId?: string): Promise<number> => {
  try {
    const whereClause: any = {
      retentionExpiry: {
        lt: new Date()
      }
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const result = await prisma.auditLog.deleteMany({
      where: whereClause
    });

    console.log(`🗑️ Purged ${result.count} expired audit logs`);
    return result.count;
  } catch (error) {
    console.error('❌ Failed to purge expired audit logs:', error);
    return 0;
  }
};

/**
 * Get audit log statistics for a tenant
 */
export const getAuditLogStats = async (tenantId: string): Promise<AuditLogStats> => {
  try {
    const [
      total,
      archived,
      expired,
      severityStats,
      statusStats,
      oldestLog,
      newestLog
    ] = await Promise.all([
      prisma.auditLog.count({
        where: { tenantId }
      }),
      prisma.auditLog.count({
        where: { 
          tenantId,
          isArchived: true 
        }
      }),
      prisma.auditLog.count({
        where: { 
          tenantId,
          retentionExpiry: {
            lt: new Date()
          }
        }
      }),
      prisma.auditLog.groupBy({
        by: ['severity'],
        _count: { id: true },
        where: { tenantId }
      }),
      prisma.auditLog.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { tenantId }
      }),
      prisma.auditLog.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      }),
      prisma.auditLog.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);

    const bySeverity = severityStats.reduce((acc, stat) => {
      acc[stat.severity] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      archived,
      expired,
      bySeverity,
      byStatus,
      oldestLog: oldestLog?.createdAt || null,
      newestLog: newestLog?.createdAt || null
    };
  } catch (error) {
    console.error('❌ Failed to get audit log stats:', error);
    return {
      total: 0,
      archived: 0,
      expired: 0,
      bySeverity: {},
      byStatus: {},
      oldestLog: null,
      newestLog: null
    };
  }
};

/**
 * Set retention policy for a tenant
 */
export const setRetentionPolicy = async (
  tenantId: string,
  policy: Partial<RetentionPolicy>
): Promise<void> => {
  try {
    // Store retention policy in system settings
    await prisma.systemSetting.upsert({
      where: {
        key: `audit_retention_${tenantId}`
      },
      update: {
        value: JSON.stringify(policy)
      },
      create: {
        key: `audit_retention_${tenantId}`,
        value: JSON.stringify(policy),
        type: 'audit_retention'
      }
    });

    // Update existing logs with new retention expiry
    const retentionDays = policy.retentionDays || 365;
    const retentionExpiry = new Date();
    retentionExpiry.setDate(retentionExpiry.getDate() + retentionDays);

    await prisma.auditLog.updateMany({
      where: {
        tenantId,
        retentionExpiry: null
      },
      data: {
        retentionExpiry
      }
    });

    console.log(`📋 Updated retention policy for tenant ${tenantId}`);
  } catch (error) {
    console.error('❌ Failed to set retention policy:', error);
    throw error;
  }
};

/**
 * Get retention policy for a tenant
 */
export const getRetentionPolicy = async (tenantId: string): Promise<RetentionPolicy | null> => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: {
        key: `audit_retention_${tenantId}`
      }
    });

    if (!setting) {
      return null;
    }

    return JSON.parse(setting.value);
  } catch (error) {
    console.error('❌ Failed to get retention policy:', error);
    return null;
  }
};

/**
 * Run maintenance tasks for audit logs
 */
export const runAuditLogMaintenance = async (tenantId?: string): Promise<{
  archived: number;
  purged: number;
  errors: string[];
}> => {
  const errors: string[] = [];

  try {
    // Archive old logs
    const archived = await archiveOldAuditLogs(tenantId);
    
    // Purge expired logs
    const purged = await purgeExpiredAuditLogs(tenantId);

    // Log the maintenance action
    if (archived > 0 || purged > 0) {
      await createAuditLog({
        action: 'audit.maintenance',
        details: {
          archived,
          purged,
          tenantId: tenantId || 'all'
        },
        severity: 'info',
        resourceType: 'audit_maintenance'
      });
    }

    return { archived, purged, errors };
  } catch (error) {
    errors.push(`Maintenance failed: ${error}`);
    return { archived: 0, purged: 0, errors };
  }
};

/**
 * Export audit logs for compliance
 */
export const exportAuditLogsForCompliance = async (
  tenantId: string,
  startDate: Date,
  endDate: Date,
  format: 'csv' | 'json' | 'pdf' = 'csv'
): Promise<string> => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: { email: true, name: true }
        },
        superAdmin: {
          select: { email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'json') {
      return JSON.stringify({
        tenantId,
        exportDate: new Date().toISOString(),
        dateRange: { startDate, endDate },
        totalRecords: logs.length,
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          details: log.details,
          createdAt: log.createdAt,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          status: log.status,
          severity: log.severity,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          user: log.user ? {
            email: log.user.email,
            name: log.user.name
          } : null,
          superAdmin: log.superAdmin ? {
            email: log.superAdmin.email,
            name: log.superAdmin.name
          } : null
        }))
      }, null, 2);
    }

    // CSV format
    const headers = [
      'ID', 'Action', 'Details', 'Created At', 'IP Address', 'User Agent',
      'Status', 'Severity', 'Resource Type', 'Resource ID',
      'User Email', 'User Name', 'Super Admin Email', 'Super Admin Name'
    ];

    const rows = logs.map(log => [
      log.id,
      log.action,
      log.details || '',
      log.createdAt.toISOString(),
      log.ipAddress || '',
      log.userAgent || '',
      log.status,
      log.severity,
      log.resourceType || '',
      log.resourceId || '',
      log.user?.email || '',
      log.user?.name || '',
      log.superAdmin?.email || '',
      log.superAdmin?.name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('❌ Failed to export audit logs for compliance:', error);
    throw error;
  }
}; 