import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Parse query parameters
    const endpoint = searchParams.get('endpoint') || 'summary';
    const dateRange = searchParams.get('dateRange');
    const category = searchParams.get('category') || '';
    const period = searchParams.get('period') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Parse date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        startDate = new Date(range.start);
        endDate = new Date(range.end);
      } catch (error) {
        // If dateRange is not valid JSON, try to parse as individual parameters
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        if (start) startDate = new Date(start);
        if (end) endDate = new Date(end);
      }
    }

    // Default to last 30 days if no date range provided
    if (!startDate || !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    let data: any = {};

    switch (endpoint) {
      case 'summary':
        data = await getAnalyticsSummary(tenant.id, startDate, endDate);
        break;
      case 'user-activity':
        data = await getUserActivity(tenant.id, startDate, endDate, period);
        break;
      case 'role-distribution':
        data = await getRoleDistribution(tenant.id);
        break;
      case 'module-usage':
        data = await getModuleUsage(tenant.id, startDate, endDate);
        break;
      case 'system-metrics':
        const systemMetricsData = await getSystemMetrics(tenant.id, startDate, endDate, period);
        data = await Promise.all(systemMetricsData);
        break;
      case 'user-growth':
        const userGrowthData = await getUserGrowth(tenant.id, startDate, endDate, period);
        data = await Promise.all(userGrowthData);
        break;
      case 'audit-logs':
        const auditLogsData = await getAuditLogs(tenant.id, startDate, endDate, period);
        data = await Promise.all(auditLogsData);
        break;
      case 'performance':
        data = await getPerformanceMetrics(tenant.id, startDate, endDate, period);
        break;
      case 'realtime':
        data = await getRealTimeAnalytics(tenant.id);
        break;
      default:
        return createErrorResponse('Invalid analytics endpoint', 400);
    }

    // Create audit log
    await createAuditLogFromRequest(req, { ...user, role: 'user', tenantId: user.tenantId || undefined }, 'ANALYTICS_VIEWED', {
      endpoint,
      filters: { dateRange, category, period }
    });

    return createSuccessResponse(data, 'Analytics data retrieved successfully');
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}

// Analytics data functions
async function getAnalyticsSummary(tenantId: string, startDate: Date, endDate: Date) {
  const [
    totalUsers,
    activeUsers,
    totalActivities,
    systemHealth,
    averageResponseTime,
    errorRate,
    storageUsed,
    storageTotal
  ] = await Promise.all([
    // Total users
    prisma.user.count({
      where: { tenantId, isActive: true }
    }),
    // Active users (users with activity in last 7 days)
    prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        lastLogin: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    // Total activities
    prisma.auditLog.count({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    // System health (mock data for now)
    Promise.resolve(95),
    // Average response time (mock data)
    Promise.resolve(150),
    // Error rate (mock data)
    Promise.resolve(0.5),
    // Storage used (mock data)
    Promise.resolve(2.5),
    // Storage total (mock data)
    Promise.resolve(10)
  ]);

  return {
    totalUsers,
    activeUsers,
    totalActivities,
    systemHealth,
    averageResponseTime,
    errorRate,
    storageUsed,
    storageTotal
  };
}

async function getUserActivity(tenantId: string, startDate: Date, endDate: Date, period: string) {
  // Generate date intervals based on period
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  const activities = await Promise.all(
    intervals.map(async (interval) => {
      const [users, activities, sessions] = await Promise.all([
        // Unique users
        prisma.user.count({
          where: {
            tenantId,
            isActive: true,
            lastLogin: {
              gte: interval.start,
              lte: interval.end
            }
          }
        }),
        // Total activities
        prisma.auditLog.count({
          where: {
            tenantId,
            createdAt: {
              gte: interval.start,
              lte: interval.end
            }
          }
        }),
        // Sessions (mock data)
        Promise.resolve(Math.floor(Math.random() * 50) + 10)
      ]);

      return {
        date: interval.start.toISOString(),
        users,
        activities,
        sessions
      };
    })
  );

  return activities;
}

async function getRoleDistribution(tenantId: string) {
  const roles = await prisma.role.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { userRoles: true }
      }
    }
  });

  const totalUsers = roles.reduce((sum, role) => sum + role._count.userRoles, 0);

  return roles.map(role => ({
    role: role.name,
    count: role._count.userRoles,
    percentage: totalUsers > 0 ? (role._count.userRoles / totalUsers) * 100 : 0
  }));
}

