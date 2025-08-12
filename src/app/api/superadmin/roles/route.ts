import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/roles - Get all roles (for tenant management)
export const GET = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // Build where clause
    const where: any = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
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

    // Transform the data to match the expected format
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isGlobal: role.isGlobal,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role._count.userRoles,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action
      }))
    }));

    await createAuditLogFromRequest(req, authResult, 'role.list', {
      rolesCount: transformedRoles.length,
      tenantId,
      filters: { search, status, sortBy, sortOrder, page, limit }
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

// POST /api/superadmin/roles - Create new role (for tenant management)
export const POST = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name, description, isTemplate = false, permissions = [], tenantId } = await req.json();

  // Validation
  if (!name || name.trim().length === 0) {
    return createErrorResponse('Role name is required', 400, [
      { field: 'name', message: 'Role name is required' }
    ]);
  }

  if (name.trim().length < 3) {
    return createErrorResponse('Role name must be at least 3 characters', 400, [
      { field: 'name', message: 'Role name must be at least 3 characters' }
    ]);
  }

  if (name.trim().length > 50) {
    return createErrorResponse('Role name must be less than 50 characters', 400, [
      { field: 'name', message: 'Role name must be less than 50 characters' }
    ]);
  }

  try {
    // Check for duplicate role name within the same tenant
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: name.trim(),
        tenantId: tenantId || null
      }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists', 409, [
        { field: 'name', message: 'Role name already exists' }
      ]);
    }

    // Create role with permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isTemplate,
          isActive: true,
          tenantId: tenantId || null
        }
      });

      // Assign permissions if provided
      if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((permissionId: string) => ({
          roleId: role.id,
          permissionId
        }));

        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }

      return role;
    });

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: result.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      }
    });

    if (!createdRole) {
      throw new Error('Failed to fetch created role');
    }

    // Transform the data
    const transformedRole = {
      id: createdRole.id,
      name: createdRole.name,
      description: createdRole.description,
      isGlobal: createdRole.isGlobal,
      isActive: createdRole.isActive,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
      userCount: createdRole._count.userRoles,
      permissions: createdRole.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action
      }))
    };

    await createAuditLogFromRequest(req, authResult, 'role.create', {
      roleId: result.id,
      roleName: result.name,
      permissionsCount: permissions.length,
      isTemplate: result.isTemplate
    });

    return createSuccessResponse({ role: transformedRole }, 'Role created successfully', 201);
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}); 