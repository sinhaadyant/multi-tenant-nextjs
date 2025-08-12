import { NextRequest, NextResponse } from 'next/server';
import { prisma, logPrismaMessage, ENABLE_PRISMA_LOGGING } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { requireSuperAdmin } from '@/middleware/auth';

// Dashboard data interface matching frontend expectations
interface DashboardData {
  summary: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalSuperAdmins: number;
    growthMetrics?: {
      tenantGrowth: number;
      userGrowth: number;
      revenueGrowth: number;
    };
  };
  charts: {
    userSignups: Array<{ date: string; count: number }>;
    tenantActivity: Array<{ date: string; count: number }>;
    roleDistribution: Array<{ role: string; count: number }>;
    tenantPlanDistribution: Array<{ plan: string; count: number }>;
  };
  systemHealth: {
    databaseConnections: number;
    activeSessions: number;
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
  recentActivity: {
    auditLogs: Array<{
      id: string;
      action: string;
      createdAt: string;
      tenant?: { name: string; slug: string } | null;
      user?: { email: string; name: string } | null;
      superAdmin?: { email: string; name: string } | null;
    }>;
  };
  topTenants: Array<{
    id: string;
    name: string;
    slug: string;
    userCount: number;
    plan: string;
  }>;
}

// Dashboard handler
const dashboardHandler = async (req: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Only log if the global constant is enabled
    if (ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', 'Dashboard API request started', {
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    }

    // Authenticate request
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Only log if the global constant is enabled
    if (ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', 'Fetching dashboard data', { range });
    }

    // Get dashboard data with caching
    const dashboardData: DashboardData = await getDashboardData(range);

    const duration = Date.now() - startTime;
    
    // Only log if the global constant is enabled
    if (ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', 'Dashboard API request completed', {
        duration: `${duration}ms`,
        dataSize: JSON.stringify(dashboardData).length,
        summary: {
          totalTenants: dashboardData.summary.totalTenants,
          totalUsers: dashboardData.summary.totalUsers,
          recentActivity: dashboardData.recentActivity.auditLogs.length,
          topTenants: dashboardData.topTenants.length,
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      performance: {
        duration: `${duration}ms`,
        queries: ENABLE_PRISMA_LOGGING ? 'logged in console' : 'logging disabled',
      },
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Only log if the global constant is enabled
    if (ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('error', 'Dashboard API request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        performance: {
          duration: `${duration}ms`,
        },
      },
      { status: 500 }
    );
  }
};

