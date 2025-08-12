import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/superadmin/modules - Get all modules
export const GET = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const modules = await prisma.module.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          where: { isActive: true },
          orderBy: { action: 'asc' }
        },
        childModules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    // Transform the data to match the expected format
    const transformedModules = modules.map(module => ({
      id: module.id,
      moduleKey: module.moduleKey,
      moduleName: module.moduleName,
      description: module.description,
      icon: module.icon,
      path: module.path,
      isActive: module.isActive,
      isVisible: module.isVisible,
      orderIndex: module.orderIndex,
      permissions: module.permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        action: permission.action,
        moduleKey: permission.moduleKey,
        resource: permission.resource,
        isActive: permission.isActive
      }))
    }));

    await createAuditLogFromRequest(req, authResult, 'module.list', {
      modulesCount: transformedModules.length
    });

    return createSuccessResponse({ modules: transformedModules }, 'Modules retrieved successfully');
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
});

