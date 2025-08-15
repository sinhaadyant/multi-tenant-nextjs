import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/config/logger';
import { AuthenticatedUser } from '@/middleware/auth';
import { permissionGuard } from '@/middleware/permissionGuard';
import { dataScopeService } from '@/services/DataScopeService';

const prisma = new PrismaClient();

// Analytics schemas
const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  entity: z
    .enum(['users', 'roles', 'support_tickets', 'audit_logs'])
    .optional(),
});

const customReportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  queries: z.array(
    z.object({
      entity: z.enum(['users', 'roles', 'support_tickets', 'audit_logs']),
      metrics: z.array(z.string()),
      filters: z.record(z.string(), z.any()).optional(),
      groupBy: z.array(z.string()).optional(),
    })
  ),
  schedule: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      recipients: z.array(z.string()).optional(),
    })
    .optional(),
});

export class AnalyticsController {
  /**
   * Get main dashboard metrics with data scope
   */
  static getDashboardMetrics = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = analyticsQuerySchema.parse(req.query);

      const { startDate, endDate, groupBy } = validatedData;
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get metrics based on user permissions
      const metrics: any = {};

      if (user?.isSuperadmin) {
        // User metrics
        const userMetrics = await AnalyticsController.getUserMetrics(
          user,
          start,
          end,
          groupBy
        );
        metrics.users = userMetrics;

        // System performance metrics
        const performanceMetrics =
          await AnalyticsController.getSystemPerformanceMetricsHelper();
        metrics.performance = performanceMetrics;

        // Support ticket metrics
        const supportMetrics = await AnalyticsController.getSupportMetrics(
          user,
          start,
          end,
          groupBy
        );
        metrics.support = supportMetrics;

        // Audit activity metrics
        const auditMetrics = await AnalyticsController.getAuditMetrics(
          user,
          start,
          end,
          groupBy
        );
        metrics.audit = auditMetrics;
      } else {
        // Limited metrics for regular users
        metrics.users = await AnalyticsController.getOwnUserMetrics(
          user,
          start,
          end
        );
        metrics.support = await AnalyticsController.getOwnSupportMetrics(
          user,
          start,
          end
        );
      }

