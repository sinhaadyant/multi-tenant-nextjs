import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setPermissions,
  setPermissionsLoading,
  setPermissionsError,
  setPermissionsInitialized,
  setTenantSlug,
  clearPermissions,
  refreshPermissions,
  selectUserPermissions,
  selectPermissionsLoading,
  selectPermissionsError,
  selectPermissionsInitialized,
  selectLastFetched,
  selectTenantSlug,
  selectHasPermission,
  selectHasAnyPermission,
  selectHasRole,
  selectCanAccessModule,
  selectMenuItems,
  selectModulePermissions,
  type UserPermissions,
} from '@/store/slices/permissionsSlice';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { simpleStorage } from '@/lib/simpleStorage';

export const usePermissions = () => {
  const dispatch = useAppDispatch();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  // Selectors
  const userPermissions = useAppSelector(selectUserPermissions);
  const isLoading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);
  const isInitialized = useAppSelector(selectPermissionsInitialized);
  const lastFetched = useAppSelector(selectLastFetched);
  const currentTenantSlug = useAppSelector(selectTenantSlug);

  const fetchUserPermissions = useCallback(async () => {
    if (!tenantSlug) {
      dispatch(setPermissionsLoading(false));
      dispatch(setPermissionsInitialized(true));
      return;
    }

    try {
      dispatch(setPermissionsLoading(true));
      dispatch(setPermissionsError(null));
      dispatch(setTenantSlug(tenantSlug));

      const token = simpleStorage.getAuthToken();
      
      if (!token) {
        // No token means user is not authenticated - this is normal for login pages
        dispatch(setPermissionsLoading(false));
        dispatch(setPermissionsInitialized(true));
        return;
      }

      const response = await api.get(`/tenant/${tenantSlug}/permissions/current-user`);

      if (response.data.success) {
        const permissionsData = response.data;
        
        // Ensure the permissions data has the expected structure
        const validatedPermissionsData: UserPermissions = {
          user: permissionsData.user || {
            id: '',
            name: '',
            email: '',
            isActive: false,
            createdAt: new Date().toISOString(),
            tenant: {
              id: '',
              name: '',
              slug: '',
              isActive: false
            },
            roles: []
          },
          permissions: permissionsData.permissions || [],
          modulePermissions: permissionsData.modulePermissions || {},
          accessibleModules: permissionsData.accessibleModules || [],
          menuItems: permissionsData.menuItems || [],
          hasAccess: permissionsData.hasAccess || false,
          totalPermissions: permissionsData.totalPermissions || 0,
          totalModules: permissionsData.totalModules || 0
        };
        
        dispatch(setPermissions(validatedPermissionsData));
      } else {
        throw new Error(response.data.message || 'Failed to fetch user permissions');
      }
    } catch (err: any) {
      console.error('Error fetching user permissions:', err);
      
      // Only set error if it's not a missing token (which is normal for login pages)
      if (err.message !== 'No authentication token found') {
        dispatch(setPermissionsError(err.response?.data?.message || err.message || 'Failed to fetch user permissions'));
      }
      
      // If unauthorized, clear permissions and redirect to login
      if (err.response?.status === 401) {
        dispatch(clearPermissions());
        window.location.href = `/${tenantSlug}/login`;
      }
    }
  }, [tenantSlug, dispatch]);

  const hasPermission = useCallback((moduleKey: string, action: string): boolean => {
    if (!userPermissions || !userPermissions.permissions || !Array.isArray(userPermissions.permissions)) return false;
    
    const permissionKey = `${moduleKey}:${action}`;
    return userPermissions.permissions.includes(permissionKey);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((moduleKey: string): boolean => {
    if (!userPermissions || !userPermissions.permissions || !Array.isArray(userPermissions.permissions)) return false;
    
    return userPermissions.permissions.some(permission => 
      permission && typeof permission === 'string' && permission.startsWith(`${moduleKey}:`)
    );
  }, [userPermissions]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!userPermissions || !userPermissions.user || !userPermissions.user.roles || !Array.isArray(userPermissions.user.roles)) return false;
    
    return userPermissions.user.roles.some(role => 
      role && role.name && typeof role.name === 'string' && role.name.toLowerCase() === roleName.toLowerCase()
    );
  }, [userPermissions]);

  const canAccessModule = useCallback((moduleKey: string): boolean => {
    if (!userPermissions || !userPermissions.accessibleModules || !Array.isArray(userPermissions.accessibleModules)) return false;
    
    return userPermissions.accessibleModules.includes(moduleKey);
  }, [userPermissions]);

  const canPerformAction = useCallback((moduleKey: string, action: string): boolean => {
    if (!userPermissions || !userPermissions.modulePermissions) return false;
    
    const modulePerms = userPermissions.modulePermissions[moduleKey];
    if (!modulePerms || !Array.isArray(modulePerms)) return false;
    
    return modulePerms.includes(action);
  }, [userPermissions]);

  const getMenuItems = useCallback((): any[] => {
    if (!userPermissions || !userPermissions.menuItems || !Array.isArray(userPermissions.menuItems)) return [];
    
    // If menu items are empty, return fallback items with proper tenant slug
    if (userPermissions.menuItems.length === 0) {
      const tenantSlug = userPermissions.user?.tenant?.slug;
      if (!tenantSlug) return [];
      
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "LayoutDashboard",
          path: `/${tenantSlug}/dashboard`,
          description: "Main dashboard with overview and analytics",
          permissions: ["dashboard:view"],
          hasChildren: false
        },
        {
          id: "users",
          label: "Users",
          icon: "Users",
          path: `/${tenantSlug}/users`,
          description: "Manage users and their roles",
          permissions: ["users:view"],
          hasChildren: false
        },
        {
          id: "roles",
          label: "Roles",
          icon: "Shield",
          path: `/${tenantSlug}/roles`,
          description: "Manage roles and permissions",
          permissions: ["roles:view"],
          hasChildren: false
        },
        {
          id: "audit",
          label: "Audit Logs",
          icon: "ClipboardList",
          path: `/${tenantSlug}/audit`,
          description: "View system audit logs",
          permissions: ["audit:view"],
          hasChildren: false
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: "Bell",
          path: `/${tenantSlug}/notifications`,
          description: "Manage notifications",
          permissions: ["notifications:view"],
          hasChildren: false
        },
        {
          id: "settings",
          label: "Settings",
          icon: "Settings",
          path: `/${tenantSlug}/settings`,
          description: "System and tenant settings",
          permissions: ["settings:view"],
          hasChildren: false
        },
        {
          id: "support",
          label: "Support",
          icon: "LifeBuoy",
          path: `/${tenantSlug}/support`,
          description: "Support tickets and help",
          permissions: ["support:view"],
          hasChildren: false
        }
      ];
    }
    
    return userPermissions.menuItems;
  }, [userPermissions]);

  const getModulePermissions = useCallback((moduleKey: string): string[] => {
    if (!userPermissions || !userPermissions.modulePermissions) return [];
    
    return userPermissions.modulePermissions[moduleKey] || [];
  }, [userPermissions]);

  const refreshPermissions = useCallback(async () => {
    dispatch(refreshPermissions());
    await fetchUserPermissions();
  }, [fetchUserPermissions, dispatch]);

  const clearPermissionsData = useCallback(() => {
    dispatch(clearPermissions());
  }, [dispatch]);

  // Check if user has access (has permissions and is authenticated)
  const hasAccess = useCallback((): boolean => {
    return userPermissions !== null && userPermissions.hasAccess === true;
  }, [userPermissions]);

  // Fetch permissions on mount and when tenantSlug changes
  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Set up periodic refresh (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (userPermissions && !isLoading) {
        fetchUserPermissions();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [fetchUserPermissions, userPermissions, isLoading]);

  return {
    // State
    userPermissions,
    isLoading,
    error,
    isInitialized,
    lastFetched,
    tenantSlug: currentTenantSlug,
    hasAccess: hasAccess(),
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasRole,
    canAccessModule,
    canPerformAction,
    
    // Menu utilities
    getMenuItems,
    getModulePermissions,
    
    // Actions
    refreshPermissions,
    clearPermissions: clearPermissionsData,
    fetchUserPermissions,
  };
};
