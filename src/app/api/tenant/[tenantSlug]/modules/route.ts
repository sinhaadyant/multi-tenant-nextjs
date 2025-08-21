import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { checkTenantPermission } from '@/lib/permissions';

// Permission constants for module management
const MODULE_PERMISSIONS = {
  VIEW_MODULES: 'modules.view',
  ENABLE_DISABLE_MODULES: 'modules.enable_disable',
  MANAGE_MODULE_VERSIONS: 'modules.manage_versions',
  VIEW_MODULE_ANALYTICS: 'modules.view_analytics'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { tenantModules: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user has access to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check view modules permission
    const hasViewPermission = await checkTenantPermission(
      user,
      tenant.id,
      MODULE_PERMISSIONS.VIEW_MODULES
    );

    if (!hasViewPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to view modules' }, { status: 403 });
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

              // Include analytics if requested and user has permission
        if (includeAnalytics) {
          const hasAnalyticsPermission = checkTenantPermission(
            user,
            tenant.id,
            MODULE_PERMISSIONS.VIEW_MODULE_ANALYTICS
          );

          if (hasAnalyticsPermission && tenantModule) {
            (baseModule as any).analytics = {
              lastAccessedAt: tenantModule.lastAccessedAt,
              accessCount: tenantModule.accessCount
            };
          }
        }

      return baseModule;
    });

    // Check additional permissions for UI controls
    const hasEnableDisablePermission = await checkTenantPermission(
      user,
      tenant.id,
      MODULE_PERMISSIONS.ENABLE_DISABLE_MODULES
    );

    const hasVersionManagementPermission = await checkTenantPermission(
      user,
      tenant.id,
      MODULE_PERMISSIONS.MANAGE_MODULE_VERSIONS
    );

    return NextResponse.json({
      success: true,
      data: {
        modules: modulesWithTenantSettings,
        permissions: {
          canViewModules: true,
          canEnableDisableModules: hasEnableDisablePermission,
          canManageVersions: hasVersionManagementPermission,
          canViewAnalytics: includeAnalytics && await checkTenantPermission(
            user,
            tenant.id,
            MODULE_PERMISSIONS.VIEW_MODULE_ANALYTICS
          )
        }
      }
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { tenantSlug } = await params;
    const body = await request.json();
    const { action, moduleKey, settings, version } = body;

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Handle different actions
    switch (action) {
      case 'enable':
      case 'disable': {
        const hasPermission = await checkTenantPermission(
          user,
          tenant.id,
          MODULE_PERMISSIONS.ENABLE_DISABLE_MODULES
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions to enable/disable modules' },
            { status: 403 }
          );
        }

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
            enabledBy: isEnabled ? user.id : null,
            disabledBy: !isEnabled ? user.id : null,
            updatedAt: new Date()
          },
          create: {
            tenantId: tenant.id,
            moduleKey,
            isEnabled,
            isVisible: isEnabled,
            enabledAt: isEnabled ? new Date() : null,
            disabledAt: !isEnabled ? new Date() : null,
            enabledBy: isEnabled ? user.id : null,
            disabledBy: !isEnabled ? user.id : null
          }
        });

        // Log the action
        await prisma.auditLog.create({
          data: {
            action: `module_${action}`,
            details: JSON.stringify({
              moduleKey,
              isEnabled,
              userId: user.id,
              userName: user.name
            }),
            tenantId: tenant.id,
            userId: user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        });

        return NextResponse.json({
          success: true,
          data: { tenantModule }
        });
      }

      case 'update_settings': {
        const hasPermission = await checkTenantPermission(
          user,
          tenant.id,
          MODULE_PERMISSIONS.ENABLE_DISABLE_MODULES
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions to update module settings' },
            { status: 403 }
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
            settings: JSON.stringify(settings),
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          data: { tenantModule }
        });
      }

      case 'update_version': {
        const hasPermission = await checkTenantPermission(
          user,
          tenant.id,
          MODULE_PERMISSIONS.MANAGE_MODULE_VERSIONS
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions to manage module versions' },
            { status: 403 }
          );
        }

        // Validate version compatibility
        const module = await prisma.module.findUnique({
          where: { moduleKey }
        });

        if (!module) {
          return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        if (module.minVersion && version < module.minVersion) {
          return NextResponse.json(
            { error: `Version ${version} is below minimum required version ${module.minVersion}` },
            { status: 400 }
          );
        }

        if (module.maxVersion && version > module.maxVersion) {
          return NextResponse.json(
            { error: `Version ${version} exceeds maximum supported version ${module.maxVersion}` },
            { status: 400 }
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

        // Log version update
        await prisma.auditLog.create({
          data: {
            action: 'module_version_update',
            details: JSON.stringify({
              moduleKey,
              version,
              userId: user.id,
              userName: user.name
            }),
            tenantId: tenant.id,
            userId: user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        });

        return NextResponse.json({
          success: true,
          data: { tenantModule }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 