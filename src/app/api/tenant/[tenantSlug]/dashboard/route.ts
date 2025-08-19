import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    
    // User is already authenticated and verified by middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Get dashboard statistics
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalNotifications,
      recentActivities
    ] = await Promise.all([
      // Total users in tenant
      prisma.user.count({
        where: { tenantId: tenantId }
      }),
      
      // Active users in tenant
      prisma.user.count({
        where: { 
          tenantId: tenantId,
          isActive: true
        }
      }),
      
      // Total roles in tenant
      prisma.role.count({
        where: { 
          tenantId: tenantId,
          isGlobal: false
        }
      }),
      
      // Total notifications in tenant
      prisma.notification.count({
        where: { tenant: { id: tenantId } }
      }),
      
      // Recent activities (last 10)
      prisma.auditLog.findMany({
        where: { tenantId: tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    // Calculate system health (mock for now)
    const systemHealth = 98;

    // Format recent activities
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.action,
      description: activity.details || activity.action,
      timestamp: activity.createdAt.toISOString(),
      user: activity.user?.name || activity.user?.email || 'Unknown User'
    }));

    const stats = {
      totalUsers,
      activeUsers,
      totalRoles,
      totalContent: 0, // Mock data
      totalNotifications,
      systemHealth,
      recentActivity: recentActivities.length
    };

    return createSuccessResponse({
      stats,
      recentActivities: formattedActivities
    }, 'Dashboard data retrieved successfully');

  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});
