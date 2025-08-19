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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all'; // all, audit, user, system
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Check permissions
    const hasAuditPermission = await checkTenantPermission(req.user!, tenantId, 'audit.view');
    const hasUserPermission = await checkTenantPermission(req.user!, tenantId, 'users.view');
    const hasSystemPermission = await checkTenantPermission(req.user!, tenantId, 'system.view');

    const activities = [];

    // Fetch audit activities if user has permission
    if (hasAuditPermission && (type === 'all' || type === 'audit')) {
      const auditActivities = await prisma.auditLog.findMany({
        where: {
          tenantId: tenantId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
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

      activities.push(...auditActivities.map(activity => ({
        id: activity.id,
        type: 'audit',
        action: activity.action,
        description: activity.details || activity.action,
        timestamp: activity.createdAt.toISOString(),
        user: activity.user?.name || activity.user?.email || 'Unknown User',
        severity: activity.action.includes('error') ? 'error' : 
                 activity.action.includes('warning') ? 'warning' : 'info',
        metadata: {
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          resource: activity.resource
        }
      })));
    }

    // Fetch user activities if user has permission
    if (hasUserPermission && (type === 'all' || type === 'user')) {
      const userActivities = await prisma.user.findMany({
        where: {
          tenantId: tenantId,
          lastLogin: { gte: startDate }
        },
        orderBy: { lastLogin: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          lastLogin: true,
          isActive: true,
          createdAt: true
        }
      });

      activities.push(...userActivities.map(user => ({
        id: `user-${user.id}`,
        type: 'user',
        action: 'User Login',
        description: `${user.name || user.email} logged in`,
        timestamp: user.lastLogin!.toISOString(),
        user: user.name || user.email,
        severity: 'info',
        metadata: {
          isActive: user.isActive,
          accountCreated: user.createdAt.toISOString()
        }
      })));
    }

    // Fetch system activities if user has permission
    if (hasSystemPermission && (type === 'all' || type === 'system')) {
      // Get system-related audit logs
      const systemActivities = await prisma.auditLog.findMany({
        where: {
          tenantId: tenantId,
          createdAt: { gte: startDate },
          action: {
            in: ['system.startup', 'system.shutdown', 'backup.completed', 'backup.failed', 'maintenance.started', 'maintenance.completed']
          }
        },
        orderBy: { createdAt: 'desc' },
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

      activities.push(...systemActivities.map(activity => ({
        id: activity.id,
        type: 'system',
        action: activity.action,
        description: activity.details || activity.action,
        timestamp: activity.createdAt.toISOString(),
        user: activity.user?.name || activity.user?.email || 'System',
        severity: activity.action.includes('failed') ? 'error' : 
                 activity.action.includes('warning') ? 'warning' : 'info',
        metadata: {
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent
        }
      })));
    }

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    // Group activities by date for better organization
    const groupedActivities = sortedActivities.reduce((groups, activity) => {
      const date = new Date(activity.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {} as Record<string, typeof sortedActivities>);

    const response = {
      activities: sortedActivities,
      groupedActivities,
      summary: {
        total: sortedActivities.length,
        byType: {
          audit: sortedActivities.filter(a => a.type === 'audit').length,
          user: sortedActivities.filter(a => a.type === 'user').length,
          system: sortedActivities.filter(a => a.type === 'system').length
        },
        bySeverity: {
          error: sortedActivities.filter(a => a.severity === 'error').length,
          warning: sortedActivities.filter(a => a.severity === 'warning').length,
          info: sortedActivities.filter(a => a.severity === 'info').length
        }
      },
      permissions: {
        canViewAudit: hasAuditPermission,
        canViewUsers: hasUserPermission,
        canViewSystem: hasSystemPermission
      }
    };

    return createSuccessResponse(response, 'Recent activity data retrieved successfully');

  } catch (error: any) {
    console.error('Recent Activity API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});
