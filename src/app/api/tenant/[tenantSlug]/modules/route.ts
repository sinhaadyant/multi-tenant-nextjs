import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/tenant/[tenantSlug]/modules - Get modules for tenant
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const { searchParams } = new URL(req.url);
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { tenantModules: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Get all available modules
    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        },
        childModules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    // Get tenant-specific module settings
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: tenant.id },
      include: {
        module: {
          include: {
            rolePermissions: {
              include: {
                role: true
              }
            },
            childModules: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    // Merge module data with tenant-specific settings
    const modulesWithTenantSettings = modules.map(module => {
      const tenantModule = tenantModules.find(tm => tm.moduleKey === module.moduleKey);
      
      const baseModule = {
        id: module.id,
        moduleKey: module.moduleKey,
        moduleName: module.moduleName,
        path: module.path,
        icon: module.icon,
        description: module.description,
        version: module.version,
        minVersion: module.minVersion,
        maxVersion: module.maxVersion,
        releaseNotes: module.releaseNotes,
        isVisible: module.isVisible,
        orderIndex: module.orderIndex,
        permissions: module.rolePermissions,
        childModules: module.childModules,
        // Tenant-specific settings
        isEnabled: tenantModule?.isEnabled ?? true,
        isVisibleInTenant: tenantModule?.isVisible ?? true,
        tenantVersion: tenantModule?.version,
        tenantSettings: tenantModule?.settings ? JSON.parse(tenantModule.settings) : null,
        enabledAt: tenantModule?.enabledAt,
        disabledAt: tenantModule?.disabledAt,
        enabledBy: tenantModule?.enabledBy,
        disabledBy: tenantModule?.disabledBy
      };

      // Include analytics if requested
      if (includeAnalytics && tenantModule) {
        (baseModule as any).analytics = {
          lastAccessedAt: tenantModule.lastAccessedAt,
          accessCount: tenantModule.accessCount
        };
      }

      return baseModule;
    });

    return createSuccessResponse({
      modules: modulesWithTenantSettings,
      permissions: {
        canViewModules: true,
        canEnableDisableModules: true, // Simplified for now
        canManageVersions: true,
        canViewAnalytics: includeAnalytics
      }
    }, 'Modules retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching modules:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch modules',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/modules - Manage modules
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const body = await req.json();
    const { action, moduleKey, settings, version } = body;

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Handle different actions
    switch (action) {
      case 'enable':
      case 'disable': {
        const isEnabled = action === 'enable';
        
        // Upsert tenant module setting
        const tenantModule = await prisma.tenantModule.upsert({
          where: {
            tenantId_moduleKey: {
              tenantId: tenant.id,
              moduleKey
            }
          },
          update: {
            isEnabled,
            isVisible: isEnabled, // Auto-show when enabled
            enabledAt: isEnabled ? new Date() : null,
            disabledAt: !isEnabled ? new Date() : null,
            enabledBy: isEnabled ? userId : null,
            disabledBy: !isEnabled ? userId : null,
            updatedAt: new Date()
          },
          create: {
            tenantId: tenant.id,
            moduleKey,
            isEnabled,
            isVisible: isEnabled,
            enabledAt: isEnabled ? new Date() : null,
            disabledAt: !isEnabled ? new Date() : null,
            enabledBy: isEnabled ? userId : null,
            disabledBy: !isEnabled ? userId : null
          }
        });

        return createSuccessResponse({
          tenantModule
        }, `Module ${action}d successfully`);
      }

      case 'update_settings': {
        const tenantModule = await prisma.tenantModule.update({
          where: {
            tenantId_moduleKey: {
              tenantId: tenant.id,
              moduleKey
            }
          },
          data: {
            settings: JSON.stringify(settings),
            updatedAt: new Date()
          }
        });

        return createSuccessResponse({
          tenantModule
        }, 'Module settings updated successfully');
      }

      case 'update_version': {
        // Validate version compatibility
        const module = await prisma.module.findUnique({
          where: { moduleKey }
        });

        if (!module) {
          return createErrorResponse('Module not found', 404);
        }

        if (module.minVersion && version < module.minVersion) {
          return createErrorResponse(
            `Version ${version} is below minimum required version ${module.minVersion}`,
            400
          );
        }

        if (module.maxVersion && version > module.maxVersion) {
          return createErrorResponse(
            `Version ${version} exceeds maximum supported version ${module.maxVersion}`,
            400
          );
        }

        const tenantModule = await prisma.tenantModule.update({
          where: {
            tenantId_moduleKey: {
              tenantId: tenant.id,
              moduleKey
            }
          },
          data: {
            version,
            updatedAt: new Date()
          }
        });

        return createSuccessResponse({
          tenantModule
        }, 'Module version updated successfully');
      }

      default:
        return createErrorResponse('Invalid action', 400);
    }

  } catch (error: any) {
    console.error('Error managing modules:', error);
    return createErrorResponse(
      error.message || 'Failed to manage modules',
      error.status || 500
    );
  }
}); 