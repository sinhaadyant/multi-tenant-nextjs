import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface UserPermissions {
  userId: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  permissions: string[];
  isAdmin: boolean;
}

export interface ModuleDataFilterOptions {
  moduleKey: string;
  action: string;
  userIdField?: string;
  tenantIdField?: string;
  requireAdmin?: boolean;
}

/**
 * Middleware to filter module data based on user role permissions
 */
export async function filterModuleData(
  request: NextRequest,
  userPermissions: UserPermissions,
  options: ModuleDataFilterOptions
) {
  const { moduleKey, action, userIdField = 'userId', tenantIdField = 'tenantId', requireAdmin = false } = options;

  // Check if user has permission for this module and action
  const hasPermission = userPermissions.permissions.includes(`${moduleKey}:${action}`);
  
  if (!hasPermission) {
    return {
      success: false,
      message: 'Insufficient permissions',
      status: 403
    };
  }

  // If requireAdmin is true, check if user is admin
  if (requireAdmin && !userPermissions.isAdmin && !userPermissions.isSuperAdmin) {
    return {
      success: false,
      message: 'Admin access required',
      status: 403
    };
  }

  // Build where clause based on user permissions
  let whereClause: any = {};

  // SuperAdmin can see all data
  if (userPermissions.isSuperAdmin) {
    // No additional filtering needed
  }
  // Admin users can see all data for their tenant
  else if (userPermissions.isAdmin && userPermissions.tenantId) {
    whereClause[tenantIdField] = userPermissions.tenantId;
  }
  // Normal users can only see their own data
  else {
    whereClause[userIdField] = userPermissions.userId;
    if (userPermissions.tenantId) {
      whereClause[tenantIdField] = userPermissions.tenantId;
    }
  }

  return {
    success: true,
    whereClause,
    userPermissions
  };
}

/**
 * Get user permissions for a specific user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  // Get user with roles and permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
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

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is SuperAdmin
  const isSuperAdmin = user.tenantId === null;

  // Get all permissions from user's roles
  const permissions = new Set<string>();
  let isAdmin = false;

  for (const userRole of user.userRoles) {
    const role = userRole.role;
    
    // Check if role has admin-like permissions
    for (const rolePermission of role.rolePermissions) {
      const permission = rolePermission.permission;
      const permissionKey = `${permission.moduleKey}:${permission.action}`;
      permissions.add(permissionKey);

      // Check for admin permissions
      if (permission.action === 'admin' || permission.action === 'manage') {
        isAdmin = true;
      }
    }
  }

  return {
    userId: user.id,
    tenantId: user.tenantId,
    isSuperAdmin,
    permissions: Array.from(permissions),
    isAdmin
  };
}

/**
 * Dashboard data filter - returns appropriate data based on user role
 */
export async function filterDashboardData(
  request: NextRequest,
  userId: string,
  moduleKey: string
) {
  const userPermissions = await getUserPermissions(userId);
  
  const filterResult = await filterModuleData(request, userPermissions, {
    moduleKey,
    action: 'view',
    requireAdmin: false
  });

  if (!filterResult.success) {
    return filterResult;
  }

  // For dashboard data, we need to determine what statistics to return
  const { isSuperAdmin, isAdmin, tenantId } = userPermissions;

  let dashboardData: any = {};

  if (isSuperAdmin) {
    // SuperAdmin sees global statistics
    dashboardData = await getGlobalDashboardData();
  } else if (isAdmin && tenantId) {
    // Admin sees tenant-wide statistics
    dashboardData = await getTenantDashboardData(tenantId);
  } else {
    // Normal user sees personal statistics
    dashboardData = await getPersonalDashboardData(userId, tenantId);
  }

  return {
    success: true,
    data: dashboardData,
    userType: isSuperAdmin ? 'superadmin' : isAdmin ? 'admin' : 'user'
  };
}

/**
 * Support system data filter - returns appropriate tickets based on user role
 */
export async function filterSupportData(
  request: NextRequest,
  userId: string
) {
  const userPermissions = await getUserPermissions(userId);
  
  const filterResult = await filterModuleData(request, userPermissions, {
    moduleKey: 'support',
    action: 'view',
    userIdField: 'createdBy',
    tenantIdField: 'tenantId'
  });

  if (!filterResult.success) {
    return filterResult;
  }

  const { isSuperAdmin, isAdmin, tenantId } = userPermissions;

  let supportData: any = {};

  if (isSuperAdmin) {
    // SuperAdmin sees all tickets
    supportData = await prisma.supportTicket.findMany({
      include: {
        tenant: true,
        user: true
      }
    });
  } else if (isAdmin && tenantId) {
    // Admin sees all tickets for their tenant
    supportData = await prisma.supportTicket.findMany({
      where: { tenantId },
      include: {
        user: true
      }
    });
  } else {
    // Normal user sees only their own tickets
    supportData = await prisma.supportTicket.findMany({
      where: { 
        createdBy: userId,
        tenantId: tenantId || undefined
      }
    });
  }

  return {
    success: true,
    data: supportData,
    userType: isSuperAdmin ? 'superadmin' : isAdmin ? 'admin' : 'user'
  };
}

// Helper functions for dashboard data
async function getGlobalDashboardData() {
  const [totalTenants, totalUsers, totalTickets] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.supportTicket.count()
  ]);

  return {
    totalTenants,
    totalUsers,
    totalTickets,
    scope: 'global'
  };
}

async function getTenantDashboardData(tenantId: string) {
  const [totalUsers, totalTickets, activeUsers] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.supportTicket.count({ where: { tenantId } }),
    prisma.user.count({ 
      where: { 
        tenantId,
        lastLogin: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }
    })
  ]);

  return {
    totalUsers,
    totalTickets,
    activeUsers,
    scope: 'tenant'
  };
}

async function getPersonalDashboardData(userId: string, tenantId: string | null) {
  const [myTickets, recentActivity] = await Promise.all([
    prisma.supportTicket.count({ 
      where: { 
        createdBy: userId,
        tenantId: tenantId || undefined
      }
    }),
    prisma.auditLog.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    })
  ]);

  return {
    myTickets,
    recentActivity,
    scope: 'personal'
  };
}