      res.json({
        success: true,
        message: 'Dashboard metrics retrieved successfully',
        data: metrics,
      });
    } catch (error) {
      logger.error('Dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard metrics',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  };

  /**
   * Get user analytics with tenant isolation
   */
  static getUserAnalytics = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = analyticsQuerySchema.parse(req.query);

      const { startDate, endDate, groupBy } = validatedData;
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const userMetrics = await AnalyticsController.getUserMetrics(
        user,
        start,
        end,
        groupBy
      );

      res.json({
        success: true,
        message: 'User analytics retrieved successfully',
        data: userMetrics,
      });
    } catch (error) {
      logger.error('User analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user analytics',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  };

  /**
   * Get system performance metrics
   */
  static getSystemPerformanceMetrics = async (_req: Request, res: Response) => {
    try {
      // const user = req.user as AuthenticatedUser;
      // const validatedData = analyticsQuerySchema.parse(req.query);

      // const { startDate, endDate } = validatedData;
      // const start = startDate
      //   ? new Date(startDate)
      //   : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      // const end = endDate ? new Date(endDate) : new Date();

      const performanceMetrics =
        await AnalyticsController.getSystemPerformanceMetricsHelper();

      return res.json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: performanceMetrics,
      });
    } catch (error) {
      logger.error('Performance metrics error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Generate custom reports with permission-based data access
   */
  static generateCustomReport = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = customReportSchema.parse(req.body);

      const { name, description, queries, schedule } = validatedData;

      const reportResults: any[] = [];

      for (const query of queries) {
        const { entity, metrics, filters, groupBy } = query;

        const entityData = await AnalyticsController.executeCustomQuery(
          entity,
          metrics,
          filters,
          groupBy || [],
          user
        );

        reportResults.push({
          entity,
          metrics,
          data: entityData,
        });
      }

      // Save report if scheduled
      if (schedule) {
        if (schedule) {
          await AnalyticsController.saveScheduledReport(
            name,
            description || '',
            schedule,
            user
          );
        }
      }

      res.json({
        success: true,
        message: 'Custom report generated successfully',
        data: {
          name,
          description,
          results: reportResults,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Custom report generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate custom report',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  };

  /**
   * Export analytics data with scope filtering
   */
  static exportAnalyticsData = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { entity, format, filters } = req.query;

      if (!entity || typeof entity !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Entity parameter is required',
        });
        return;
      }

      const exportData = await AnalyticsController.exportEntityData(
        entity,
        format as string,
        filters as any,
        user
      );

      // Set response headers for file download
      const filename = `${entity}_analytics_${new Date().toISOString().split('T')[0]}.${format || 'json'}`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader(
        'Content-Type',
        format === 'csv' ? 'text/csv' : 'application/json'
      );

      res.json({
        success: true,
        message: 'Analytics data exported successfully',
        data: exportData,
      });
    } catch (error) {
      logger.error('Analytics export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  };

  /**
   * Get trend analysis with tenant scope
   */
  static getTrendAnalysis = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = analyticsQuerySchema.parse(req.query);

      const { startDate, endDate, groupBy, entity } = validatedData;
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const trends = await AnalyticsController.calculateTrends(
        entity,
        start,
        end,
        groupBy,
        user
      );

      res.json({
        success: true,
        message: 'Trend analysis retrieved successfully',
        data: trends,
      });
    } catch (error) {
      logger.error('Trend analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trend analysis',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  };

  // Helper methods

  /**
   * Get user metrics with data scope
   */
  private static async getUserMetrics(
    user: AuthenticatedUser,
    start: Date,
    end: Date,
    groupBy: string
  ) {
    const baseQuery = {
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter<
      typeof baseQuery
    >(baseQuery, user?.id, 'users', 'users');

    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      prisma?.user?.count({ where: (scopedQuery as any).where }),
      prisma?.user?.count({
        where: {
          ...(scopedQuery as any).where,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma?.user?.count({
        where: {
          ...(scopedQuery as any).where,
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Group by time period
    const groupedData = await AnalyticsController.groupByTimePeriod(
      'users',
      'createdAt',
      start,
      end,
      groupBy,
      (scopedQuery as any).where
    );

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : '0',
      groupedData,
    };
  }

  /**
   * Get own user metrics (limited scope)
   */
  private static async getOwnUserMetrics(
    user: AuthenticatedUser,
    _start: Date,
    _end: Date
  ) {
    const ownMetrics = await prisma?.user?.findUnique({
      where: { id: user?.id },
      select: {
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return {
      ownProfile: {
        created: ownMetrics?.createdAt,
        lastLogin: ownMetrics?.lastLoginAt,
        daysSinceCreation: ownMetrics?.createdAt
          ? Math.floor(
              (Date.now() - ownMetrics?.createdAt?.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      },
    };
  }

  /**
   * Get support metrics with data scope
   */
  private static async getSupportMetrics(
    user: AuthenticatedUser,
    start: Date,
    end: Date,
    groupBy: string
  ) {
    const baseQuery = {
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter<
      typeof baseQuery
    >(baseQuery, user?.id, 'support_tickets', 'support_tickets');

    const [totalTickets, openTickets, resolvedTickets] = await Promise.all([
      prisma?.supportTicket?.count({ where: (scopedQuery as any).where }),
      prisma?.supportTicket?.count({
        where: {
          ...(scopedQuery as any).where,
          status: 'open',
        },
      }),
      prisma?.supportTicket?.count({
        where: {
          ...(scopedQuery as any).where,
          status: 'resolved',
        },
      }),
    ]);

    const groupedData = await AnalyticsController.groupByTimePeriod(
      'support_tickets',
      'createdAt',
      start,
      end,
      groupBy,
      (scopedQuery as any).where
    );

    return {
      total: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      resolutionRate:
        totalTickets > 0
          ? ((resolvedTickets / totalTickets) * 100).toFixed(2)
          : '0',
      groupedData,
    };
  }

  /**
   * Get own support metrics (limited scope)
   */
  private static async getOwnSupportMetrics(
    user: AuthenticatedUser,
    start: Date,
    end: Date
  ) {
    const ownTickets = await prisma?.supportTicket?.findMany({
      where: {
        userId: user?.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      ownTickets: {
        total: ownTickets.length,
        open: ownTickets.filter(t => t.status === 'open').length,
        resolved: ownTickets.filter(t => t.status === 'resolved').length,
      },
    };
  }

  /**
   * Get audit metrics with data scope
   */
  private static async getAuditMetrics(
    user: AuthenticatedUser,
    start: Date,
    end: Date,
    groupBy: string
  ) {
    const baseQuery = {
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter<
      typeof baseQuery
    >(baseQuery, user?.id, 'audit_logs', 'audit_logs');

    const [totalActions, uniqueUsers] = await Promise.all([
      prisma?.auditLog?.count({ where: (scopedQuery as any).where }),
      prisma?.auditLog?.groupBy({
        by: ['userId'],
        where: (scopedQuery as any).where,
        _count: {
          userId: true || '',
        },
      }),
    ]);

    const groupedData = await AnalyticsController.groupByTimePeriod(
      'audit_logs',
      'createdAt',
      start,
      end,
      groupBy,
      (scopedQuery as any).where
    );

    return {
      totalActions,
      uniqueUsers: uniqueUsers.length,
      averageActionsPerUser:
        uniqueUsers.length > 0
          ? (totalActions / uniqueUsers.length).toFixed(2)
          : '0',
      groupedData,
    };
  }

  /**
   * Get performance metrics
   */
  private static async getSystemPerformanceMetricsHelper() {
    // This would typically integrate with monitoring systems
    // For now, we'll return mock data
    return {
      responseTime: {
        average: 150,
        p95: 300,
        p99: 500,
      },
      throughput: {
        requestsPerSecond: 100,
        peakRequestsPerSecond: 150,
      },
      errors: {
        rate: 0.5,
        total: 50,
      },
      uptime: {
        percentage: 99.9,
        lastDowntime: null,
      },
    };
  }

  /**
   * Group data by time period
   */
  private static async groupByTimePeriod(
    entity: string,
    dateField: string,
    _start: Date,
    _end: Date,
    _groupBy: string,
    baseWhere: any
  ) {
    const model = (prisma as any)[entity];
    if (!model) return [];

    // GroupBy format mapping (unused but kept for future reference)
    // const groupByFormat = {
    //   day: '%Y-%m-%d',
    //   week: '%Y-%u',
    //   month: '%Y-%m',
    // }[groupBy];

    const results = await model.groupBy({
      by: [dateField],
      where: {
        ...baseWhere,
        [dateField]: {
          gte: _start,
          lte: _end,
        },
      },
      _count: {
        id: true,
      } as any,
      orderBy: {
        [dateField]: 'asc',
      },
    });

    return results.map((result: any) => ({
      date: result[dateField],
      count: result?._count?.id || 0,
    }));
  }

  /**
   * Execute custom query with data scope
   */
  private static async executeCustomQuery(
    entity: string,
    metrics: string[],
    filters: any,
    groupBy: string[],
    user: AuthenticatedUser
  ) {
    const model = (prisma as any)[entity];
    if (!model) return [];

    const baseQuery = {
      where: filters || {},
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      baseQuery,
      user?.id,
      entity,
      entity
    );

    if (groupBy && groupBy.length > 0) {
      return await model.groupBy({
        by: groupBy,
        where: (scopedQuery as any).where,
        _count: {
          id: true,
        } as any,
      });
    } else {
      return await model.findMany({
        where: (scopedQuery as any).where,
        select: metrics.reduce(
          (acc, metric) => ({ ...acc, [metric]: true }),
          {}
        ),
      });
    }
  }

  /**
   * Export entity data with scope filtering
   */
  private static async exportEntityData(
    entity: string,
    format: string,
    filters: any,
    _user: AuthenticatedUser
  ) {
    const model = (prisma as any)[entity];
    if (!model) return [];

    const baseQuery = {
      where: filters || {},
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      baseQuery,
      _user?.id,
      entity,
      entity
    );

    const data = await model.findMany(scopedQuery);

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(data[0] || {});
      const csvRows = [headers.join(',')];

      data.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      });

      return csvRows.join('\n');
    }

    return data;
  }

  /**
   * Calculate trends with tenant scope
   */
  private static async calculateTrends(
    entity: string | undefined,
    _start: Date,
    _end: Date,
    _groupBy: string,
    _user: AuthenticatedUser
  ) {
    const entities = entity
      ? [entity]
      : ['users', 'support_tickets', 'audit_logs'];
    const trends: any = {};

    for (const ent of entities) {
      const baseQuery = {
        where: {
          createdAt: {
            gte: _start,
            lte: _end,
          },
        },
      };

      const scopedQuery = await dataScopeService.applyDataScopeFilter(
        baseQuery,
        _user?.id,
        ent,
        ent
      );

      const groupedData = await AnalyticsController.groupByTimePeriod(
        ent,
        'createdAt',
        _start,
        _end,
        _groupBy,
        (scopedQuery as any).where
      );

      // Calculate trend direction
      if (groupedData.length >= 2) {
        const first = groupedData[0].count;
        const last = groupedData[groupedData.length - 1].count;
        const trend = last > first ? 'up' : last < first ? 'down' : 'stable';
        const percentage =
          first > 0 ? (((last - first) / first) * 100).toFixed(2) : '0';

        trends[ent] = {
          data: groupedData,
          trend,
          percentage,
        };
      }
    }

    return trends;
  }

  /**
   * Save scheduled report
   */
  private static async saveScheduledReport(
    name: string,
    description: string,
    schedule: any,
    user: AuthenticatedUser
  ) {
    // Log the scheduled report creation
    await prisma?.auditLog?.create({
      data: {
        userId: user?.id,
        tenantId: user?.tenantId,
        action: 'CREATE_SCHEDULED_REPORT',
        details: {
          reportName: name,
          description,
          schedule,
        },
      },
    });
  }
}

// Export middleware-wrapped methods
export const getDashboardMetrics = [
  permissionGuard({ moduleKey: 'analytics', action: 'read' }),
  AnalyticsController.getDashboardMetrics,
];

export const getUserAnalytics = [
  permissionGuard({ moduleKey: 'analytics', action: 'read' }),
  AnalyticsController.getUserAnalytics,
];

export const getSystemPerformanceMetrics = [
  permissionGuard({ moduleKey: 'analytics', action: 'read' }),
  AnalyticsController.getSystemPerformanceMetrics,
];

export const generateCustomReport = [
  permissionGuard({ moduleKey: 'analytics', action: 'create' }),
  AnalyticsController.generateCustomReport,
];

export const exportAnalyticsData = [
  permissionGuard({ moduleKey: 'analytics', action: 'read' }),
  AnalyticsController.exportAnalyticsData,
];

export const getTrendAnalysis = [
  permissionGuard({ moduleKey: 'analytics', action: 'read' }),
  AnalyticsController.getTrendAnalysis,
];
