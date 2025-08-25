import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    console.log('🔍 Enhanced Analytics API Debug:', {
      tenantSlug,
      userId,
      tenantId
    });

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

    // Check permissions
    let hasUserPermission = false;
    let hasRolePermission = false;
    let hasAuditPermission = false;
    let hasAnalyticsPermission = false;

    if (req.user!.userRoles && req.user!.userRoles.length > 0) {
      for (const userRole of req.user!.userRoles) {
        const role = userRole?.role;
        if (role && role.permissions && role.permissions.length > 0) {
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
            if (permission.moduleKey === 'analytics' && permission.canRead) {
              hasAnalyticsPermission = true;
            }
          }
        }
      }
    }

    // Get tenant
    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug },
      select: { id: true, name: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    const actualTenantId = tenant.id;

    // Generate enhanced analytics data
    const analyticsData = {
      // Chart 1: User Growth & Activity (Area Chart)
      userGrowth: hasUserPermission ? await generateUserGrowthData(actualTenantId, startDate, now) : [],
      
      // Chart 2: Role Distribution (Donut Chart)
      roleDistribution: hasRolePermission ? await generateRoleDistributionData(actualTenantId) : [],
      
      // Chart 3: System Performance (Multi-line Chart)
      systemPerformance: hasAnalyticsPermission ? await generateSystemPerformanceData(startDate, now) : [],
      
      // Chart 4: Security Events (Stacked Bar Chart)
      securityEvents: hasAuditPermission ? await generateSecurityEventsData(actualTenantId, startDate, now) : []
    };

    return createSuccessResponse(analyticsData, 'Enhanced analytics data retrieved successfully');

  } catch (error: any) {
    console.error('Enhanced Analytics API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});

// Helper function to generate user growth data
async function generateUserGrowthData(tenantId: string, startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Get actual user counts for this date
    const totalUsers = await prisma.user.count({
      where: {
        tenantId,
        createdAt: { lte: date }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        lastLogin: { gte: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    const newUsers = await prisma.user.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          lte: date
        }
      }
    });

    data.push({
      date: date.toISOString(),
      count: totalUsers,
      active: activeUsers,
      new: newUsers
    });
  }

  return data;
}

// Helper function to generate role distribution data
async function generateRoleDistributionData(tenantId: string) {
  const roles = await prisma.role.findMany({
    where: {
      tenantId,
      isGlobal: false
    },
    include: {
      _count: {
        select: {
          userRoles: true
        }
      }
    }
  });

  return roles.map(role => ({
    role: role.name,
    count: role._count.userRoles
  }));
}

// Helper function to generate system performance data
async function generateSystemPerformanceData(startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate realistic system performance data
    const responseTime = 50 + Math.random() * 100; // 50-150ms
    const uptime = 95 + Math.random() * 5; // 95-100%
    const errors = Math.floor(Math.random() * 10); // 0-9 errors

    data.push({
      date: date.toISOString(),
      responseTime: Math.round(responseTime),
      uptime: Math.round(uptime * 100) / 100,
      errors
    });
  }

  return data;
}

// Helper function to generate security events data
async function generateSecurityEventsData(tenantId: string, startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Get actual audit events for this date
    const failedLogins = await prisma.auditLog.count({
      where: {
        tenantId,
        action: { contains: 'login_failed' },
        createdAt: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          lte: date
        }
      }
    });

    const suspiciousActivity = await prisma.auditLog.count({
      where: {
        tenantId,
        action: { contains: 'suspicious' },
        createdAt: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          lte: date
        }
      }
    });

    const blockedAttempts = await prisma.auditLog.count({
      where: {
        tenantId,
        action: { contains: 'blocked' },
        createdAt: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          lte: date
        }
      }
    });

    data.push({
      date: date.toISOString(),
      failedLogins,
      suspiciousActivity,
      blockedAttempts
    });
  }

  return data;
}
