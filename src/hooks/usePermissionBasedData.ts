import { useMemo } from 'react';
import { useReduxAuth } from '@/hooks/useReduxAuth';

export interface DataItem {
  id: string;
  tenantId?: string;
  createdBy?: string;
  [key: string]: any;
}

export interface PermissionBasedDataOptions {
  data: DataItem[];
  viewAllPermission?: string;
  viewOwnPermission?: string;
  userId?: string;
  tenantId?: string;
}

/**
 * Hook for filtering data based on user permissions
 * If user has viewAll permission, they can see all data
 * If user only has viewOwn permission, they can only see their own data
 * If user has neither permission, they see no data
 */
export const usePermissionBasedData = ({
  data,
  viewAllPermission = 'viewAll',
  viewOwnPermission = 'viewOwn',
  userId,
  tenantId
}: PermissionBasedDataOptions) => {
  const { hasPermission, user } = useReduxAuth();

  const filteredData = useMemo(() => {
    // If no data provided, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Check if user has viewAll permission
    const canViewAll = hasPermission('*', viewAllPermission) || 
                      hasPermission('all', viewAllPermission) ||
                      hasPermission('data', viewAllPermission);

    // If user can view all, return all data
    if (canViewAll) {
      return data;
    }

    // Check if user has viewOwn permission
    const canViewOwn = hasPermission('*', viewOwnPermission) || 
                      hasPermission('own', viewOwnPermission) ||
                      hasPermission('data', viewOwnPermission);

    // If user can only view own data
    if (canViewOwn) {
      const currentUserId = userId || user?.id;
      const currentTenantId = tenantId || user?.tenantId;

      return data.filter(item => {
        // Filter by tenant ID if available
        if (currentTenantId && item.tenantId && item.tenantId !== currentTenantId) {
          return false;
        }

        // Filter by user ID if available
        if (currentUserId && item.createdBy && item.createdBy !== currentUserId) {
          return false;
        }

        return true;
      });
    }

    // If user has no permissions, return empty array
    return [];
  }, [data, viewAllPermission, viewOwnPermission, userId, tenantId, hasPermission, user]);

  return {
    data: filteredData,
    canViewAll: hasPermission('*', viewAllPermission) || 
                hasPermission('all', viewAllPermission) ||
                hasPermission('data', viewAllPermission),
    canViewOwn: hasPermission('*', viewOwnPermission) || 
                hasPermission('own', viewOwnPermission) ||
                hasPermission('data', viewOwnPermission),
    totalCount: data?.length || 0,
    filteredCount: filteredData.length,
    hasAccess: filteredData.length > 0
  };
};

/**
 * Hook for checking if user can perform specific actions on data
 */
export const useDataPermissions = (module: string) => {
  const { hasPermission } = useReduxAuth();

  return {
    canView: hasPermission(module, 'read'),
    canCreate: hasPermission(module, 'create'),
    canUpdate: hasPermission(module, 'update'),
    canDelete: hasPermission(module, 'delete'),
    canViewAll: hasPermission(module, 'viewall'),
    hasAnyPermission: hasPermission(module, 'read') || hasPermission(module, 'create') || hasPermission(module, 'update') || hasPermission(module, 'delete')
  };
};

/**
 * Hook for checking if user can access a specific module
 */
export const useModuleAccess = (module: string) => {
  const { hasAnyPermission } = useReduxAuth();

  return {
    hasAccess: hasAnyPermission(module),
    canView: hasAnyPermission(module),
  };
};
