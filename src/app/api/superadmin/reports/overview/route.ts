import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse } from '@/lib/apiResponse';

// GET /api/superadmin/reports/overview - Get reports overview stats
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Fetching reports overview');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;

  try {
    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get reports statistics
    const [
      totalReports,
      reportsThisMonth,
      reportsByStatus,
      reportsByType,
      recentReports,
      totalUsers,
      activeTenants,
      totalNotifications,
      loginTrends,
      auditLogsCount
    ] = await Promise.all([
      // Total reports
      prisma.report.count({
        where: { generatedBy: superAdmin.id }
      }),
      
      // Reports this month
      prisma.report.count({
        where: {
          generatedBy: superAdmin.id,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Reports by status
      prisma.report.groupBy({
        by: ['status'],
        where: { generatedBy: superAdmin.id },
        _count: { status: true }
      }),
      
      // Reports by type
      prisma.report.groupBy({
        by: ['reportType'],
        where: { generatedBy: superAdmin.id },
        _count: { reportType: true }
      }),
      
      // Recent reports (last 5)
      prisma.report.findMany({
        where: { generatedBy: superAdmin.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          generatedBy: {
            select: { name: true, email: true }
          }
        }
      }),
      
      // Total users across all tenants
      prisma.user.count(),
      
      // Active tenants
      prisma.tenant.count({
        where: { isActive: true }
      }),
      
      // Total notifications
      prisma.notification.count(),
      
      // Login trends (last 7 days)
      prisma.auditLog.count({
        where: {
          action: 'login',
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      
      // Total audit logs
      prisma.auditLog.count()
    ]);

    // Process status counts
    const statusCounts = {
      generating: 0,
      ready: 0,
      failed: 0
    };
    
    reportsByStatus.forEach(item => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.status;
    });

    // Process type counts
    const typeCounts = {
      user_activity: 0,
      tenant_summary: 0,
      login_history: 0,
      audit_logs: 0,
      system_health: 0
    };
    
    reportsByType.forEach(item => {
      typeCounts[item.reportType as keyof typeof typeCounts] = item._count.reportType;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Reports overview fetched successfully');
    }

    return createSuccessResponse({
      overview: {
        totalReports,
        reportsThisMonth,
        statusCounts,
        typeCounts,
        recentReports
      },
      platformStats: {
        totalUsers,
        activeTenants,
        totalNotifications,
        loginTrends,
        auditLogsCount
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching reports overview:', error);
    }
    throw error;
  }
}); 