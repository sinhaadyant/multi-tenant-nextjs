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
      parentModuleKey: module.parentModuleKey,
      version: module.version,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString()
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

// PUT /api/superadmin/modules - Update module order and visibility
export const PUT = asyncHandler(async (req: NextRequest) => {
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { updates } = await req.json();

  if (!updates || !Array.isArray(updates)) {
    return createErrorResponse('Updates array is required', 400);
  }

  try {
    // Update modules in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const updatedModules = [];

      for (const update of updates) {
        if (!update.id || typeof update.orderIndex !== 'number') {
          throw new Error('Each update must have id and orderIndex');
        }

        const updatedModule = await tx.module.update({
          where: { id: update.id },
          data: {
            orderIndex: update.orderIndex,
            isVisible: update.isVisible !== undefined ? update.isVisible : undefined,
            isActive: update.isActive !== undefined ? update.isActive : undefined
          }
        });

        updatedModules.push(updatedModule);
      }

      return updatedModules;
    });

    // Create audit log
    await createAuditLogFromRequest(req, authResult, 'module.bulk_update', {
      updatedModulesCount: results.length,
      updates: updates.map(u => ({ id: u.id, orderIndex: u.orderIndex, isVisible: u.isVisible, isActive: u.isActive }))
    });

    return createSuccessResponse({ modules: results }, 'Modules updated successfully');
  } catch (error) {
    console.error('Error updating modules:', error);
    throw error;
  }
});

