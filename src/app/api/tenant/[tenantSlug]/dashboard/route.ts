import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Fetching tenant dashboard data:', tenantSlug);
  }

  // Get query parameters
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Verify user belongs to this tenant
    if (decoded.tenantSlug !== tenantSlug) {
      return createErrorResponse('Access denied', 403);
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: tenantSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get user statistics
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count({
        where: { tenantId: tenant.id }
      }),
      prisma.user.count({
        where: { 
          tenantId: tenant.id,
          lastLogin: {
            gte: startDate
          }
        }
      })
    ]);

    // Get recent audit logs for activity
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: startDate
        }
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
    });

    // Get user permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const userPermissions = user?.userRoles.flatMap(userRole =>
      userRole.role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action
      }))
    ) || [];

    // Generate mock chart data (in a real app, this would come from analytics)
    const generateChartData = () => {
      const data = [];
      const days = range === '1d' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        data.push({
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 50) + 10,
          activities: Math.floor(Math.random() * 200) + 50,
          cpu: Math.floor(Math.random() * 30) + 20,
          memory: Math.floor(Math.random() * 40) + 30,
          storage: Math.floor(Math.random() * 20) + 60
        });
      }
      return data;
    };

    const chartData = generateChartData();

    // Prepare dashboard data
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
        totalActivities: recentAuditLogs.length,
        systemHealth: 'Healthy'
      },
      charts: {
        userActivity: chartData.map(d => ({
          date: d.date,
          users: d.users,
          activities: d.activities
        })),
        systemUsage: chartData.map(d => ({
          date: d.date,
          cpu: d.cpu,
          memory: d.memory,
          storage: d.storage
        }))
      },
      recentActivity: recentAuditLogs.map(log => ({
        id: log.id,
        type: log.action,
        description: log.details || log.action,
        timestamp: log.createdAt.toISOString(),
        user: log.user ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email
        } : undefined
      })),
      userPermissions,
      systemHealth: {
        uptime: 99.9,
        activeSessions: activeUsers,
        cpuUsage: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30
      }
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenant dashboard data fetched successfully');
    }

    return createSuccessResponse(dashboardData, 'Dashboard data retrieved successfully');

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching tenant dashboard:', error);
    }
    throw error;
  }
}); 