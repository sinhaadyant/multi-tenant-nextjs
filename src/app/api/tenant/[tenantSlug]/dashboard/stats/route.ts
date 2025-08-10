import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET /api/tenant/[tenantSlug]/dashboard/stats - Get dashboard statistics
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    // User is already authenticated and verified by middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Verify tenant slug matches user's tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        slug: tenantSlug,
        isActive: true
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found or inactive', 404);
    }

    // Get dashboard statistics
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      newUsersThisMonth,
      activeUsersChange,
      systemHealth
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: {
          tenantId: tenantId,
          isActive: true
        }
      }),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          tenantId: tenantId,
          isActive: true,
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      }),
      
      // Total roles
      prisma.role.count({
        where: {
          tenantId: tenantId,
          isActive: true
        }
      }),
      
      // New users this month
      prisma.user.count({
        where: {
          tenantId: tenantId,
          isActive: true,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // First day of current month
          }
        }
      }),
      
      // Active users change (placeholder - you can implement actual calculation)
      Promise.resolve(5), // Example: 5% increase
      
      // System health (placeholder - you can implement actual health check)
      Promise.resolve(98) // Example: 98% health
    ]);

    // Calculate inactive users
    const inactiveUsers = totalUsers - activeUsers;

    // Calculate percentages
    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const inactiveUsersPercentage = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      newUsers: newUsersThisMonth,
      activeUsersChange,
      systemHealth: `${systemHealth}%`,
      systemHealthChange: 2, // Example: 2% improvement
      activeUsersPercentage,
      inactiveUsersPercentage
    };

    return createSuccessResponse({
      stats
    }, 'Dashboard statistics retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return createErrorResponse('Failed to fetch dashboard statistics', 500);
  }
}); 