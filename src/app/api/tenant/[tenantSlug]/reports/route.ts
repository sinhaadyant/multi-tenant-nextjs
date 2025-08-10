import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
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
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day';
    const limit = parseInt(searchParams.get('limit') || '30');

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(tenant.id, start, end);
        break;
      case 'user-activity':
        reportData = await generateUserActivityReport(tenant.id, start, end, groupBy, limit);
        break;
      case 'system-usage':
        reportData = await generateSystemUsageReport(tenant.id, start, end, groupBy);
        break;
      case 'security':
        reportData = await generateSecurityReport(tenant.id, start, end);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(tenant.id, start, end);
        break;
      default:
        return createErrorResponse('Invalid report type', 400);
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'reports.generate',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        reportType,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    );

    return createSuccessResponse(reportData, 'Report generated successfully');

  } catch (error: any) {
    console.error('Error generating report:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

// Helper functions to generate different types of reports
async function generateOverviewReport(tenantId: string, start: Date, end: Date) {
  const [
    totalUsers,
    activeUsers,
    newUsers,
    totalActivities,
    loginCount,
    errorCount,
    roleDistribution,
    moduleUsage
  ] = await Promise.all([
    // Total users
    prisma.user.count({
      where: { tenantId }
    }),
    
    // Active users (logged in within last 30 days)
    prisma.user.count({
      where: {
        tenantId,
        lastLogin: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // New users in date range
    prisma.user.count({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end }
      }
    }),
    
    // Total activities in date range
    prisma.auditLog.count({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end }
      }
    }),
    
    // Login count in date range
    prisma.auditLog.count({
      where: {
        tenantId,
        action: { contains: 'login' },
        createdAt: { gte: start, lte: end }
      }
    }),
    
    // Error count in date range
    prisma.auditLog.count({
      where: {
        tenantId,
        action: { contains: 'error' },
        createdAt: { gte: start, lte: end }
      }
    }),
    
    // Role distribution
    prisma.userRole.groupBy({
      by: ['roleId'],
      where: {
        user: { tenantId }
      },
      _count: {
        userId: true
      },
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    }),
    
    // Module usage
    prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        tenantId,
        createdAt: { gte: start, lte: end }
      },
      _count: {
        id: true
      }
    })
  ]);

  return {
    summary: {
      totalUsers,
      activeUsers,
      newUsers,
      totalActivities,
      loginCount,
      errorCount,
      successRate: totalActivities > 0 ? ((totalActivities - errorCount) / totalActivities * 100).toFixed(2) : 100
    },
    roleDistribution: roleDistribution.map(rd => ({
      roleName: rd.role.name,
      userCount: rd._count.userId
    })),
    moduleUsage: moduleUsage.map(mu => ({
      action: mu.action,
      count: mu._count.id
    }))
  };
}

async function generateUserActivityReport(tenantId: string, start: Date, end: Date, groupBy: string, limit: number) {
  const groupByClause = groupBy === 'hour' ? 'hour' : groupBy === 'week' ? 'week' : 'day';
  
  const activityData = await prisma.auditLog.groupBy({
    by: ['createdAt'],
    where: {
      tenantId,
      createdAt: { gte: start, lte: end }
    },
    _count: {
      id: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const userActivity = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      tenantId,
      createdAt: { gte: start, lte: end }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return {
    activityTrend: activityData.map(ad => ({
      date: ad.createdAt.toISOString(),
      count: ad._count.id
    })),
    topUsers: userActivity.map(ua => ({
      userId: ua.userId,
      userName: ua.user?.name || 'Unknown',
      userEmail: ua.user?.email || 'Unknown',
      activityCount: ua._count.id
    }))
  };
}

async function generateSystemUsageReport(tenantId: string, start: Date, end: Date, groupBy: string) {
  const usageData = await prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      tenantId,
      createdAt: { gte: start, lte: end }
    },
    _count: {
      id: true
    }
  });

  const dailyUsage = await prisma.auditLog.groupBy({
    by: ['createdAt'],
    where: {
      tenantId,
      createdAt: { gte: start, lte: end }
    },
    _count: {
      id: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return {
    moduleUsage: usageData.map(ud => ({
      module: ud.action,
      count: ud._count.id
    })),
    dailyTrend: dailyUsage.map(du => ({
      date: du.createdAt.toISOString(),
      count: du._count.id
    }))
  };
}

async function generateSecurityReport(tenantId: string, start: Date, end: Date) {
  const [
    failedLogins,
    suspiciousActivities,
    permissionChanges,
    userChanges
  ] = await Promise.all([
    // Failed login attempts
    prisma.auditLog.findMany({
      where: {
        tenantId,
        action: { contains: 'login.failed' },
        createdAt: { gte: start, lte: end }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }),
    
    // Suspicious activities
    prisma.auditLog.findMany({
      where: {
        tenantId,
        OR: [
          { action: { contains: 'permission' } },
          { action: { contains: 'role' } },
          { action: { contains: 'settings' } }
        ],
        createdAt: { gte: start, lte: end }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }),
    
    // Permission changes
    prisma.auditLog.count({
      where: {
        tenantId,
        action: { contains: 'permission' },
        createdAt: { gte: start, lte: end }
      }
    }),
    
    // User changes
    prisma.auditLog.count({
      where: {
        tenantId,
        OR: [
          { action: { contains: 'user.create' } },
          { action: { contains: 'user.update' } },
          { action: { contains: 'user.delete' } }
        ],
        createdAt: { gte: start, lte: end }
      }
    })
  ]);

  return {
    securityEvents: {
      failedLogins: failedLogins.length,
      suspiciousActivities: suspiciousActivities.length,
      permissionChanges,
      userChanges
    },
    failedLoginDetails: failedLogins.map(fl => ({
      id: fl.id,
      action: fl.action,
      ipAddress: fl.ipAddress,
      userAgent: fl.userAgent,
      createdAt: fl.createdAt.toISOString(),
      user: fl.user ? {
        email: fl.user.email,
        name: fl.user.name
      } : null
    })),
    suspiciousActivityDetails: suspiciousActivities.map(sa => ({
      id: sa.id,
      action: sa.action,
      description: sa.description,
      ipAddress: sa.ipAddress,
      createdAt: sa.createdAt.toISOString(),
      user: sa.user ? {
        email: sa.user.email,
        name: sa.user.name
      } : null
    }))
  };
}

async function generatePerformanceReport(tenantId: string, start: Date, end: Date) {
  const performanceData = await prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      tenantId,
      createdAt: { gte: start, lte: end }
    },
    _count: {
      id: true
    },
    _avg: {
      // Note: This would require adding a responseTime field to the audit log
      // For now, we'll use a placeholder
    }
  });

  return {
    performanceMetrics: {
      totalRequests: performanceData.reduce((sum, pd) => sum + pd._count.id, 0),
      averageResponseTime: 150, // Placeholder - would need to track this
      slowestOperations: performanceData
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 5)
        .map(pd => ({
          action: pd.action,
          count: pd._count.id
        }))
    }
  };
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { reportName, filters, schedule, recipients } = body;

    // Create scheduled report
    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        name: reportName,
        tenantSlug,
        filters: filters || {},
        schedule: schedule || 'weekly',
        recipients: recipients || [],
        isActive: true,
        createdBy: decoded.id
      }
    });

    return createSuccessResponse(scheduledReport, 'Scheduled report created successfully');

  } catch (error: any) {
    console.error('Error creating scheduled report:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
} 