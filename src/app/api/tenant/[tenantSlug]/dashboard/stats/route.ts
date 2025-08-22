import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { checkTenantPermission } from '@/lib/permissions';

export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Get query parameters for date range
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    
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

    // Check permissions for different data types
    // Allow access if user has any permissions at all for dashboard access
    let hasAnyPermission = false;
    let hasUserPermission = false;
    let hasRolePermission = false;
    let hasAuditPermission = false;
    let hasReportPermission = false;
    let hasNotificationPermission = false;

    try {
      for (const userRole of req.user!.userRoles) {
        const role = userRole.role;
        if (role.permissions && role.permissions.length > 0) {
          hasAnyPermission = true;
          
          // Check specific permissions
          for (const permission of role.permissions) {
            if (permission.moduleKey === 'users' && permission.canRead) {
              hasUserPermission = true;
            }
            if (permission.moduleKey === 'roles' && permission.canRead) {
              hasRolePermission = true;
            }
            if (permission.moduleKey === 'audit' && permission.canRead) {
              hasAuditPermission = true;
            }
            if (permission.moduleKey === 'reports' && permission.canRead) {
              hasReportPermission = true;
            }
            if (permission.moduleKey === 'notifications' && permission.canRead) {
              hasNotificationPermission = true;
            }
          }
        }
      }
      
      // If user has any permission, allow basic dashboard access
      if (!hasAnyPermission) {
        hasUserPermission = true; // Allow basic user count
        hasRolePermission = true; // Allow basic role count
      }
    } catch (permissionError) {
      console.warn('Permission check error, using fallback permissions:', permissionError);
      // Fallback: allow basic access
      hasUserPermission = true;
      hasRolePermission = true;
      hasAnyPermission = true;
    }

    // Fetch data based on permissions
    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalRoles,
      totalAuditEvents,
      totalReports,
      totalNotifications,
      recentUserActivity,
      recentAuditActivity,
      systemHealth
    ] = await Promise.all([
      // User statistics - only if user has permission
      hasUserPermission ? prisma.user.count({
        where: { tenantId: tenantId }
      }) : null,
      
      hasUserPermission ? prisma.user.count({
        where: { 
          tenantId: tenantId,
          isActive: true
        }
      }) : null,
      
      hasUserPermission ? prisma.user.count({
        where: { 
          tenantId: tenantId,
          createdAt: { gte: startDate }
        }
      }) : null,
      
      // Role statistics - only if user has permission
      hasRolePermission ? prisma.role.count({
        where: { 
          tenantId: tenantId,
          isGlobal: false
        }
      }) : null,
      
      // Audit statistics - only if user has permission
      hasAuditPermission ? prisma.auditLog.count({
        where: { 
          tenantId: tenantId,
          createdAt: { gte: startDate }
        }
      }) : null,
      
      // Report statistics - only if user has permission
      hasReportPermission ? prisma.auditLog.count({
        where: { 
          tenantId: tenantId,
          action: { contains: 'report' },
          createdAt: { gte: startDate }
        }
      }) : null,
      
      // Notification statistics - only if user has permission
      hasNotificationPermission ? prisma.notification.count({
        where: { 
          tenant: { id: tenantId },
          createdAt: { gte: startDate }
        }
      }) : null,
      
      // Recent user activity - only if user has permission
      hasUserPermission ? prisma.user.findMany({
        where: { 
          tenantId: tenantId,
          lastLogin: { gte: startDate }
        },
        orderBy: { lastLogin: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          lastLogin: true,
          isActive: true
        }
      }) : [],
      
      // Recent audit activity - only if user has permission
      hasAuditPermission ? prisma.auditLog.findMany({
        where: { 
          tenantId: tenantId,
          createdAt: { gte: startDate }
        },
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
      }) : [],
      
      // System health check (mock for now, could be real system metrics)
      Promise.resolve({
        uptime: 99.8,
        activeSessions: Math.floor(Math.random() * 50) + 10,
        cpuUsage: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30,
        databaseConnections: Math.floor(Math.random() * 20) + 5
      })
    ]);

    // Calculate growth metrics
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const [previousUsers, previousAuditEvents] = await Promise.all([
      hasUserPermission ? prisma.user.count({
        where: { 
          tenantId: tenantId,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }) : 0,
      
      hasAuditPermission ? prisma.auditLog.count({
        where: { 
          tenantId: tenantId,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }) : 0
    ]);

    const userGrowth = previousUsers > 0 && newUsers !== null ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;
    const auditGrowth = previousAuditEvents > 0 && totalAuditEvents !== null ? ((totalAuditEvents - previousAuditEvents) / previousAuditEvents) * 100 : 0;

    // Format recent activities
    const formattedRecentActivity = recentAuditActivity.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.details || activity.action,
      timestamp: activity.createdAt.toISOString(),
      user: activity.user?.name || activity.user?.email || 'Unknown User',
      type: 'audit'
    }));

    // Add user login activities
    const userLoginActivities = recentUserActivity
      .filter(user => user.lastLogin)
      .map(user => ({
        id: `user-${user.id}`,
        action: 'User Login',
        description: `${user.name || user.email} logged in`,
        timestamp: user.lastLogin!.toISOString(),
        user: user.name || user.email,
        type: 'user'
      }));

    const allRecentActivity = [...formattedRecentActivity, ...userLoginActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const stats = {
      summary: {
        totalUsers: totalUsers !== null ? totalUsers : 0,
        activeUsers: activeUsers !== null ? activeUsers : 0,
        newUsers: newUsers !== null ? newUsers : 0,
        totalRoles: totalRoles !== null ? totalRoles : 0,
        totalAuditEvents: totalAuditEvents !== null ? totalAuditEvents : 0,
        totalReports: totalReports !== null ? totalReports : 0,
        totalNotifications: totalNotifications !== null ? totalNotifications : 0,
        userGrowth: Math.round(userGrowth * 100) / 100,
        auditGrowth: Math.round(auditGrowth * 100) / 100
      },
      systemHealth,
      recentActivity: allRecentActivity,
      permissions: {
        canViewUsers: hasUserPermission,
        canViewRoles: hasRolePermission,
        canViewAudit: hasAuditPermission,
        canViewReports: hasReportPermission,
        canViewNotifications: hasNotificationPermission
      }
    };

    return createSuccessResponse(stats, 'Dashboard stats retrieved successfully');

  } catch (error: any) {
    console.error('Dashboard Stats API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
