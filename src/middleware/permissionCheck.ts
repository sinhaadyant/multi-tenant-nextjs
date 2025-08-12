import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, requireTenantAuth } from '@/middleware/auth';
import { createErrorResponse } from '@/lib/apiResponse';

export interface PermissionCheckResult {
  hasPermission: boolean;
  roleId?: string;
  roleName?: string;
  scope?: string;
  overridesApplied?: boolean;
}

/**
 * Check if a user has a specific permission
 * This function handles both global and tenant roles with overrides
 */
export const checkUserPermission = async (
  userId: string,
  permissionName: string,
  tenantId?: string
): Promise<PermissionCheckResult> => {
  try {
    // Get user's roles with permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                },
                tenantOverrides: tenantId ? {
                  where: { tenantId },
                  include: {
                    permission: true
                  }
                } : undefined
              }
            }
          }
        }
      }
    });

    if (!user) {
      return { hasPermission: false };
    }

    // Check each role for the permission
    for (const userRole of user.userRoles) {
      const role = userRole.role;
      
      // Skip inactive roles
      if (!role.isActive) {
        continue;
      }

      // Get base permissions for this role
      const basePermissions = role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        isGranted: true
      }));

      // Apply tenant overrides if this is a global role and we have a tenant context
      let finalPermissions = basePermissions;
      if (role.scope === 'GLOBAL' && tenantId && role.tenantOverrides.length > 0) {
        const overrideMap = new Map();
        role.tenantOverrides.forEach(override => {
          overrideMap.set(override.permissionId, override.isGranted);
        });

        finalPermissions = basePermissions.map(permission => ({
          ...permission,
          isGranted: overrideMap.has(permission.id) ? overrideMap.get(permission.id) : true
        }));
      }

      // Check if the permission exists and is granted
      const permission = finalPermissions.find(p => p.name === permissionName);
      if (permission && permission.isGranted) {
        return {
          hasPermission: true,
          roleId: role.id,
          roleName: role.name,
          scope: role.scope,
          overridesApplied: role.scope === 'GLOBAL' && tenantId && role.tenantOverrides.length > 0
        };
      }
    }

    return { hasPermission: false };
  } catch (error) {
    console.error('Error checking user permission:', error);
    return { hasPermission: false };
  }
};

/**
 * Middleware factory for checking specific permissions
 */
export const requirePermission = (permissionName: string) => {
  return async (req: NextRequest): Promise<NextResponse | any> => {
    // Try SuperAdmin first, then Tenant Auth
    let authResult = await requireSuperAdmin(req);
    let isSuperAdmin = true;
    let tenantId: string | null = null;

    if (authResult instanceof NextResponse) {
      // Not SuperAdmin, try Tenant Auth
      authResult = await requireTenantAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      isSuperAdmin = false;
      tenantId = authResult.tenantId;
    }

    // SuperAdmin has all permissions
    if (isSuperAdmin) {
      return authResult;
    }

    // Check permission for tenant users
    const permissionResult = await checkUserPermission(
      authResult.id,
      permissionName,
      tenantId
    );

    if (!permissionResult.hasPermission) {
      return createErrorResponse(
        `Permission '${permissionName}' required`,
        403
      );
    }

    // Add permission context to the request
    (req as any).permissionContext = {
      ...permissionResult,
      permissionName
    };

    return authResult;
  };
};

/**
 * Check if a user has any of the specified permissions
 */
export const requireAnyPermission = (permissionNames: string[]) => {
  return async (req: NextRequest): Promise<NextResponse | any> => {
    // Try SuperAdmin first, then Tenant Auth
    let authResult = await requireSuperAdmin(req);
    let isSuperAdmin = true;
    let tenantId: string | null = null;

    if (authResult instanceof NextResponse) {
      // Not SuperAdmin, try Tenant Auth
      authResult = await requireTenantAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      isSuperAdmin = false;
      tenantId = authResult.tenantId;
    }

    // SuperAdmin has all permissions
    if (isSuperAdmin) {
      return authResult;
    }

    // Check each permission
    for (const permissionName of permissionNames) {
      const permissionResult = await checkUserPermission(
        authResult.id,
        permissionName,
        tenantId
      );

      if (permissionResult.hasPermission) {
        // Add permission context to the request
        (req as any).permissionContext = {
          ...permissionResult,
          permissionName
        };
        return authResult;
      }
    }

    return createErrorResponse(
      `One of the following permissions required: ${permissionNames.join(', ')}`,
      403
    );
  };
};

