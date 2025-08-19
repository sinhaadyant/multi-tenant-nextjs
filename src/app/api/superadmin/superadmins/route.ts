import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/superadmins - List all superadmins
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Fetching superadmin list');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Authentication failed:', authResult.error);
      }
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // Add status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'lastLogin') {
      orderBy.lastLogin = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get superadmins with pagination
    const [superadmins, totalCount, activeCount, inactiveCount] = await Promise.all([
      prisma.superAdmin.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          contactNumber: true,
          avatar: true,
          _count: {
            select: {
              auditLogs: true,
              backups: true,
              notifications: true,
              reports: true
            }
          }
        }
      }),
      prisma.superAdmin.count({ where }),
      prisma.superAdmin.count({ where: { ...where, isActive: true } }),
      prisma.superAdmin.count({ where: { ...where, isActive: false } })
    ]);

    // Transform superadmins to match expected format
    const transformedSuperadmins = superadmins.map(superadmin => ({
      id: superadmin.id,
      name: superadmin.name,
      email: superadmin.email,
      isActive: superadmin.isActive,
      createdAt: superadmin.createdAt.toISOString(),
      updatedAt: superadmin.updatedAt.toISOString(),
      contactNumber: superadmin.contactNumber,
      avatar: superadmin.avatar,
      stats: {
        auditLogs: superadmin._count.auditLogs,
        backups: superadmin._count.backups,
        notifications: superadmin._count.notifications,
        reports: superadmin._count.reports
      }
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Superadmin list fetched successfully:', transformedSuperadmins.length);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      superadmins: transformedSuperadmins,
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords: totalCount
      }
    };

    return createSuccessResponse(responseData, 'Superadmin list fetched successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching superadmin list:', error);
    }
    throw error;
  }
});
