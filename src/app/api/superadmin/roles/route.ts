import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createGlobalRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.object({
    module_id: z.string(),
    actions: z.array(z.string())
  })).optional(),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0),
  isDefault: z.boolean().default(false),
  isTemplate: z.boolean().default(false)
});

// GET /api/superadmin/roles - List all global roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      roleScope: 'global',
      tenantId: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch roles with user count
    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  tenantId: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.role.count({ where })
    ]);

    // Transform data for response
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      roleScope: role.roleScope,
      isActive: role.isActive,
      isDefault: role.isDefault,
      isTemplate: role.isTemplate,
      isSystem: role.isSystem,
      color: role.color,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role.userRoles.length,
      assignedUsers: role.userRoles.map(ur => ({
        id: ur.user.id,
        name: ur.user.name,
        email: ur.user.email,
        tenantId: ur.user.tenantId
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        roles: transformedRoles,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching global roles:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch global roles' },
      { status: 500 }
    );
  }
}

// POST /api/superadmin/roles - Create global role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createGlobalRoleSchema.parse(body);

    // Check if role name already exists globally
    const existingRole = await prisma.role.findFirst({
      where: {
        name: validatedData.name,
        roleScope: 'global',
        tenantId: null
      }
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, message: 'Role name already exists globally' },
        { status: 400 }
      );
    }

    // Create role and permissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the role
      const role = await tx.role.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          roleScope: 'global',
          tenantId: null,
          color: validatedData.color,
          priority: validatedData.priority,
          isDefault: validatedData.isDefault,
          isTemplate: validatedData.isTemplate,
          isSystem: false,
          createdBy: 'superadmin' // You might want to get this from auth context
        }
      });

      // Assign permissions if provided
      if (validatedData.permissions && validatedData.permissions.length > 0) {
        for (const perm of validatedData.permissions) {
          // Find or create permissions for this module and actions
          const permissions = await tx.permission.findMany({
            where: {
              moduleKey: perm.module_id,
              action: { in: perm.actions },
              isActive: true
            }
          });

          // Create role permissions
          const rolePermissions = permissions.map(permission => ({
            roleId: role.id,
            permissionId: permission.id,
            tenantId: null, // Global permissions
            isAllowed: true
          }));

          if (rolePermissions.length > 0) {
            await tx.rolePermission.createMany({
              data: rolePermissions
            });
          }
        }
      }

      return role;
    });

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: result.id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                tenantId: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Global role created successfully',
      data: {
        role: {
          id: createdRole!.id,
          name: createdRole!.name,
          description: createdRole!.description,
          roleScope: createdRole!.roleScope,
          isActive: createdRole!.isActive,
          isDefault: createdRole!.isDefault,
          isTemplate: createdRole!.isTemplate,
          color: createdRole!.color,
          priority: createdRole!.priority,
          createdAt: createdRole!.createdAt,
          updatedAt: createdRole!.updatedAt,
          userCount: createdRole!.userRoles.length
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating global role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create global role' },
      { status: 500 }
    );
  }
} 