/**
 * Check if a user has all of the specified permissions
 */
export const requireAllPermissions = (permissionNames: string[]) => {
  return async (req: NextRequest): Promise<NextResponse | any> => {
    // Try SuperAdmin first, then Tenant Auth
    let authResult = await requireSuperAdmin(req);
    let isSuperAdmin = true;
    let tenantId: string | null = null;

    if (authResult instanceof NextResponse) {
      // Not SuperAdmin, try Tenant Auth
      authResult = await requireTenantAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      isSuperAdmin = false;
      tenantId = authResult.tenantId;
    }

    // SuperAdmin has all permissions
    if (isSuperAdmin) {
      return authResult;
    }

    // Check all permissions
    const missingPermissions: string[] = [];
    
    for (const permissionName of permissionNames) {
      const permissionResult = await checkUserPermission(
        authResult.id,
        permissionName,
        tenantId
      );

      if (!permissionResult.hasPermission) {
        missingPermissions.push(permissionName);
      }
    }

    if (missingPermissions.length > 0) {
      return createErrorResponse(
        `All of the following permissions required: ${missingPermissions.join(', ')}`,
        403
      );
    }

    // Add permission context to the request
    (req as any).permissionContext = {
      hasPermission: true,
      permissionNames
    };

    return authResult;
  };
};

/**
 * Get all permissions for a user (useful for debugging or UI)
 */
export const getUserPermissions = async (
  userId: string,
  tenantId?: string
): Promise<{
  permissions: Array<{
    id: string;
    name: string;
    description: string;
    module: string;
    action: string;
    isGranted: boolean;
    roleId: string;
    roleName: string;
    scope: string;
    isOverridden: boolean;
  }>;
  roles: Array<{
    id: string;
    name: string;
    scope: string;
    hasOverrides: boolean;
  }>;
}> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                },
                tenantOverrides: tenantId ? {
                  where: { tenantId },
                  include: {
                    permission: true
                  }
                } : undefined
              }
            }
          }
        }
      }
    });

    if (!user) {
      return { permissions: [], roles: [] };
    }

    const permissions: any[] = [];
    const roles: any[] = [];

    for (const userRole of user.userRoles) {
      const role = userRole.role;
      
      if (!role.isActive) {
        continue;
      }

      roles.push({
        id: role.id,
        name: role.name,
        scope: role.scope,
        hasOverrides: role.tenantOverrides.length > 0
      });

      // Get base permissions
      const basePermissions = role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.moduleKey,
        action: rp.permission.action,
        isGranted: true,
        roleId: role.id,
        roleName: role.name,
        scope: role.scope,
        isOverridden: false
      }));

      // Apply tenant overrides
      let finalPermissions = basePermissions;
      if (role.scope === 'GLOBAL' && tenantId && role.tenantOverrides.length > 0) {
        const overrideMap = new Map();
        role.tenantOverrides.forEach(override => {
          overrideMap.set(override.permissionId, override.isGranted);
        });

        finalPermissions = basePermissions.map(permission => ({
          ...permission,
          isGranted: overrideMap.has(permission.id) ? overrideMap.get(permission.id) : true,
          isOverridden: overrideMap.has(permission.id)
        }));
      }

      permissions.push(...finalPermissions);
    }

    // Remove duplicates (same permission from multiple roles)
    const uniquePermissions = permissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    );

    return {
      permissions: uniquePermissions,
      roles
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { permissions: [], roles: [] };
  }
};
