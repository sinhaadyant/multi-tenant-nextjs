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
      select: { 
        id: true, 
        name: true, 
        slug: true, 
        plan: true, 
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
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

    // Get dashboard statistics
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalActivities,
      recentActivities,
      userActivityData,
      systemHealth
    ] = await Promise.all([
      // Total users in tenant
      prisma.user.count({
        where: { tenantId: tenant.id }
      }),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          tenantId: tenant.id,
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total roles in tenant
      prisma.role.count({
        where: { tenantId: tenant.id }
      }),
      
      // Total audit activities in last 30 days
      prisma.auditLog.count({
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent activities (last 10)
      prisma.auditLog.findMany({
        where: {
          tenantId: tenant.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      
      // User activity data for charts (last 7 days)
      prisma.auditLog.groupBy({
        by: ['createdAt'],
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        }
      }),
      
      // System health data
      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        }
      })
    ]);

    // Calculate system health score
    const errorCount = systemHealth.find(h => h.action.includes('error'))?._count.id || 0;
    const totalActions = systemHealth.reduce((sum, h) => sum + h._count.id, 0);
    const healthScore = totalActions > 0 ? Math.max(0, 100 - (errorCount / totalActions) * 100) : 100;
    const healthStatus = healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Poor';

    // Process user activity data for charts
    const chartData = userActivityData.reduce((acc, item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, activities: 0 };
      }
      acc[date].activities += item._count.id;
      return acc;
    }, {} as Record<string, { date: string; activities: number }>);

    const userActivityChart = Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date));

    // Create dashboard data
    const dashboardData = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        isActive: tenant.isActive
      },
      summary: {
        totalUsers,
        activeUsers,
        totalActivities,
        totalRoles,
        systemHealth: healthStatus,
        newUsers: 0, // TODO: Calculate new users in last period
        activeUsersChange: 0, // TODO: Calculate change from previous period
        systemHealthChange: 0 // TODO: Calculate change from previous period
      },
      charts: {
        userActivity: userActivityChart,
        systemUsage: [
          { date: new Date().toISOString().split('T')[0], cpu: 45, memory: 60, storage: 30 }
        ] // TODO: Implement real system metrics
      },
      recentActivity: recentActivities.map(log => ({
        id: log.id,
        description: log.description,
        timestamp: log.createdAt,
        type: log.action,
        userId: log.userId,
        userName: log.user?.name || 'Unknown User'
      })),
      systemHealth: {
        uptime: 99.9, // TODO: Calculate real uptime
        activeSessions: activeUsers,
        cpuUsage: 45, // TODO: Get real CPU usage
        memoryUsage: 60 // TODO: Get real memory usage
      }
    };

    // Create audit log for dashboard access
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'dashboard.view',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      }
    );

    return createSuccessResponse(dashboardData, 'Dashboard data fetched successfully');

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'Dashboard POST endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
