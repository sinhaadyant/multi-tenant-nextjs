// PrismaClient is imported in base repository
import { BaseRepository } from './prisma';

export interface AuditLogFilters {
  tenantId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  filters?: AuditLogFilters;
  orderBy?: any;
}

export class AuditRepository extends BaseRepository<any> {
  override async findById(id: string): Promise<any> {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        tenant: true,
        user: true,
      },
    });
  }

  override async findMany(params: AuditLogListParams = {}): Promise<any[]> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      orderBy = { createdAt: 'desc' },
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search } },
        { ipAddress: { contains: filters.search } },
      ];
    }

    return this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        tenant: true,
        user: true,
      },
    });
  }

  override async create(data: any): Promise<any> {
    return this.prisma.auditLog.create({
      data,
      include: {
        tenant: true,
        user: true,
      },
    });
  }

  override async count(filters: AuditLogFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search } },
        { ipAddress: { contains: filters.search } },
      ];
    }

    return this.prisma.auditLog.count({ where });
  }

  // Convenience methods for common audit actions
  async logUserLogin(
    userId: string,
    tenantId: string | null,
    ipAddress: string,
    details?: any
  ): Promise<any> {
    return this.create({
      userId,
      tenantId,
      action: 'USER_LOGIN',
      ipAddress,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logUserLogout(
    userId: string,
    tenantId: string | null,
    ipAddress: string,
    details?: any
  ): Promise<any> {
    return this.create({
      userId,
      tenantId,
      action: 'USER_LOGOUT',
      ipAddress,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logUserAction(
    userId: string,
    tenantId: string | null,
    action: string,
    ipAddress: string,
    details?: any
  ): Promise<any> {
    return this.create({
      userId,
      tenantId,
      action,
      ipAddress,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logSystemAction(action: string, details?: any): Promise<any> {
    return this.create({
      userId: 'system',
      tenantId: null,
      action,
      ipAddress: 'system',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Get audit statistics
  async getAuditStats(tenantId?: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: startDate,
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [totalLogs, uniqueUsers, topActions] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: {
          userId: true,
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      uniqueUsers: uniqueUsers.length,
      topActions: topActions.map((item: any) => ({
        action: item.action,
        count: item._count.action,
      })),
    };
  }

  // Cleanup old audit logs (keep for specified days)
  async cleanupOldLogs(daysToKeep: number = 365): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}
