import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || 'rss';
    
    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Get basic stats for the tenant
    const totalUsers = await prisma.user.count({
      where: { tenantId: tenant.id }
    });

    const activeUsers = await prisma.user.count({
      where: { 
        tenantId: tenant.id,
        isActive: true
      }
    });

    const totalRoles = await prisma.role.count({
      where: { 
        tenantId: tenant.id,
        isGlobal: false
      }
    });

    const totalAuditEvents = await prisma.auditLog.count({
      where: { tenantId: tenant.id }
    });

    // Get tenant modules
    const tenantModules = await prisma.tenantModule.findMany({
      where: {
        tenantId: tenant.id,
        isEnabled: true,
        isVisible: true
      },
      include: {
        module: true
      }
    });

    const stats = {
      summary: {
        totalUsers,
        activeUsers,
        newUsers: 0,
        totalRoles,
        totalAuditEvents,
        totalReports: 0,
        totalNotifications: 0,
        userGrowth: 0,
        auditGrowth: 0
      },
      systemHealth: {
        uptime: 99.8,
        activeSessions: Math.floor(Math.random() * 50) + 10,
        cpuUsage: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30,
        databaseConnections: Math.floor(Math.random() * 20) + 5
      },
      recentActivity: [],
      permissions: {
        canViewUsers: true,
        canViewRoles: true,
        canViewAudit: true,
        canViewReports: true,
        canViewNotifications: true
      },
      modules: tenantModules.map(tm => ({
        id: tm.module.id,
        name: tm.module.moduleName,
        key: tm.module.moduleKey,
        description: tm.module.description,
        icon: tm.module.icon,
        order: tm.module.orderIndex,
        isActive: tm.module.isActive,
        isEnabled: tm.isEnabled,
        isVisible: tm.isVisible
      }))
    };

    return NextResponse.json({
      success: true,
      message: 'Tenant dashboard data retrieved successfully',
      timestamp: new Date().toISOString(),
      data: stats
    });

  } catch (error: any) {
    console.error('Tenant dashboard test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Tenant dashboard data fetch failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
