import { useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import type { Permission, PermissionAction, PermissionModule } from "@/types";

export const usePermissions = () => {
  const auth = useAppSelector((state) => state.auth);

  // Check if user has specific permission
  const hasPermission = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return false;
      }

      // Superadmin bypass for all permissions
      if (auth.user?.is_superadmin) {
        return true;
      }

      // Check specific permission
      return auth.permissions.some(
        (permission) =>
          permission.module_id === module &&
          permission[`can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof Permission] === true
      );
    },
    [auth.user, auth.permissions]
  );

  // Check if user can view all data (data scope)
  const canViewAll = useCallback(
    (module: PermissionModule): boolean => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return false;
      }

      // Superadmin can view all data
      if (auth.user?.is_superadmin) {
        return true;
      }

      // Check canViewAll permission for module
      return auth.permissions.some(
        (permission) =>
          permission.module_id === module && permission.can_view_all === true
      );
    },
    [auth.user, auth.permissions]
  );

  // Check if user can create
  const canCreate = useCallback(
    (module: PermissionModule): boolean => {
      return hasPermission(module, "create");
    },
    [hasPermission]
  );

  // Check if user can read
  const canRead = useCallback(
    (module: PermissionModule): boolean => {
      return hasPermission(module, "read");
    },
    [hasPermission]
  );

  // Check if user can update
  const canUpdate = useCallback(
    (module: PermissionModule): boolean => {
      return hasPermission(module, "update");
    },
    [hasPermission]
  );

  // Check if user can delete
  const canDelete = useCallback(
    (module: PermissionModule): boolean => {
      return hasPermission(module, "delete");
    },
    [hasPermission]
  );

  // Get all permissions for a module
  const getModulePermissions = useCallback(
    (module: PermissionModule) => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return {
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        };
      }

      // Superadmin has all permissions
      if (auth.user?.is_superadmin) {
        return {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canViewAll: true,
        };
      }

      // Find module permissions
      const modulePermission = auth.permissions.find(
        (permission) => permission.module_id === module
      );

      return {
        canCreate: modulePermission?.can_create || false,
        canRead: modulePermission?.can_read || false,
        canUpdate: modulePermission?.can_update || false,
        canDelete: modulePermission?.can_delete || false,
        canViewAll: modulePermission?.can_view_all || false,
      };
    },
    [auth.user, auth.permissions]
  );

  // Check if user has any permission for a module
  const hasAnyPermission = useCallback(
    (module: PermissionModule): boolean => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return false;
      }

      // Superadmin has all permissions
      if (auth.user?.is_superadmin) {
        return true;
      }

      // Check if user has any permission for the module
      return auth.permissions.some((permission) => permission.module_id === module);
    },
    [auth.user, auth.permissions]
  );

  // Get data scope for a module (all data vs own data)
  const getDataScope = useCallback(
    (module: PermissionModule): "all" | "own" => {
      if (!auth.user?.is_superadmin && auth.permissions.length === 0) {
        return "own";
      }

      // Superadmin can see all data
      if (auth.user?.is_superadmin) {
        return "all";
      }

      // Check canViewAll permission
      const canViewAllData = auth.permissions.some(
        (permission) =>
          permission.module_id === module && permission.can_view_all === true
      );

      return canViewAllData ? "all" : "own";
    },
    [auth.user, auth.permissions]
  );

  // Check if user is superadmin
  const isSuperadmin = useCallback((): boolean => {
    return auth.user?.is_superadmin || false;
  }, [auth.user]);

  // Check if user is authenticated
  const isAuthenticated = useCallback((): boolean => {
    return auth.isAuthenticated;
  }, [auth.isAuthenticated]);

  return {
    // Permission checks
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canViewAll,
    hasAnyPermission,

    // Data scope
    getDataScope,

    // User info
    isSuperadmin,
    isAuthenticated,

    // Raw data
    permissions: auth.permissions,
    user: auth.user,
  };
};

