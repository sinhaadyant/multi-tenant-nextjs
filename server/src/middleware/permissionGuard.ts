import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '@/services/permissionService';
import { AuthorizationError } from '@/utils/errors';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'viewAll';

export interface PermissionGuardOptions {
  moduleKey: string;
  action: PermissionAction;
  requireTenant?: boolean;
  allowSuperadmin?: boolean;
}

export const permissionGuard = (options: PermissionGuardOptions) => {
  const {
    moduleKey,
    action,
    requireTenant = true,
    allowSuperadmin = true,
  } = options;

  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Superadmin bypass (if allowed)
      if (allowSuperadmin && req.user.isSuperadmin) {
        return next();
      }

      // Check if tenant is required and available
      if (requireTenant && !req.tenant) {
        throw new AuthorizationError('Tenant context required');
      }

      // For tenant users, ensure they have a tenant
      if (!req.user.isSuperadmin && !req.user.tenantId) {
        throw new AuthorizationError('Tenant access required');
      }

      // Initialize permission service
      const permissionService = new PermissionService();

      // Get user's effective permissions for the specific module
      const effectivePermissions =
        await permissionService.getEffectivePermissions(
          req.user.userId,
          moduleKey
        );

      // Check if user has permission for the specific action
      const hasPermission = checkPermission(effectivePermissions, action);

      if (!hasPermission) {
        throw new AuthorizationError(
          `Access denied: ${action} permission required for ${moduleKey}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper function to check if user has specific permission
const checkPermission = (
  permissions: any,
  action: PermissionAction
): boolean => {
  // Check specific action permission
  switch (action) {
    case 'create':
      return permissions.canCreate === true;
    case 'read':
      return permissions.canRead === true;
    case 'update':
      return permissions.canUpdate === true;
    case 'delete':
      return permissions.canDelete === true;
    case 'viewAll':
      return permissions.canViewAll === true;
    default:
      return false;
  }
};

// Convenience middleware for common permission patterns
export const requireCreate = (moduleKey: string) =>
  permissionGuard({ moduleKey, action: 'create' });

export const requireRead = (moduleKey: string) =>
  permissionGuard({ moduleKey, action: 'read' });

export const requireUpdate = (moduleKey: string) =>
  permissionGuard({ moduleKey, action: 'update' });

export const requireDelete = (moduleKey: string) =>
  permissionGuard({ moduleKey, action: 'delete' });

export const requireViewAll = (moduleKey: string) =>
  permissionGuard({ moduleKey, action: 'viewAll' });

// Middleware for superadmin-only endpoints
export const superadminOnly = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthorizationError('Authentication required');
  }

  if (!req.user.isSuperadmin) {
    throw new AuthorizationError('Superadmin access required');
  }

  next();
};

// Middleware for tenant-only endpoints (no superadmin)
export const tenantOnly = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthorizationError('Authentication required');
  }

  if (req.user.isSuperadmin) {
    throw new AuthorizationError('Tenant user access required');
  }

  if (!req.tenant) {
    throw new AuthorizationError('Tenant context required');
  }

  next();
};