// Get dashboard data with database queries
async function getDashboardData(range: string): Promise<DashboardData> {
  const queryStartTime = Date.now();
  
  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  switch (range) {
    case '1d':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  // Only log if the global constant is enabled
  if (ENABLE_PRISMA_LOGGING) {
    logPrismaMessage('info', 'Starting parallel database queries', {
      range,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  }

  // Helper function to generate date series
  const generateDateSeries = (start: Date, end: Date, interval: 'hour' | 'day' | 'week' | 'month') => {
    const dates: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      
      switch (interval) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return dates;
  };

  // Determine interval based on range
  const getInterval = (range: string): 'hour' | 'day' | 'week' | 'month' => {
    switch (range) {
      case '1d': return 'hour';
      case '7d': return 'day';
      case '30d': return 'day';
      case '90d': return 'week';
      default: return 'day';
    }
  };

  const interval = getInterval(range);
  const dateSeries = generateDateSeries(startDate, now, interval);

  // Parallel database queries for better performance
  const [
    tenantStats,
    userStats,
    superAdminStats,
    recentActivity,
    topTenants,
    roleDistribution,
    planDistribution,
    userSignups,
    tenantActivity,
  ] = await Promise.all([
    // Tenant statistics
    prisma.tenant.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    }),

    // User statistics
    prisma.user.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    }),

    // SuperAdmin statistics
    prisma.superAdmin.count({
      where: {
        isActive: true,
      },
    }),

    // Recent activity (last 10 audit logs)
    prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
        superAdmin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),

    // Top tenants by user count
    prisma.tenant.findMany({
      take: 5,
      orderBy: {
        users: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    }),

    // Role distribution
    prisma.role.groupBy({
      by: ['name'],
      _count: {
        id: true,
      },
    }),

    // Plan distribution
    prisma.tenant.groupBy({
      by: ['plan'],
      _count: {
        id: true,
      },
    }),

    // User signups over time - get all data for the range
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),

    // Tenant activity over time - get all data for the range
    prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),
  ]);

  const queryDuration = Date.now() - queryStartTime;

  // Only log if the global constant is enabled
  if (ENABLE_PRISMA_LOGGING) {
    logPrismaMessage('info', 'Database queries completed', {
      duration: `${queryDuration}ms`,
      results: {
        tenantStats: tenantStats.length,
        userStats: userStats.length,
        superAdminCount: superAdminStats,
        recentActivity: recentActivity.length,
        topTenants: topTenants.length,
        roleDistribution: roleDistribution.length,
        planDistribution: planDistribution.length,
        userSignups: userSignups.length,
        tenantActivity: tenantActivity.length,
      },
    });
  }

  // Calculate statistics
  const totalTenants = tenantStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
  const activeTenants = tenantStats.find(stat => stat.isActive)?._count?.id || 0;
  
  const totalUsers = userStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
  const activeUsers = userStats.find(stat => stat.isActive)?._count?.id || 0;

  // Mock growth metrics (replace with actual calculations)
  const growthMetrics = {
    tenantGrowth: 12.5,
    userGrowth: 15.2,
    revenueGrowth: 8.7,
  };

  // Mock system health data (replace with actual system monitoring)
  const systemHealth = {
    databaseConnections: Math.floor(Math.random() * 50) + 20,
    activeSessions: Math.floor(Math.random() * 100) + 50,
    cpuUsage: Math.random() * 30 + 20, // 20-50%
    memoryUsage: Math.random() * 40 + 30, // 30-70%
    uptime: 99.9, // Mock uptime
  };

  // Helper function to aggregate data by date intervals
  const aggregateDataByInterval = (
    data: Array<{ createdAt: Date }>,
    dateSeries: Date[],
    interval: 'hour' | 'day' | 'week' | 'month'
  ) => {
    const aggregated = dateSeries.map(date => {
      let nextDate = new Date(date);
      
      // Calculate the next interval
      switch (interval) {
        case 'hour':
          nextDate.setHours(nextDate.getHours() + 1);
          break;
        case 'day':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'week':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'month':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }

      // Count items in this interval
      const count = data.filter(item => 
        item.createdAt >= date && item.createdAt < nextDate
      ).length;

      return {
        date: date.toISOString(),
        count,
      };
    });

    return aggregated;
  };

  // Format user signups data with proper aggregation
  const formattedUserSignups = aggregateDataByInterval(userSignups, dateSeries, interval);

  // Format tenant activity data with proper aggregation
  const formattedTenantActivity = aggregateDataByInterval(tenantActivity, dateSeries, interval);

  // Format role distribution
  const formattedRoleDistribution = roleDistribution.map(item => ({
    role: item.name,
    count: item._count.id,
  }));

  // Format plan distribution
  const formattedPlanDistribution = planDistribution.map(item => ({
    plan: item.plan,
    count: item._count.id,
  }));

  const result = {
    summary: {
      totalTenants,
      activeTenants,
      totalUsers,
      totalSuperAdmins: superAdminStats,
      growthMetrics,
    },
    charts: {
      userSignups: formattedUserSignups,
      tenantActivity: formattedTenantActivity,
      roleDistribution: formattedRoleDistribution,
      tenantPlanDistribution: formattedPlanDistribution,
    },
    systemHealth,
    recentActivity: {
      auditLogs: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        createdAt: log.createdAt.toISOString(),
        tenant: log.tenant ? {
          name: log.tenant.name,
          slug: log.tenant.slug,
        } : null,
        user: log.user ? {
          email: log.user.email,
          name: log.user.name,
        } : null,
        superAdmin: log.superAdmin ? {
          email: log.superAdmin.email,
          name: log.superAdmin.name,
        } : null,
      })),
    },
    topTenants: topTenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      userCount: tenant._count.users,
      plan: tenant.plan,
    })),
  };

  // Only log if the global constant is enabled
  if (ENABLE_PRISMA_LOGGING) {
    logPrismaMessage('info', 'Dashboard data processing completed', {
      totalDuration: `${Date.now() - queryStartTime}ms`,
      dataSummary: {
        totalTenants,
        activeTenants,
        totalUsers,
        superAdmins: superAdminStats,
        recentActivities: recentActivity.length,
        topTenants: topTenants.length,
      },
    });
  }

  return result;
}

// Export the handler
export const GET = dashboardHandler;

// POST method for additional dashboard operations
export const POST = async (req: NextRequest) => {
  try {
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { action } = await req.json();

    if (action === 'refresh') {
      // Refresh dashboard data
      const dashboardData = await getDashboardData('7d');
      return NextResponse.json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data refreshed successfully',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Dashboard POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
}; 