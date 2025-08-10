"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

// Types
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  description?: string;
  permissions: string[];
  children?: MenuItem[];
  hasChildren: boolean;
}

export interface ModulePermission {
  [moduleKey: string]: string[];
}

export interface UserPermissions {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    };
    roles: Array<{
      id: string;
      name: string;
      description: string;
      isDefault: boolean;
    }>;
  };
  permissions: string[];
  modulePermissions: ModulePermission;
  accessibleModules: string[];
  menuItems: MenuItem[];
  hasAccess: boolean;
  totalPermissions: number;
  totalModules: number;
}

interface DynamicPermissionsContextType {
  // State
  userPermissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  hasAccess: boolean;
  
  // Permission checks
  hasPermission: (moduleKey: string, action: string) => boolean;
  hasAnyPermission: (moduleKey: string) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccessModule: (moduleKey: string) => boolean;
  canPerformAction: (moduleKey: string, action: string) => boolean;
  
  // Menu utilities
  getMenuItems: () => MenuItem[];
  getModulePermissions: (moduleKey: string) => string[];
  
  // Actions
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

const DynamicPermissionsContext = createContext<DynamicPermissionsContextType | undefined>(undefined);

export const useDynamicPermissions = () => {
  const context = useContext(DynamicPermissionsContext);
  if (context === undefined) {
    // Add debugging to understand when this happens
    console.warn('useDynamicPermissions called outside of DynamicPermissionsProvider - using fallback context');
    
    // Return a fallback context instead of throwing an error
    // This allows components to render during SSR or when provider is not yet available
    return {
      userPermissions: null,
      isLoading: true,
      error: null,
      isInitialized: false,
      hasAccess: false,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasRole: () => false,
      canAccessModule: () => false,
      canPerformAction: () => false,
      getMenuItems: () => [],
      getModulePermissions: () => [],
      refreshPermissions: async () => {},
      clearPermissions: () => {}
    };
  }
  return context;
};

interface DynamicPermissionsProviderProps {
  children: ReactNode;
}

export const DynamicPermissionsProvider: React.FC<DynamicPermissionsProviderProps> = ({ children }) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserPermissions = useCallback(async () => {
    if (!tenantSlug) {
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      if (!token) {
        // No token means user is not authenticated - this is normal for login pages
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      const response = await axios.get(`/api/tenant/${tenantSlug}/permissions/current-user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const permissionsData = response.data.data;
        setUserPermissions(permissionsData);
        
        // Store in localStorage for offline access
        localStorage.setItem('user_permissions', JSON.stringify(permissionsData));
        localStorage.setItem('permissions_timestamp', Date.now().toString());
      } else {
        throw new Error(response.data.message || 'Failed to fetch user permissions');
      }
    } catch (err: any) {
      console.error('Error fetching user permissions:', err);
      
      // Only set error if it's not a missing token (which is normal for login pages)
      if (err.message !== 'No authentication token found') {
        setError(err.response?.data?.message || err.message || 'Failed to fetch user permissions');
      }
      
      // Try to load from localStorage as fallback
      const cachedPermissions = localStorage.getItem('user_permissions');
      const timestamp = localStorage.getItem('permissions_timestamp');
      
      if (cachedPermissions && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        // Use cached data if less than 1 hour old
        if (cacheAge < 60 * 60 * 1000) {
          try {
            const parsedPermissions = JSON.parse(cachedPermissions);
            setUserPermissions(parsedPermissions);
            console.log('Using cached permissions');
          } catch (parseError) {
            console.error('Error parsing cached permissions:', parseError);
          }
        }
      }
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('user_permissions');
        localStorage.removeItem('permissions_timestamp');
        window.location.href = `/${tenantSlug}/login`;
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [tenantSlug]);

  const hasPermission = useCallback((moduleKey: string, action: string): boolean => {
    if (!userPermissions) return false;
    
    const permissionKey = `${moduleKey}:${action}`;
    return userPermissions.permissions.includes(permissionKey);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((moduleKey: string): boolean => {
    if (!userPermissions) return false;
    
    return userPermissions.permissions.some(permission => 
      permission.startsWith(`${moduleKey}:`)
    );
  }, [userPermissions]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!userPermissions) return false;
    
    return userPermissions.user.roles.some(role => 
      role.name.toLowerCase() === roleName.toLowerCase()
    );
  }, [userPermissions]);

  const canAccessModule = useCallback((moduleKey: string): boolean => {
    if (!userPermissions) return false;
    
    return userPermissions.accessibleModules.includes(moduleKey);
  }, [userPermissions]);

  const canPerformAction = useCallback((moduleKey: string, action: string): boolean => {
    if (!userPermissions) return false;
    
    const modulePerms = userPermissions.modulePermissions[moduleKey];
    if (!modulePerms) return false;
    
    return modulePerms.includes(action);
  }, [userPermissions]);

  const getMenuItems = useCallback((): MenuItem[] => {
    if (!userPermissions) return [];
    
    // If menu items are empty, return fallback items
    if (userPermissions.menuItems.length === 0) {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "LayoutDashboard",
          path: "/dashboard",
          description: "Main dashboard with overview and analytics",
          permissions: ["dashboard:view"],
          hasChildren: false
        },
        {
          id: "utilities",
          label: "Settings",
          icon: "Settings",
          path: "/utilities",
          description: "System and tenant settings",
          permissions: ["settings:view"],
          hasChildren: false
        }
      ];
    }
    
    return userPermissions.menuItems;
  }, [userPermissions]);

  const getModulePermissions = useCallback((moduleKey: string): string[] => {
    if (!userPermissions) return [];
    
    return userPermissions.modulePermissions[moduleKey] || [];
  }, [userPermissions]);

  const refreshPermissions = useCallback(async () => {
    await fetchUserPermissions();
  }, [fetchUserPermissions]);

  const clearPermissions = useCallback(() => {
    setUserPermissions(null);
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('permissions_timestamp');
  }, []);

  // Check if user has access (has permissions and is authenticated)
  // Also return true if we have fallback menu items available
  const hasAccess = useCallback((): boolean => {
    return userPermissions !== null && userPermissions.hasAccess;
  }, [userPermissions]);

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

  const value: DynamicPermissionsContextType = {
    userPermissions,
    isLoading,
    error,
    isInitialized,
    hasAccess: hasAccess(),
    hasPermission,
    hasAnyPermission,
    hasRole,
    canAccessModule,
    canPerformAction,
    getMenuItems,
    getModulePermissions,
    refreshPermissions,
    clearPermissions
  };

  return (
    <DynamicPermissionsContext.Provider value={value}>
      {children}
    </DynamicPermissionsContext.Provider>
  );
}; 