import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/tenant/[tenantSlug]/roles - Get all roles for the tenant
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to view roles
    const hasRolePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'roles' && 
        (rp.permission.action === 'read' || rp.permission.action === 'manage')
      )
    );

    if (!hasRolePermission) {
      return createErrorResponse('Insufficient permissions to view roles', 403);
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      OR: [
        { tenantId: user.tenant!.id }, // Tenant-specific roles
        { isTemplate: true } // Global template roles from SuperAdmin
      ],
      isActive: true
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch roles with pagination
    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where: whereClause,
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
        orderBy: [
          { isTemplate: 'asc' }, // Template roles first
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.role.count({ where: whereClause })
    ]);

    // Transform the data
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isTemplate: role.isTemplate,
      isActive: role.isActive,
      isDefault: role.isDefault,
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

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'role.list', {
      tenantId: user.tenant!.id,
      rolesCount: transformedRoles.length
    });

    return createSuccessResponse({
      roles: transformedRoles,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, 'Roles retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return createErrorResponse('Failed to fetch roles', 500);
  }
});

// POST /api/tenant/[tenantSlug]/roles - Create new role for the tenant
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to create roles
    const hasCreatePermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'roles' && 
        rp.permission.action === 'create'
      )
    );

    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create roles', 403);
    }

    const { name, description, permissions = [] } = await req.json();

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

    // Check for duplicate role name within the tenant
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: name.trim(),
        tenantId: user.tenant.id
      }
    });

    if (existingRole) {
      return createErrorResponse('Role name already exists in this tenant', 409, [
        { field: 'name', message: 'Role name already exists in this tenant' }
      ]);
    }

    // Create role with permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isTemplate: false, // Tenant-specific role
          isActive: true,
          tenantId: user.tenant.id
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
      isTemplate: createdRole.isTemplate,
      isActive: createdRole.isActive,
      isDefault: createdRole.isDefault,
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

    await createAuditLogFromRequest(req, { id: user.id, email: user.email, role: 'user' }, 'role.create', {
      roleId: result.id,
      roleName: result.name,
      tenantId: user.tenant!.id,
      permissionsCount: permissions.length
    });

    return createSuccessResponse({ role: transformedRole }, 'Role created successfully', 201);
  } catch (error: any) {
    console.error('Error creating role:', error);
    return createErrorResponse('Failed to create role', 500);
  }
}); 