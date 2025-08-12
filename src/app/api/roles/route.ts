import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/roles - List roles (Global + Tenant based on user type)
export const GET = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const scope = searchParams.get('scope'); // 'GLOBAL', 'TENANT', or 'ALL'
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  // Try SuperAdmin first, then Tenant Auth
  let authResult = await requireSuperAdmin(req);
  let isSuperAdmin = true;
  let tenantId: string | null = null;

  if (authResult instanceof NextResponse) {
    // Not SuperAdmin, try Tenant Auth
    authResult = await requireTenantAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    isSuperAdmin = false;
    tenantId = authResult.tenantId;
  }

  try {
    // Build where clause based on user type
    const where: any = {};
    
    if (isSuperAdmin) {
      // SuperAdmin can see all roles
      if (scope === 'GLOBAL') {
        where.scope = 'GLOBAL';
        where.tenantId = null;
      } else if (scope === 'TENANT') {
        where.scope = 'TENANT';
      }
      // If scope is 'ALL' or not specified, show all roles
    } else {
      // Tenant users can see global roles + their own tenant roles
      where.OR = [
        { scope: 'GLOBAL', tenantId: null },
        { scope: 'TENANT', tenantId: tenantId }
      ];
    }
    
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
      
      if (where.OR) {
        // If we already have OR conditions, we need to combine them
        where.AND = [
          { OR: where.OR },
          searchCondition
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }
    
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        tenantOverrides: {
          where: tenantId ? { tenantId } : undefined,
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalRoles = await prisma.role.count({ where });
    const totalPages = Math.ceil(totalRoles / limit);

    // Transform the data and apply tenant overrides
    const transformedRoles = roles.map(role => {
      // Get base permissions
      const basePermissions = role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.moduleKey,
        action: rp.permission.action,
        isGranted: true
      }));

      // Apply tenant overrides if this is a global role and we have a tenant context
      let finalPermissions = basePermissions;
      if (role.scope === 'GLOBAL' && tenantId && role.tenantOverrides.length > 0) {
        const overrideMap = new Map();
        role.tenantOverrides.forEach(override => {
          overrideMap.set(override.permissionId, override.isGranted);
        });

        finalPermissions = basePermissions.map(permission => ({
          ...permission,
          isGranted: overrideMap.has(permission.id) ? overrideMap.get(permission.id) : true
        }));
      }

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        scope: role.scope,
        isActive: role.isActive,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
        userCount: role._count.userRoles,
        permissions: finalPermissions,
        hasOverrides: role.tenantOverrides.length > 0
      };
    });

    await createAuditLogFromRequest(req, authResult, 'role.list', {
      rolesCount: transformedRoles.length,
      isSuperAdmin,
      tenantId,
      filters: { search, status, scope, sortBy, sortOrder, page, limit }
    });

    return createSuccessResponse({ 
      roles: transformedRoles,
      pagination: {
        page,
        limit,
        totalRoles,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Roles retrieved successfully');
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
});
