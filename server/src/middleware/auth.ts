import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { UserService } from '@/services/userService';
import { permissionService } from '@/services/PermissionService';
import { AuthenticationError, AuthorizationError } from '@/utils/errors';
import { logger } from '@/config/logger';

// Enhanced user interface with permissions
export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId?: string;
  isSuperadmin: boolean;
  isActive: boolean;
  permissions: {
    [moduleKey: string]: {
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canViewAll: boolean;
    };
  };
  dataScopes: {
    [moduleKey: string]: {
      scope: 'all' | 'tenant' | 'own';
      tenantId?: string;
      userId?: string;
    };
  };
}

// Extend Express Request interface to include enhanced user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const userService = new UserService();

// Cache for permission resolution (15-minute TTL)
const permissionCache = new Map<string, { data: any; timestamp: number }>();
const PERMISSION_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Helper function to get cached permissions
const getCachedPermissions = (userId: string): any | null => {
  const cached = permissionCache.get(userId);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > PERMISSION_CACHE_TTL) {
    permissionCache.delete(userId);
    return null;
  }

  return cached.data;
};

// Helper function to set cached permissions
const setCachedPermissions = (userId: string, data: any): void => {
  permissionCache.set(userId, {
    data,
    timestamp: Date.now(),
  });
};

// Helper function to resolve user permissions
const resolveUserPermissions = async (
  userId: string
): Promise<{
  permissions: { [moduleKey: string]: any };
  dataScopes: { [moduleKey: string]: any };
}> => {
  try {
    // Check cache first
    const cached = getCachedPermissions(userId);
    if (cached) {
      logger.debug(`Using cached permissions for user ${userId}`);
      return cached;
    }

    logger.debug(`Resolving permissions for user ${userId}`);

    // Get user permissions from PermissionService
    const userPermissions = await permissionService.getUserPermissions(userId);

    // Transform permissions to module-based mapping
    const permissions: { [moduleKey: string]: any } = {};
    const dataScopes: { [moduleKey: string]: any } = {};

    // Process each permission
    for (const permission of userPermissions.permissions) {
      const moduleKey = permission.moduleName || permission.moduleId;

      if (!permissions[moduleKey]) {
        permissions[moduleKey] = {
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        };
      }

      // Merge permissions (OR logic)
      permissions[moduleKey].canCreate =
        permissions[moduleKey].canCreate || permission.canCreate;
      permissions[moduleKey].canRead =
        permissions[moduleKey].canRead || permission.canRead;
      permissions[moduleKey].canUpdate =
        permissions[moduleKey].canUpdate || permission.canUpdate;
      permissions[moduleKey].canDelete =
        permissions[moduleKey].canDelete || permission.canDelete;
      permissions[moduleKey].canViewAll =
        permissions[moduleKey].canViewAll || permission.canViewAll;
    }

    // Pre-calculate data scopes for common modules
    const commonModules = [
      'Users',
      'Roles',
      'Support',
      'Dashboard',
      'Notifications',
    ];
    for (const moduleKey of commonModules) {
      try {
        const scope = await permissionService.getDataScope(userId, moduleKey);
        dataScopes[moduleKey] = scope;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.warn(
          `Failed to get data scope for module ${moduleKey}: ${errorMessage}`
        );
        // Default to own scope on error
        dataScopes[moduleKey] = { scope: 'own', userId };
      }
    }

    const result = { permissions, dataScopes };

    // Cache the result
    setCachedPermissions(userId, result);

    logger.debug(
      `Resolved permissions for user ${userId}: ${Object.keys(permissions).length} modules`
    );
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      `Failed to resolve permissions for user ${userId}: ${errorMessage}`
    );
    // Return empty permissions on error (fail secure)
    return { permissions: {}, dataScopes: {} };
  }
};

