import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserWithRolesByEmail, checkTenantPermission } from '@/lib/permissions';

export interface ModuleAccessConfig {
  moduleKey: string;
  requiredPermission?: string;
  checkModuleEnabled?: boolean;
  redirectTo?: string;
}

/**
 * Middleware to check module access for a user
 * @param request - Next.js request object
 * @param tenantSlug - Tenant slug from URL params
 * @param config - Module access configuration
 * @returns NextResponse or null if access is allowed
 */
export async function checkModuleAccess(
  request: NextRequest,
  tenantSlug: string,
  config: ModuleAccessConfig
): Promise<NextResponse | null> {
  try {
    // Get user session (you'll need to implement this based on your auth setup)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Get user with roles and permissions
    const user = await getUserWithRolesByEmail(session.user.email, tenant.id);
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check if module is enabled for the tenant
    if (config.checkModuleEnabled !== false) {
      const tenantModule = await prisma.tenantModule.findUnique({
        where: {
          tenantId_moduleKey: {
            tenantId: tenant.id,
            moduleKey: config.moduleKey
          }
        }
      });

      // If tenant module setting exists and is disabled, deny access
      if (tenantModule && !tenantModule.isEnabled) {
        return NextResponse.redirect(new URL(
          config.redirectTo || '/modules/disabled',
          request.url
        ));
      }

      // If no tenant module setting exists, check if the module exists and is active
      if (!tenantModule) {
        const module = await prisma.module.findUnique({
          where: { moduleKey: config.moduleKey }
        });

        if (!module || !module.isActive) {
          return NextResponse.redirect(new URL(
            config.redirectTo || '/modules/disabled',
            request.url
          ));
        }
      }
    }

    // Check required permission if specified
    if (config.requiredPermission) {
      const hasPermission = await checkTenantPermission(
        user,
        tenant.id,
        config.requiredPermission
      );

      if (!hasPermission) {
        return NextResponse.redirect(new URL(
          config.redirectTo || '/unauthorized',
          request.url
        ));
      }
    }

    // Update module access analytics
    await updateModuleAccessAnalytics(tenant.id, config.moduleKey);

    return null; // Access allowed
  } catch (error) {
    console.error('Error checking module access:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

/**
 * Update module access analytics
 * @param tenantId - Tenant ID
 * @param moduleKey - Module key
 */
async function updateModuleAccessAnalytics(tenantId: string, moduleKey: string) {
  try {
    await prisma.tenantModule.updateMany({
      where: {
        tenantId,
        moduleKey
      },
      data: {
        lastAccessedAt: new Date(),
        accessCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    // Silently fail analytics update
    console.warn('Failed to update module access analytics:', error);
  }
}

/**
 * Higher-order function to create module access middleware
 * @param config - Module access configuration
 * @returns Middleware function
 */
export function createModuleAccessMiddleware(config: ModuleAccessConfig) {
  return async function moduleAccessMiddleware(
    request: NextRequest,
    { params }: { params: { tenantSlug: string } }
  ) {
    return await checkModuleAccess(request, params.tenantSlug, config);
  };
}

// Predefined module access configurations
export const MODULE_ACCESS_CONFIGS = {
  DASHBOARD: {
    moduleKey: 'dashboard',
    requiredPermission: 'dashboard.view',
    checkModuleEnabled: true
  },
  USERS: {
    moduleKey: 'users',
    requiredPermission: 'users.view',
    checkModuleEnabled: true
  },
  ROLES: {
    moduleKey: 'roles',
    requiredPermission: 'roles.view',
    checkModuleEnabled: true
  },
  MODULES: {
    moduleKey: 'modules',
    requiredPermission: 'modules.view',
    checkModuleEnabled: true
  },
  REPORTS: {
    moduleKey: 'reports',
    requiredPermission: 'reports.view',
    checkModuleEnabled: true
  },
  SETTINGS: {
    moduleKey: 'settings',
    requiredPermission: 'settings.view',
    checkModuleEnabled: true
  },
  NOTIFICATIONS: {
    moduleKey: 'notifications',
    requiredPermission: 'notifications.view',
    checkModuleEnabled: true
  },
  SUPPORT: {
    moduleKey: 'support',
    requiredPermission: 'support.view',
    checkModuleEnabled: true
  }
} as const;

// Example usage in a page or API route:
// export const middleware = createModuleAccessMiddleware(MODULE_ACCESS_CONFIGS.USERS); 