import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

// Dashboard data interface
interface DashboardData {
  stats: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    monthlyGrowth: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
  topTenants: Array<{
    id: string;
    name: string;
    userCount: number;
    isActive: boolean;
    revenue: number;
  }>;
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
}

// Dashboard handler
const dashboardHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Authenticate request
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get dashboard data with caching
    const dashboardData: DashboardData = await getDashboardData();

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
};

// Get dashboard data with database queries
async function getDashboardData(): Promise<DashboardData> {
  // Parallel database queries for better performance
  const [
    tenantStats,
    userStats,
    recentActivity,
    topTenants,
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
  ]);

  // Calculate statistics
  const totalTenants = tenantStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
  const activeTenants = tenantStats.find(stat => stat.isActive)?._count?.id || 0;
  
  const totalUsers = userStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
  const activeUsers = userStats.find(stat => stat.isActive)?._count?.id || 0;

  // Mock revenue data (replace with actual revenue calculation)
  const totalRevenue = activeTenants * 99.99; // Assuming $99.99 per tenant
  const monthlyGrowth = 12.5; // Mock growth percentage

  // Mock system health data (replace with actual system monitoring)
  const systemHealth = {
    cpu: Math.random() * 30 + 20, // 20-50%
    memory: Math.random() * 40 + 30, // 30-70%
    disk: Math.random() * 20 + 60, // 60-80%
    uptime: 99.9, // Mock uptime
  };

  return {
    stats: {
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalRevenue,
      monthlyGrowth,
    },
    recentActivity: recentActivity.map(log => ({
      id: log.id,
      type: log.action,
      description: String(log.details || log.action),
      timestamp: log.createdAt.toISOString(),
      user: log.user?.name || log.user?.email || 'Unknown',
    })),
    topTenants: topTenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      userCount: tenant._count.users,
      isActive: tenant.isActive,
      revenue: tenant._count.users * 9.99, // Mock revenue per user
    })),
    systemHealth,
  };
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
      const dashboardData = await getDashboardData();
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