// Enhanced authentication middleware with permission resolution
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyAccessToken(token);

      // Load user from database to ensure they still exist and are active
      const user = await userService.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Resolve user permissions
      const { permissions, dataScopes } = await resolveUserPermissions(
        decoded.userId
      );

      // Create enhanced user object
      const authenticatedUser: AuthenticatedUser = {
        id: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
        isSuperadmin: decoded.isSuperadmin,
        isActive: user.isActive,
        permissions,
        dataScopes,
      };

      req.user = authenticatedUser;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = verifyAccessToken(token);

        // Resolve permissions for optional auth as well
        const { permissions, dataScopes } = await resolveUserPermissions(
          decoded.userId
        );

        const authenticatedUser: AuthenticatedUser = {
          id: decoded.userId,
          email: decoded.email,
          tenantId: decoded.tenantId,
          isSuperadmin: decoded.isSuperadmin,
          isActive: true, // Default to true for optional auth
          permissions,
          dataScopes,
        };

        req.user = authenticatedUser;
      } catch (error) {
        // Token is invalid but we don't fail the request
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`Invalid token in optional auth: ${errorMessage}`);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Superadmin only middleware
export const superadminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!req.user.isSuperadmin) {
    throw new AuthorizationError('Superadmin access required');
  }

  next();
};

// Tenant user middleware (non-superadmin)
export const requireTenant = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (req.user.isSuperadmin) {
    throw new AuthorizationError('Tenant user access required');
  }

  if (!req.user.tenantId) {
    throw new AuthorizationError('Tenant context required');
  }

  next();
};

// Permission-based middleware
export const requirePermission = (
  moduleKey: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'view_all'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Superadmin bypass
    if (req.user.isSuperadmin) {
      return next();
    }

    const modulePermissions = req.user.permissions[moduleKey];
    if (!modulePermissions) {
      throw new AuthorizationError(`No permissions for module: ${moduleKey}`);
    }

    // Map action to permission property
    const actionMap: { [key: string]: keyof typeof modulePermissions } = {
      create: 'canCreate',
      read: 'canRead',
      update: 'canUpdate',
      delete: 'canDelete',
      view_all: 'canViewAll',
    };

    const permissionKey = actionMap[action];
    if (!permissionKey) {
      throw new AuthorizationError(`Invalid action: ${action}`);
    }

    const hasPermission = modulePermissions[permissionKey];

    if (!hasPermission) {
      throw new AuthorizationError(
        `Insufficient permissions: ${action} on ${moduleKey}`
      );
    }

    next();
  };
};

// Data scope middleware
export const requireDataScope = (
  moduleKey: string,
  scope: 'all' | 'tenant' | 'own'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Superadmin can access all data
    if (req.user.isSuperadmin) {
      return next();
    }

    const moduleScope = req.user.dataScopes[moduleKey];
    if (!moduleScope) {
      throw new AuthorizationError(`No data scope for module: ${moduleKey}`);
    }

    // Check if user has required scope level
    const scopeLevels = { all: 3, tenant: 2, own: 1 };
    const userScopeLevel = scopeLevels[moduleScope.scope];
    const requiredScopeLevel = scopeLevels[scope];

    if (userScopeLevel < requiredScopeLevel) {
      throw new AuthorizationError(
        `Insufficient data scope: ${scope} required, ${moduleScope.scope} available`
      );
    }

    next();
  };
};

// Utility function to clear permission cache for a user
export const clearUserPermissionCache = (userId: string): void => {
  permissionCache.delete(userId);
  logger.debug(`Cleared permission cache for user ${userId}`);
};

// Utility function to clear all permission cache
export const clearAllPermissionCache = (): void => {
  permissionCache.clear();
  logger.debug('Cleared all permission cache');
};

// Utility function to get permission cache statistics
export const getPermissionCacheStats = (): {
  size: number;
  entries: Array<{ userId: string; age: number }>;
} => {
  const now = Date.now();
  const entries = Array.from(permissionCache.entries()).map(
    ([userId, value]) => ({
      userId,
      age: now - value.timestamp,
    })
  );

  return {
    size: permissionCache.size,
    entries,
  };
};
