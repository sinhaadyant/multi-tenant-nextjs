import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/roles - Get all roles (for tenant management)
export const GET = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const roleType = searchParams.get('roleType'); // 'global', 'tenant', or 'all'
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // Debug logging
    console.log('🔍 Roles API Debug:', {
      tenantId,
      roleType,
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    });

    // Build where clause
    const where: any = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
      console.log('🔍 Filtering by tenantId:', tenantId);
    } else if (roleType === 'global') {
      where.isGlobal = true;
      console.log('🔍 Filtering for global roles only');
    } else if (roleType === 'tenant') {
      where.isGlobal = false;
      console.log('🔍 Filtering for tenant roles only');
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
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
            module: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
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
      tenantId: role.tenantId,
      tenantName: role.tenant?.name,
      tenantSlug: role.tenant?.slug,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role._count.userRoles,
      permissions: role.permissions.flatMap(rp => {
        const permissions = [];
        if (rp.canCreate) permissions.push({ id: `${rp.id}-create`, moduleKey: rp.moduleKey, action: 'create' });
        if (rp.canRead) permissions.push({ id: `${rp.id}-read`, moduleKey: rp.moduleKey, action: 'view' });
        if (rp.canUpdate) permissions.push({ id: `${rp.id}-update`, moduleKey: rp.moduleKey, action: 'edit' });
        if (rp.canDelete) permissions.push({ id: `${rp.id}-delete`, moduleKey: rp.moduleKey, action: 'delete' });
        return permissions;
      })
    }));

    await createAuditLogFromRequest(req, authResult, 'role.list', {
      rolesCount: transformedRoles.length,
      tenantId,
      roleType,
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
  if (!authResult.success) {
    return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
  }

  const { 
    name, 
    description, 
    isTemplate = false, 
    permissions = [], 
    tenantId,
    isGlobal = false 
  } = await req.json();

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

  // Validate role type
  if (isGlobal && tenantId) {
    return createErrorResponse('Global roles cannot have a tenant ID', 400, [
      { field: 'tenantId', message: 'Global roles cannot have a tenant ID' }
    ]);
  }

  if (!isGlobal && !tenantId) {
    return createErrorResponse('Tenant roles must have a tenant ID', 400, [
      { field: 'tenantId', message: 'Tenant roles must have a tenant ID' }
    ]);
  }

  try {
    // Check for duplicate role name within the same tenant (or global)
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: name.trim(),
        tenantId: isGlobal ? null : tenantId
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
          tenantId: isGlobal ? null : tenantId,
          isGlobal,
          createdBy: authResult.user.id
        }
      });

      // Assign permissions if provided
      if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((permissionData: any) => ({
          roleId: role.id,
          moduleKey: permissionData.moduleKey,
          canCreate: permissionData.canCreate || false,
          canRead: permissionData.canRead || false,
          canUpdate: permissionData.canUpdate || false,
          canDelete: permissionData.canDelete || false,
          canViewAll: permissionData.canViewAll || false,
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
            module: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
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
      tenantId: createdRole.tenantId,
      tenantName: createdRole.tenant?.name,
      tenantSlug: createdRole.tenant?.slug,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
      userCount: createdRole._count.userRoles,
      permissions: createdRole.permissions.map(rp => ({
        moduleKey: rp.moduleKey,
        moduleName: rp.module.moduleName,
        canCreate: rp.canCreate,
        canRead: rp.canRead,
        canUpdate: rp.canUpdate,
        canDelete: rp.canDelete,
        canViewAll: rp.canViewAll,
      }))
    };

    await createAuditLogFromRequest(req, authResult, 'role.create', {
      roleId: result.id,
      roleName: result.name,
      isGlobal: result.isGlobal,
      tenantId: result.tenantId,
      permissionsCount: permissions.length,
      isTemplate: result.isTemplate
    });

    return createSuccessResponse({ role: transformedRole }, 'Role created successfully', 201);
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}); 