async function getModuleUsage(tenantId: string, startDate: Date, endDate: Date) {
  // Get module usage from audit logs using resourceType
  const moduleUsage = await prisma.auditLog.groupBy({
    by: ['resourceType'],
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      resourceType: { not: null }
    },
    _count: {
      id: true
    }
  });

  // Get unique users per module
  const uniqueUsersPerModule = await prisma.auditLog.groupBy({
    by: ['resourceType'],
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      resourceType: { not: null }
    },
    _count: {
      userId: true
    }
  });

  // Combine the data
  const moduleMap = new Map();
  
  moduleUsage.forEach(module => {
    if (module.resourceType) {
      moduleMap.set(module.resourceType, {
        module: module.resourceType,
        usage: module._count.id,
        users: 0
      });
    }
  });

  uniqueUsersPerModule.forEach(module => {
    if (module.resourceType && moduleMap.has(module.resourceType)) {
      moduleMap.get(module.resourceType).users = module._count.userId;
    }
  });

  return Array.from(moduleMap.values()).sort((a, b) => b.usage - a.usage);
}

async function getSystemMetrics(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(async interval => {
    // Calculate system metrics based on actual data
    const [totalActivities, errorActivities, uniqueUsers] = await Promise.all([
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: interval.start, lte: interval.end }
        }
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: interval.start, lte: interval.end },
          status: 'failure'
        }
      }),
      prisma.user.count({
        where: {
          tenantId,
          isActive: true,
          lastLogin: { gte: interval.start, lte: interval.end }
        }
      })
    ]);

    return {
      date: interval.start.toISOString(),
      activities: totalActivities,
      errors: errorActivities,
      users: uniqueUsers,
      responseTime: Math.floor(Math.random() * 200) + 100 // Mock response time for now
    };
  });
}

async function getUserGrowth(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(async interval => {
    // Get total users up to this interval
    const totalUsers = await prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: { lte: interval.end }
      }
    });

    // Get new users in this interval
    const newUsers = await prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: { gte: interval.start, lte: interval.end }
      }
    });

    // Get active users in this interval
    const activeUsers = await prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        lastLogin: { gte: interval.start, lte: interval.end }
      }
    });

    return {
      date: interval.start.toISOString(),
      count: totalUsers,
      newUsers,
      activeUsers
    };
  });
}

async function getAuditLogs(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(async interval => {
    // Get total audit logs in this interval
    const totalLogs = await prisma.auditLog.count({
      where: {
        tenantId,
        createdAt: { gte: interval.start, lte: interval.end }
      }
    });

    // Get unique users who performed actions in this interval
    const uniqueUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        createdAt: { gte: interval.start, lte: interval.end },
        userId: { not: null }
      }
    });

    // Get most common action in this interval
    const mostCommonAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        tenantId,
        createdAt: { gte: interval.start, lte: interval.end }
      },
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      },
      take: 1
    });

    return {
      date: interval.start.toISOString(),
      action: mostCommonAction[0]?.action || 'System Activity',
      count: totalLogs,
      users: uniqueUsers.length
    };
  });
}

async function getPerformanceMetrics(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(interval => ({
    date: interval.start.toISOString(),
    pageLoadTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
    apiResponseTime: Math.floor(Math.random() * 300) + 100, // 100-400ms
    errorRate: Math.random() * 2 // 0-2%
  }));
}

async function getRealTimeAnalytics(tenantId: string) {
  const [activeUsers, currentSessions, recentActivities] = await Promise.all([
    // Active users in last 5 minutes
    prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        lastLogin: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    }),
    // Current sessions (mock data)
    Promise.resolve(Math.floor(Math.random() * 20) + 5),
    // Recent activities
    prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  return {
    activeUsers,
    currentSessions,
    systemLoad: Math.floor(Math.random() * 30) + 20, // 20-50%
    recentActivities: recentActivities.map(activity => ({
      id: activity.id,
      action: activity.action,
      user: activity.user?.name || 'Unknown User',
      timestamp: activity.createdAt.toISOString()
    }))
  };
}

// Utility function to generate date intervals
function generateDateIntervals(startDate: Date, endDate: Date, period: string): Array<{ start: Date; end: Date }> {
  const intervals = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const intervalStart = new Date(current);
    let intervalEnd: Date;

    switch (period) {
      case 'daily':
        intervalEnd = new Date(current);
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        intervalEnd = new Date(current);
        intervalEnd.setDate(intervalEnd.getDate() + 7);
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        intervalEnd = new Date(current);
        intervalEnd.setMonth(intervalEnd.getMonth() + 1);
        current.setMonth(current.getMonth() + 1);
        break;
      case 'yearly':
        intervalEnd = new Date(current);
        intervalEnd.setFullYear(intervalEnd.getFullYear() + 1);
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        intervalEnd = new Date(current);
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        current.setDate(current.getDate() + 1);
    }

    intervals.push({ start: intervalStart, end: intervalEnd });
  }

  return intervals;
}
