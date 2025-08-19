import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/lib/errorHandler';

// GET /api/superadmin/notifications/recipients - Get available recipients
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Fetching notification recipients');
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
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // all, superadmins, tenants, users

    // Build search conditions
    const searchCondition = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    } : {};

    let recipients = {
      superadmins: [],
      tenants: [],
      users: []
    };

    // Get superadmins
    if (type === 'all' || type === 'superadmins') {
      const superadmins = await prisma.superAdmin.findMany({
        where: {
          ...searchCondition,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { name: 'asc' }
      });

      recipients.superadmins = superadmins.map(sa => ({
        id: sa.id,
        name: sa.name,
        email: sa.email,
        type: 'superadmin',
        isActive: sa.isActive,
        createdAt: sa.createdAt
      }));
    }

    // Get tenants
    if (type === 'all' || type === 'tenants') {
      const tenants = await prisma.tenant.findMany({
        where: {
          ...searchCondition,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { users: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      recipients.tenants = tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        email: `${tenant.slug}@tenant`, // Placeholder for tenant identification
        type: 'tenant',
        isActive: tenant.isActive,
        userCount: tenant._count.users,
        createdAt: tenant.createdAt
      }));
    }

    // Get users
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          ...searchCondition,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          userRoles: {
            select: {
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      recipients.users = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        type: 'user',
        isActive: user.isActive,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug
        } : null,
        roles: user.userRoles.map(ur => ur.role.name),
        createdAt: user.createdAt
      }));
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Recipients fetched successfully');
      console.log(`📊 Superadmins: ${recipients.superadmins.length}`);
      console.log(`📊 Tenants: ${recipients.tenants.length}`);
      console.log(`📊 Users: ${recipients.users.length}`);
    }

    return createSuccessResponse({
      recipients,
      stats: {
        totalSuperadmins: recipients.superadmins.length,
        totalTenants: recipients.tenants.length,
        totalUsers: recipients.users.length
      }
    }, 'Recipients fetched successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching recipients:', error);
    }
    throw error;
  }
});
