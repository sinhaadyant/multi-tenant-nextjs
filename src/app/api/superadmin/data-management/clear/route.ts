import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// POST /api/superadmin/data-management/clear - Clear data
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ Clearing data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for data management API');
    }
    return authResult;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SuperAdmin authenticated for data management API');
  }

  const { 
    clearTenants = false, 
    clearUsers = false, 
    clearAuditLogs = false,
    clearAll = false,
    preserveSystemData = true 
  } = await req.json();

  if (!clearTenants && !clearUsers && !clearAuditLogs && !clearAll) {
    return createErrorResponse(
      'At least one data type must be selected for clearing',
      400
    );
  }

  try {
    const results = {
      tenants: { deleted: 0, errors: 0 },
      users: { deleted: 0, errors: 0 },
      auditLogs: { deleted: 0, errors: 0 }
    };

    // Get counts before deletion for audit logging
    const countsBefore = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      auditLogs: await prisma.auditLog.count()
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Counts before deletion:', countsBefore);
    }

    // Clear all data if requested
    if (clearAll) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Clearing all data...');
      }

      // Clear in correct order due to foreign key constraints
      // 1. Clear audit logs first
      try {
        const auditLogsDeleted = await prisma.auditLog.deleteMany({});
        results.auditLogs.deleted = auditLogsDeleted.count;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Deleted ${auditLogsDeleted.count} audit logs`);
        }
      } catch (error) {
        results.auditLogs.errors++;
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error clearing audit logs:', error);
        }
      }

      // 2. Clear user roles
      try {
        const userRolesDeleted = await prisma.userRole.deleteMany({});
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Deleted ${userRolesDeleted.count} user roles`);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error clearing user roles:', error);
        }
      }

      // 3. Clear users
      try {
        const usersDeleted = await prisma.user.deleteMany({});
        results.users.deleted = usersDeleted.count;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Deleted ${usersDeleted.count} users`);
        }
      } catch (error) {
        results.users.errors++;
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error clearing users:', error);
        }
      }

      // 4. Clear tenants
      try {
        const tenantsDeleted = await prisma.tenant.deleteMany({});
        results.tenants.deleted = tenantsDeleted.count;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Deleted ${tenantsDeleted.count} tenants`);
        }
      } catch (error) {
        results.tenants.errors++;
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error clearing tenants:', error);
        }
      }
    } else {
      // Clear specific data types
      if (clearAuditLogs) {
        try {
          const auditLogsDeleted = await prisma.auditLog.deleteMany({});
          results.auditLogs.deleted = auditLogsDeleted.count;
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Deleted ${auditLogsDeleted.count} audit logs`);
          }
        } catch (error) {
          results.auditLogs.errors++;
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error clearing audit logs:', error);
          }
        }
      }

      if (clearUsers) {
        try {
          // Clear user roles first
          await prisma.userRole.deleteMany({});
          
          const usersDeleted = await prisma.user.deleteMany({});
          results.users.deleted = usersDeleted.count;
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Deleted ${usersDeleted.count} users`);
          }
        } catch (error) {
          results.users.errors++;
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error clearing users:', error);
          }
        }
      }

      if (clearTenants) {
        try {
          const tenantsDeleted = await prisma.tenant.deleteMany({});
          results.tenants.deleted = tenantsDeleted.count;
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Deleted ${tenantsDeleted.count} tenants`);
          }
        } catch (error) {
          results.tenants.errors++;
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error clearing tenants:', error);
          }
        }
      }
    }

    // Get counts after deletion
    const countsAfter = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      auditLogs: await prisma.auditLog.count()
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Counts after deletion:', countsAfter);
    }

    // Create audit log for the clearing operation
    await createAuditLogFromRequest(
      req,
      authResult,
      'data.cleared',
      {
        clearTenants,
        clearUsers,
        clearAuditLogs,
        clearAll,
        preserveSystemData,
        results,
        countsBefore,
        countsAfter
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Data clearing completed:', results);
    }

    return createSuccessResponse({
      results,
      summary: {
        totalTenantsDeleted: results.tenants.deleted,
        totalUsersDeleted: results.users.deleted,
        totalAuditLogsDeleted: results.auditLogs.deleted,
        totalErrors: results.tenants.errors + results.users.errors + results.auditLogs.errors,
        countsBefore,
        countsAfter
      }
    }, 'Data cleared successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error clearing data:', error);
    }
    throw error;
  }
});

// GET /api/superadmin/data-management/clear - Get data counts
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Getting data counts');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const [tenantsCount, usersCount, auditLogsCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.auditLog.count()
    ]);

    return createSuccessResponse({
      counts: {
        tenants: tenantsCount,
        users: usersCount,
        auditLogs: auditLogsCount
      }
    }, 'Data counts retrieved successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error getting data counts:', error);
    }
    throw error;
  }
});
