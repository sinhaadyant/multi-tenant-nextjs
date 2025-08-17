import React from "react";
import { useApiQuery } from "./useApiQuery";
import { usePermissions } from "./usePermissions";
import { useAuth } from "./useAuth";
import type { Module } from "@/types";

export interface MenuItem {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  route?: string;
  is_active: boolean;
  order: number;
  parent_id?: string;
  children?: MenuItem[];
  permissions?: {
    can_read: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_view_all: boolean;
  };
}

export interface MenuResponse {
  modules: Module[];
  user_permissions: Record<string, any>;
}

export const useMenu = () => {
  const { hasAnyPermission } = usePermissions();
  const { user } = useAuth();

  const {
    data: menuData,
    isLoading,
    error,
    refetch,
  } = useApiQuery<MenuResponse>(["menu"], "/modules/menu", {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Transform modules to menu items and filter by permissions
  const menuItems = React.useMemo(() => {
    if (!menuData?.data?.modules) return [];

    const transformModule = (module: Module): MenuItem | null => {
      // Check if user has any permission for this module
      if (!hasAnyPermission(module.key)) {
        return null;
      }

      const menuItem: MenuItem = {
        id: module.id,
        name: module.name,
        key: module.key,
        description: module.description,
        icon: module.icon,
        route: module.route,
        is_active: module.is_active,
        order: module.order,
        parent_id: module.parent_id,
        permissions: {
          can_read: true, // Will be filtered by hasAnyPermission
          can_create: false,
          can_update: false,
          can_delete: false,
          can_view_all: false,
        },
      };

      // Add children if they exist
      if (module.children && module.children.length > 0) {
        const children = module.children
          .map(transformModule)
          .filter(Boolean) as MenuItem[];

        if (children.length > 0) {
          menuItem.children = children;
        }
      }

      return menuItem;
    };

    // Get top-level modules (no parent_id)
    const topLevelModules = menuData.data.modules
      .filter(module => !module.parent_id)
      .map(transformModule)
      .filter(Boolean) as MenuItem[];

    // Sort by order
    let finalMenuItems = topLevelModules.sort((a, b) => a.order - b.order);

    // Add tenant management for superadmin users
    if (user?.is_superadmin) {
      const tenantManagementItem: MenuItem = {
        id: "tenant-management",
        name: "Tenant Management",
        key: "tenant-management",
        description: "Manage multi-tenant organizations",
        icon: "Building",
        route: "/tenants",
        is_active: true,
        order: 100, // High order to place it at the end
        permissions: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
          can_view_all: true,
        },
      };

      finalMenuItems.push(tenantManagementItem);
    }

    return finalMenuItems;
  }, [menuData, hasAnyPermission, user?.is_superadmin]);

  // Get menu item by key
  const getMenuItemByKey = React.useCallback(
    (key: string): MenuItem | undefined => {
      const findItem = (items: MenuItem[]): MenuItem | undefined => {
        for (const item of items) {
          if (item.key === key) return item;
          if (item.children) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      return findItem(menuItems);
    },
    [menuItems]
  );

  // Get breadcrumb for current route
  const getBreadcrumb = React.useCallback(
    (currentPath: string): MenuItem[] => {
      const breadcrumb: MenuItem[] = [];

      const findPath = (items: MenuItem[], path: string): boolean => {
        for (const item of items) {
          if (item.route === path) {
            breadcrumb.push(item);
            return true;
          }
          if (item.children) {
            breadcrumb.push(item);
            if (findPath(item.children, path)) {
              return true;
            }
            breadcrumb.pop();
          }
        }
        return false;
      };

      findPath(menuItems, currentPath);
      return breadcrumb;
    },
    [menuItems]
  );

  // Check if menu item is active
  const isMenuItemActive = React.useCallback(
    (item: MenuItem, currentPath: string): boolean => {
      if (item.route === currentPath) return true;

      if (item.children) {
        return item.children.some(child =>
          isMenuItemActive(child, currentPath)
        );
      }

      return false;
    },
    []
  );

  return {
    menuItems,
    isLoading,
    error,
    refetch,
    getMenuItemByKey,
    getBreadcrumb,
    isMenuItemActive,
  };
};
