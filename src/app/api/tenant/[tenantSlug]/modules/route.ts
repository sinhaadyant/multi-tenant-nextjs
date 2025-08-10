import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';

// GET /api/tenant/[tenantSlug]/modules - Get all available modules
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
                    permission: {
                      include: {
                        module: true
                      }
                    }
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

    // Check if user has permission to view modules
    const hasPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module.moduleKey === 'roles' && 
        (rp.permission.action === 'view' || rp.permission.action === 'manage')
      )
    );

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions to view modules', 403);
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includePermissions = searchParams.get('includePermissions') === 'true';

    // Build where clause
    const whereClause: any = {};
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Fetch modules with optional permissions
    const modules = await prisma.module.findMany({
      where: whereClause,
      include: includePermissions ? {
        permissions: {
          where: { isActive: true },
          orderBy: { action: 'asc' }
        }
      } : undefined,
      orderBy: [
        { orderIndex: 'asc' },
        { moduleName: 'asc' }
      ]
    });

    // Build hierarchical structure
    const buildModuleTree = (modules: any[], parentKey: string | null = null) => {
      return modules
        .filter(module => {
          if (parentKey === null) {
            return !module.parentModuleKey;
          }
          return module.parentModuleKey === parentKey;
        })
        .map(module => ({
          id: module.id,
          moduleKey: module.moduleKey,
          moduleName: module.moduleName,
          path: module.path,
          icon: module.icon,
          parentModuleKey: module.parentModuleKey,
          description: module.description,
          isActive: module.isActive,
          isVisible: module.isVisible,
          orderIndex: module.orderIndex,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
          permissions: module.permissions || [],
          children: buildModuleTree(modules, module.moduleKey)
        }));
    };

    const moduleTree = buildModuleTree(modules);

    return createSuccessResponse({
      modules: moduleTree,
      flatModules: modules.map(module => ({
        id: module.id,
        moduleKey: module.moduleKey,
        moduleName: module.moduleName,
        path: module.path,
        icon: module.icon,
        parentModuleKey: module.parentModuleKey,
        description: module.description,
        isActive: module.isActive,
        isVisible: module.isVisible,
        orderIndex: module.orderIndex,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        permissions: module.permissions || []
      })),
      totalModules: modules.length,
      activeModules: modules.filter(m => m.isActive).length,
      visibleModules: modules.filter(m => m.isVisible).length
    }, 'Modules retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching modules:', error);
    return createErrorResponse('Failed to fetch modules', 500);
  }
});

// POST /api/tenant/[tenantSlug]/modules - Create a new module
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

    // Check if user has permission to create modules
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
                    permission: {
                      include: {
                        module: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    const hasPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module.moduleKey === 'roles' && 
        rp.permission.action === 'create'
      )
    );

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions to create modules', 403);
    }

    const body = await req.json();
    const { moduleKey, moduleName, path, icon, parentModuleKey, description, orderIndex } = body;

    // Validate required fields
    if (!moduleKey || !moduleName) {
      return createErrorResponse('Module key and name are required', 400);
    }

    // Check if module key already exists
    const existingModule = await prisma.module.findUnique({
      where: { moduleKey }
    });

    if (existingModule) {
      return createErrorResponse('Module key already exists', 409);
    }

    // Create module
    const newModule = await prisma.module.create({
      data: {
        moduleKey,
        moduleName,
        path,
        icon,
        parentModuleKey,
        description,
        orderIndex: orderIndex || 0,
        isActive: true,
        isVisible: true
      }
    });

    return createSuccessResponse(newModule, 'Module created successfully', 201);

  } catch (error: any) {
    console.error('Error creating module:', error);
    return createErrorResponse('Failed to create module', 500);
  }
}); 