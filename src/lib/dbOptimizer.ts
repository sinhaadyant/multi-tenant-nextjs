import { prisma } from './prisma';

export class DBOptimizer {
  /**
   * Batch multiple count queries for better performance
   */
  static async batchCounts(queries: Array<{ key: string; query: any }>) {
    const results = await Promise.all(
      queries.map(async ({ key, query }) => {
        const result = await prisma.$queryRaw`${query}` as any[];
        return { key, count: result[0]?.count || 0 };
      })
    );

    return results.reduce((acc, { key, count }) => {
      acc[key] = count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Optimized pagination with cursor-based pagination for large datasets
   */
  static async paginateWithCursor<T>(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      take: number;
      cursor?: any;
      include?: any;
      select?: any;
    }
  ): Promise<{
    data: T[];
    nextCursor?: any;
    hasMore: boolean;
  }> {
    const { where, orderBy, take, cursor, include, select } = options;

    const queryOptions: any = {
      where,
      take: take + 1, // Take one extra to check if there are more
      ...(include && { include }),
      ...(select && { select }),
    };

    if (cursor) {
      queryOptions.cursor = cursor;
    }

    if (orderBy) {
      queryOptions.orderBy = orderBy;
    }

    const results = await model.findMany(queryOptions);
    const hasMore = results.length > take;
    const data = hasMore ? results.slice(0, take) : results;
    const nextCursor = hasMore ? results[take - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Optimized bulk operations
   */
  static async bulkUpsert<T>(
    model: any,
    data: Array<{ where: any; update: any; create: any }>,
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => model.upsert(item))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Optimized search with full-text search capabilities
   */
  static async optimizedSearch(
    model: any,
    searchTerm: string,
    searchFields: string[],
    options: {
      where?: any;
      take?: number;
      skip?: number;
      orderBy?: any;
      include?: any;
    } = {}
  ) {
    const { where = {}, take = 10, skip = 0, orderBy, include } = options;

    // Build search conditions
    const searchConditions = searchFields.map(field => ({
      [field]: { contains: searchTerm, mode: 'insensitive' as const }
    }));

    const finalWhere = {
      ...where,
      OR: searchConditions,
    };

    return await model.findMany({
      where: finalWhere,
      take,
      skip,
      orderBy,
      include,
    });
  }

  /**
   * Get optimized dashboard statistics with parallel queries
   */
  static async getDashboardStats(dateRange: { start: Date; end: Date }) {
    const [
      tenantStats,
      userStats,
      auditStats,
      roleStats
    ] = await Promise.all([
      // Tenant statistics
      prisma.tenant.groupBy({
        by: ['isActive', 'plan'],
        _count: { id: true },
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      
      // User statistics
      prisma.user.groupBy({
        by: ['isActive'],
        _count: { id: true },
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      
      // Audit log statistics
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { id: true },
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      
      // Role distribution
      prisma.role.findMany({
        include: {
          _count: { select: { users: true } }
        },
        where: { isActive: true }
      })
    ]);

    return {
      tenantStats,
      userStats,
      auditStats,
      roleStats
    };
  }

  /**
   * Optimized time-series data aggregation
   */
  static async getTimeSeriesData(
    model: any,
    dateField: string,
    dateRange: { start: Date; end: Date },
    groupBy: 'day' | 'week' | 'month' = 'day',
    where?: any
  ) {
    const data = await model.groupBy({
      by: [dateField],
      _count: { id: true },
      where: {
        [dateField]: { gte: dateRange.start, lte: dateRange.end },
        ...where
      },
      orderBy: { [dateField]: 'asc' }
    });

    // Fill missing dates with zero counts
    const result = [];
    const currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = data.find((d: any) => 
        new Date(d[dateField]).toISOString().split('T')[0] === dateStr
      );
      
      result.push({
        date: dateStr,
        count: existingData?._count.id || 0
      });

      // Increment date based on groupBy
      switch (groupBy) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return result;
  }

  /**
   * Optimized batch operations for multiple models
   */
  static async batchOperations(operations: Array<() => Promise<any>>) {
    return await Promise.all(operations);
  }

  /**
   * Optimized select queries with minimal data fetching
   */
  static async optimizedSelect<T>(
    model: any,
    select: any,
    where?: any,
    orderBy?: any,
    take?: number,
    skip?: number
  ): Promise<T[]> {
    return await model.findMany({
      select,
      where,
      orderBy,
      take,
      skip,
    });
  }
} 